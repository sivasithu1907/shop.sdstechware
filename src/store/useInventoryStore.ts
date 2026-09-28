import type { MutableRefObject } from 'react';
import { DEFAULT_STOCK_MOVEMENTS } from '../data/demoFixtures';
import { LOW_STOCK } from '../config/settings';
import { normalizeStockMovement } from '../features/inventory/history';
import {
  applyGoodsReceipt,
  applyStockCount,
  initialStockMovement,
  type GoodsReceiptInput,
  type GoodsReceiptResult,
} from '../features/inventory/restock';
import { clampThreshold, normalizeThresholdOverrides } from '../features/inventory/thresholds';
import { normalizeArray, readJSON, readString, STORAGE_KEYS, writeString } from '../lib/storage';
import type { DemoActor, Product, StockMovement } from '../types';
import { usePersistentState } from './usePersistentState';
import { useEffect, useState } from 'react';

type WriteErrorHandler = (key: string, message: string) => void;

export interface StockChangeResult {
  success: boolean;
  error?: string;
  unchanged?: boolean;
}

/**
 * All stock changes go through here so that:
 *  - the product update and its history record are committed together, and
 *  - a history record exists only for a change that actually succeeded.
 */
export function useInventoryStore(
  actor: DemoActor,
  productsRef: MutableRefObject<Product[]>,
  commitProducts: (next: Product[]) => void,
  onWriteError: WriteErrorHandler,
) {
  const [stockMovements, setStockMovements] = usePersistentState<StockMovement[]>(
    STORAGE_KEYS.RESTOCK_LOGS,
    () => readJSON(STORAGE_KEYS.RESTOCK_LOGS, p => normalizeArray(p, normalizeStockMovement), () => [...DEFAULT_STOCK_MOVEMENTS]).value,
    onWriteError,
  );

  // Low-stock thresholds (per-browser preferences)
  const [lowStockThreshold, setLowStockThresholdState] = useState<number>(() => {
    const raw = readString(STORAGE_KEYS.LOW_STOCK_THRESHOLD);
    const n = raw === null ? NaN : parseInt(raw, 10);
    return Number.isFinite(n) && n >= LOW_STOCK.minThreshold && n <= LOW_STOCK.maxThreshold ? n : LOW_STOCK.defaultThreshold;
  });
  useEffect(() => {
    const r = writeString(STORAGE_KEYS.LOW_STOCK_THRESHOLD, String(lowStockThreshold));
    if (!r.ok) onWriteError(STORAGE_KEYS.LOW_STOCK_THRESHOLD, r.error ?? 'Could not save threshold.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lowStockThreshold]);

  const [categoryThresholds, setCategoryThresholds] = usePersistentState<Record<string, number>>(
    STORAGE_KEYS.CATEGORY_THRESHOLDS,
    () =>
      readJSON(
        STORAGE_KEYS.CATEGORY_THRESHOLDS,
        p => {
          const n = normalizeThresholdOverrides(p);
          return n ? { value: { ...LOW_STOCK.defaultCategoryThresholds, ...n.value }, dropped: n.dropped } : null;
        },
        () => ({ ...LOW_STOCK.defaultCategoryThresholds }),
      ).value,
    onWriteError,
  );

  const setLowStockThreshold = (v: number) => setLowStockThresholdState(clampThreshold(v));

  const appendMovements = (movements: StockMovement[]) => {
    if (movements.length) setStockMovements(prev => [...movements, ...prev]);
  };

  /** Confirmed goods receipt (single or batch). Atomic: all lines or none. */
  const receiveGoods = (input: GoodsReceiptInput): GoodsReceiptResult => {
    const result = applyGoodsReceipt(productsRef.current, input, actor);
    if (result.ok) {
      commitProducts(result.products);
      appendMovements(result.movements);
    }
    return result;
  };

  /** Direct stock count / correction with a history record. */
  const setStockCount = (productId: string, newStock: number | null, notes?: string): StockChangeResult => {
    const result = applyStockCount(productsRef.current, productId, newStock, actor, new Date(), notes);
    if (!result.ok) return { success: false, error: result.error };
    if (result.unchanged) return { success: true, unchanged: true };
    commitProducts(result.products);
    if (result.movement) appendMovements([result.movement]);
    return { success: true };
  };

  const recordInitialStock = (product: Product) => {
    const m = initialStockMovement(product, actor);
    if (m) appendMovements([m]);
  };

  const clearStockHistory = () => setStockMovements([]);
  const resetInventoryDemo = () => setStockMovements([...DEFAULT_STOCK_MOVEMENTS]);

  return {
    stockMovements,
    receiveGoods,
    setStockCount,
    recordInitialStock,
    clearStockHistory,
    resetInventoryDemo,
    lowStockThreshold,
    setLowStockThreshold,
    categoryThresholds,
    setCategoryThresholds,
  };
}
