import { useRef } from 'react';
import { DEFAULT_PRICE_ALERTS, DEFAULT_STOCK_ALERTS } from '../data/demoFixtures';
import {
  applyAlertTransition,
  createPriceAlert,
  createStockAlert,
  dismissRequest,
  markManuallyNotified,
  normalizePriceAlert,
  normalizeStockAlert,
  upsertStockAlert,
} from '../features/alerts/notifications';
import type { Result } from '../features/catalog/productRecords';
import { canEditStock } from '../features/staff/actor';
import { normalizeArray, readJSON, STORAGE_KEYS } from '../lib/storage';
import type { DemoActor, PriceAlertRequest, Product, StockAlertRequest } from '../types';
import { usePersistentState } from './usePersistentState';

type WriteErrorHandler = (key: string, message: string) => void;

/**
 * Back-in-stock and price-drop requests. Nothing here sends messages: staff
 * contact customers manually and record it with markStockAlertManuallyNotified.
 */
export function useAlertsStore(
  actor: DemoActor,
  findStorefrontProduct: (id: string) => Product | undefined,
  onWriteError: WriteErrorHandler,
) {
  const [stockAlerts, setStockAlerts] = usePersistentState<StockAlertRequest[]>(
    STORAGE_KEYS.STOCK_ALERTS,
    () => readJSON(STORAGE_KEYS.STOCK_ALERTS, p => normalizeArray(p, normalizeStockAlert), () => [...DEFAULT_STOCK_ALERTS]).value,
    onWriteError,
  );
  const [priceAlerts, setPriceAlerts] = usePersistentState<PriceAlertRequest[]>(
    STORAGE_KEYS.PRICE_ALERTS,
    () => readJSON(STORAGE_KEYS.PRICE_ALERTS, p => normalizeArray(p, normalizePriceAlert), () => [...DEFAULT_PRICE_ALERTS]).value,
    onWriteError,
  );

  // Latest list for synchronous transitions (several may run in one event handler).
  const stockAlertsRef = useRef(stockAlerts);
  stockAlertsRef.current = stockAlerts;
  const commitStockAlerts = (next: StockAlertRequest[]) => {
    stockAlertsRef.current = next;
    setStockAlerts(next);
  };

  const addStockAlert = (productId: string, email: string): Result => {
    const outcome = createStockAlert(findStorefrontProduct(productId), email);
    if (!outcome.ok) return { success: false, error: outcome.error };
    commitStockAlerts(upsertStockAlert(stockAlertsRef.current, outcome.value));
    return { success: true };
  };

  const transition = (id: string, fn: typeof markManuallyNotified): Result => {
    if (!canEditStock(actor.role)) return { success: false, error: 'The Viewer role cannot update requests.' };
    const { list, outcome } = applyAlertTransition(stockAlertsRef.current, id, a => fn(a, actor));
    if (!outcome.ok) return { success: false, error: outcome.error };
    commitStockAlerts(list);
    return { success: true };
  };

  /** Staff confirm they contacted the customer outside the app. */
  const markStockAlertManuallyNotified = (id: string) => transition(id, markManuallyNotified);
  const dismissStockAlert = (id: string) => transition(id, dismissRequest);

  const addPriceAlert = (productId: string, email: string, targetPrice: number | null = null, dropPercentage?: number): Result => {
    const outcome = createPriceAlert(findStorefrontProduct(productId), email, targetPrice, dropPercentage);
    if (!outcome.ok) return { success: false, error: outcome.error };
    const e = outcome.value.email;
    setPriceAlerts(prev => [outcome.value, ...prev.filter(a => !(a.productId === productId && a.email.toLowerCase() === e))]);
    return { success: true };
  };

  const removePriceAlert = (id: string) => setPriceAlerts(prev => prev.filter(a => a.id !== id));

  const getPriceAlertsForProduct = (productId: string) => priceAlerts.filter(a => a.productId === productId && a.status === 'active');

  const resetAlertsDemo = () => {
    commitStockAlerts([...DEFAULT_STOCK_ALERTS]);
    setPriceAlerts([...DEFAULT_PRICE_ALERTS]);
  };

  return {
    stockAlerts,
    addStockAlert,
    markStockAlertManuallyNotified,
    dismissStockAlert,
    priceAlerts,
    addPriceAlert,
    removePriceAlert,
    getPriceAlertsForProduct,
    resetAlertsDemo,
  };
}
