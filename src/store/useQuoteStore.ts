import { useMemo, useState } from 'react';
import {
  computeQuoteTotals,
  createStoredQuoteItem,
  isCustomItemId,
  normalizeQuoteQuantity,
  normalizeStoredQuoteItem,
  resolveQuoteItems,
} from '../features/quotation/quoteItems';
import { normalizeArray, readJSON, STORAGE_KEYS } from '../lib/storage';
import type { Product, StoredQuoteItem } from '../types';
import { usePersistentState } from './usePersistentState';

type WriteErrorHandler = (key: string, message: string) => void;

/**
 * Quotation request list. Persisted entries hold only id, quantity and a
 * price-free snapshot; prices are always resolved from the live, storefront-
 * safe catalogue.
 */
export function useQuoteStore(storefrontProducts: Product[], onWriteError: WriteErrorHandler) {
  const [storedItems, setStoredItems] = usePersistentState<StoredQuoteItem[]>(
    STORAGE_KEYS.QUOTE,
    () => readJSON(STORAGE_KEYS.QUOTE, p => normalizeArray(p, normalizeStoredQuoteItem), () => []).value,
    onWriteError,
  );
  const [isQuoteDrawerOpen, setIsQuoteDrawerOpen] = useState(false);

  const quoteItems = useMemo(() => resolveQuoteItems(storedItems, storefrontProducts), [storedItems, storefrontProducts]);
  const quoteTotals = useMemo(() => computeQuoteTotals(quoteItems), [quoteItems]);

  /**
   * Add a product. Catalogue products are re-resolved later; custom requests
   * (configurator, warranty, chat) are stored as price-free snapshots.
   */
  const addToQuote = (product: Product, quantity = 1, options: { openDrawer?: boolean } = {}) => {
    const source = isCustomItemId(product.id) ? 'custom' : 'catalog';
    const qty = normalizeQuoteQuantity(quantity);
    setStoredItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => (i.productId === product.id ? { ...i, quantity: normalizeQuoteQuantity(i.quantity + qty) } : i));
      }
      return [...prev, createStoredQuoteItem(product, qty, source)];
    });
    if (options.openDrawer !== false) setIsQuoteDrawerOpen(true);
  };

  const removeFromQuote = (productId: string) => setStoredItems(prev => prev.filter(i => i.productId !== productId));

  /** Quantities below 1 remove the line; others are clamped to whole numbers within limits. */
  const updateQuoteQty = (productId: string, quantity: number) => {
    if (!Number.isFinite(quantity) || quantity < 1) {
      removeFromQuote(productId);
      return;
    }
    const qty = normalizeQuoteQuantity(quantity);
    setStoredItems(prev => prev.map(i => (i.productId === productId ? { ...i, quantity: qty } : i)));
  };

  const clearQuote = () => setStoredItems([]);

  return {
    quoteItems,
    quoteTotals,
    addToQuote,
    updateQuoteQty,
    removeFromQuote,
    clearQuote,
    isQuoteDrawerOpen,
    setIsQuoteDrawerOpen,
  };
}
