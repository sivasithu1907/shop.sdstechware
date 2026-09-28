import { useEffect, useMemo, useRef, useState } from 'react';
import { LIMITS } from '../config/settings';
import { DEFAULT_RECENT_SEARCHES, DEFAULT_SAVED_PRODUCT_IDS } from '../data/demoFixtures';
import {
  computePublicPriceBounds,
  isBudgetFilterActive as budgetActive,
  type BudgetFilter,
} from '../features/catalog/pricing';
import { normalizeArray, readJSON, STORAGE_KEYS } from '../lib/storage';
import type { Product } from '../types';
import { usePersistentState } from './usePersistentState';

type WriteErrorHandler = (key: string, message: string) => void;

const stringItem = (raw: unknown) => (typeof raw === 'string' && raw.length > 0 ? raw : null);
const loadStrings = (key: string, fallback: string[]) =>
  readJSON(key, p => normalizeArray(p, stringItem), () => [...fallback]).value;

/**
 * Customer-side browsing state: filters, search, recent searches, comparison
 * and saved-for-later. Budget bounds are computed from PUBLIC prices only.
 */
export function useBrowsingStore(storefrontProducts: Product[], onWriteError: WriteErrorHandler) {
  // ---------------- filters ----------------
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  /** Legacy single-brand API: 'all' clears, a name selects exactly that brand. */
  const setSelectedBrand = (brand: string) => setSelectedBrands(brand === 'all' ? [] : [brand]);
  const selectedBrand = selectedBrands.length === 0 ? 'all' : selectedBrands.join(', ');
  const toggleBrandFilter = (brandName: string) =>
    setSelectedBrands(prev => (prev.includes(brandName) ? prev.filter(b => b !== brandName) : [...prev, brandName]));

  const catalogPriceBounds = useMemo(() => computePublicPriceBounds(storefrontProducts), [storefrontProducts]);
  const [budgetFilter, setBudgetFilter] = useState<BudgetFilter>(() => ({ ...catalogPriceBounds, includeQuoteOnly: true }));

  // Keep an untouched budget filter aligned with the bounds when prices change.
  const lastBounds = useRef(catalogPriceBounds);
  useEffect(() => {
    const prev = lastBounds.current;
    lastBounds.current = catalogPriceBounds;
    setBudgetFilter(b => {
      const wasUntouched = b.min <= prev.min && b.max >= prev.max;
      if (wasUntouched) return { ...b, min: catalogPriceBounds.min, max: catalogPriceBounds.max };
      return {
        ...b,
        min: Math.max(catalogPriceBounds.min, Math.min(b.min, catalogPriceBounds.max)),
        max: Math.min(catalogPriceBounds.max, Math.max(b.max, catalogPriceBounds.min)),
      };
    });
  }, [catalogPriceBounds]);

  const isBudgetFilterActive = budgetActive(budgetFilter, catalogPriceBounds);
  const resetBudgetFilter = () => setBudgetFilter({ ...catalogPriceBounds, includeQuoteOnly: true });

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedBrands([]);
    setInStockOnly(false);
    setSearchQuery('');
    resetBudgetFilter();
  };

  // ---------------- recent searches ----------------
  const [recentSearches, setRecentSearches] = usePersistentState<string[]>(
    STORAGE_KEYS.RECENT_SEARCHES,
    () => loadStrings(STORAGE_KEYS.RECENT_SEARCHES, DEFAULT_RECENT_SEARCHES),
    onWriteError,
  );
  const addRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    setRecentSearches(prev =>
      [trimmed, ...prev.filter(q => q.toLowerCase() !== trimmed.toLowerCase())].slice(0, LIMITS.recentSearchesMax),
    );
  };
  const removeRecentSearch = (query: string) => setRecentSearches(prev => prev.filter(q => q !== query));
  const clearRecentSearches = () => setRecentSearches([]);

  // ---------------- comparison ----------------
  const [compareProductIds, setCompareProductIds] = usePersistentState<string[]>(
    STORAGE_KEYS.COMPARE,
    () => loadStrings(STORAGE_KEYS.COMPARE, []).slice(0, LIMITS.compareMax),
    onWriteError,
  );
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const addToCompare = (productId: string): boolean => {
    if (compareProductIds.includes(productId)) return true;
    if (compareProductIds.length >= LIMITS.compareMax) return false;
    setCompareProductIds([...compareProductIds, productId]);
    return true;
  };
  const removeFromCompare = (productId: string) => setCompareProductIds(prev => prev.filter(id => id !== productId));
  const toggleCompareProduct = (productId: string): boolean =>
    compareProductIds.includes(productId) ? (removeFromCompare(productId), true) : addToCompare(productId);
  const clearCompare = () => setCompareProductIds([]);

  // ---------------- saved for later ----------------
  const [savedProductIds, setSavedProductIds] = usePersistentState<string[]>(
    STORAGE_KEYS.SAVED_FOR_LATER,
    () => loadStrings(STORAGE_KEYS.SAVED_FOR_LATER, DEFAULT_SAVED_PRODUCT_IDS),
    onWriteError,
  );
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
  const savedProducts = useMemo(() => {
    const byId = new Map(storefrontProducts.map(p => [p.id, p]));
    return savedProductIds.map(id => byId.get(id)).filter((p): p is Product => Boolean(p));
  }, [savedProductIds, storefrontProducts]);

  const resetBrowsingDemo = () => {
    resetFilters();
    setRecentSearches([...DEFAULT_RECENT_SEARCHES]);
    setCompareProductIds([]);
    setIsCompareMode(false);
    setIsCompareModalOpen(false);
    setSavedProductIds([...DEFAULT_SAVED_PRODUCT_IDS]);
    setIsSavedDrawerOpen(false);
  };

  return {
    selectedCategory,
    setSelectedCategory,
    selectedBrand,
    setSelectedBrand,
    selectedBrands,
    setSelectedBrands,
    toggleBrandFilter,
    inStockOnly,
    setInStockOnly,
    searchQuery,
    setSearchQuery,
    resetFilters,
    budgetFilter,
    setBudgetFilter,
    resetBudgetFilter,
    catalogPriceBounds,
    isBudgetFilterActive,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    compareProductIds,
    isCompareMode,
    setIsCompareMode,
    isCompareModalOpen,
    setIsCompareModalOpen,
    addToCompare,
    removeFromCompare,
    toggleCompareProduct,
    clearCompare,
    savedProductIds,
    setSavedProductIds,
    savedProducts,
    isSavedDrawerOpen,
    setIsSavedDrawerOpen,
    resetBrowsingDemo,
  };
}
