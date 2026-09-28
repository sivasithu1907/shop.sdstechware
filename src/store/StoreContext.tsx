import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { LIMITS } from '../config/settings';
import { getDemoActor } from '../features/staff/actor';
import { formatLKR } from '../lib/format';
import {
  DEMO_DATA_KEYS,
  getStorageIssues,
  readString,
  removeKey,
  STORAGE_KEYS,
  subscribeStorageIssues,
  writeString,
  type StorageIssue,
} from '../lib/storage';
import type { Product, StaffRole } from '../types';
import { useAlertsStore } from './useAlertsStore';
import { useBrowsingStore } from './useBrowsingStore';
import { useCatalogStore } from './useCatalogStore';
import { useInventoryStore } from './useInventoryStore';
import { useQuoteStore } from './useQuoteStore';
import { useReviewsStore } from './useReviewsStore';
import { useStaffStore } from './useStaffStore';

/**
 * App state provider. It composes focused slices (catalogue, inventory,
 * quotation, alerts, browsing, reviews, staff) and adds cross-cutting UI
 * state (toast, view, modals, demo role).
 *
 * Business rules live in src/features/** and are unit-tested; this file only
 * wires them to React state.
 */

const ROLES: StaffRole[] = ['owner', 'product_manager', 'stock_editor', 'viewer'];
type View = 'store' | 'admin';

function useStoreValue() {
  // ---------------- toast ----------------
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 3600);
  }, []);
  const onWriteError = useCallback(
    (_key: string, message: string) => showToast(`Not saved to browser storage: ${message}`),
    [showToast],
  );

  // ---------------- storage issues (for the staff notice) ----------------
  const [storageIssues, setStorageIssues] = useState<StorageIssue[]>(getStorageIssues);
  useEffect(() => subscribeStorageIssues(setStorageIssues), []);

  // ---------------- demo role & view ----------------
  const [currentRole, setCurrentRole] = useState<StaffRole>(() => {
    const saved = readString(STORAGE_KEYS.ROLE);
    return ROLES.includes(saved as StaffRole) ? (saved as StaffRole) : 'owner';
  });
  useEffect(() => {
    writeString(STORAGE_KEYS.ROLE, currentRole);
  }, [currentRole]);
  const actor = useMemo(() => getDemoActor(currentRole), [currentRole]);

  const [currentView, setCurrentViewInternal] = useState<View>(() =>
    typeof window !== 'undefined' && window.location.pathname === '/admin' ? 'admin' : 'store',
  );
  const setCurrentView = useCallback((view: View) => {
    setCurrentViewInternal(view);
    if (typeof window === 'undefined') return;
    if (view === 'admin' && window.location.pathname !== '/admin') window.history.pushState(null, '', '/admin');
    else if (view === 'store' && window.location.pathname === '/admin') window.history.pushState(null, '', '/');
  }, []);

  const setDemoRole = (role: StaffRole) => {
    setCurrentRole(role);
    if (role === 'viewer' && currentView === 'admin') setCurrentView('store');
  };

  // ---------------- slices ----------------
  const catalog = useCatalogStore(currentRole, onWriteError);
  const inventory = useInventoryStore(actor, catalog.productsRef, catalog.commitProducts, onWriteError);
  const quote = useQuoteStore(catalog.storefrontProducts, onWriteError);
  const storefrontById = useMemo(() => new Map(catalog.storefrontProducts.map(p => [p.id, p])), [catalog.storefrontProducts]);
  const getStorefrontProduct = useCallback((id: string | null | undefined) => (id ? storefrontById.get(id) : undefined), [storefrontById]);
  const alerts = useAlertsStore(actor, id => storefrontById.get(id), onWriteError);
  const browsing = useBrowsingStore(catalog.storefrontProducts, onWriteError);
  const reviews = useReviewsStore(onWriteError);
  const staff = useStaffStore(currentRole, onWriteError);

  // ---------------- modals ----------------
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [quickViewProductId, setQuickViewProductId] = useState<string | null>(null);
  const [isConfiguratorOpen, setIsConfiguratorOpen] = useState(false);
  const [isWarrantyModalOpen, setIsWarrantyModalOpen] = useState(false);

  // ---------------- cross-slice actions ----------------
  const addProduct = (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const result = catalog.addProduct(data);
    if (result.success && result.product) inventory.recordInitialStock(result.product);
    return result;
  };

  /** Direct stock count / correction; recorded in stock history. */
  const updateStock = (id: string, newStock: number | null, notes?: string) => inventory.setStockCount(id, newStock, notes);

  const toggleCompareProduct = (productId: string) => {
    if (!browsing.toggleCompareProduct(productId)) {
      showToast(`You can compare up to ${LIMITS.compareMax} products. Remove one first.`);
    }
  };

  const productLabel = (id: string) => storefrontById.get(id)?.model ?? 'Product';
  const saveProduct = (productId: string) => {
    if (browsing.savedProductIds.includes(productId)) return;
    browsing.setSavedProductIds(prev => [productId, ...prev]);
    showToast(`Saved "${productLabel(productId)}" to Saved for Later.`);
  };
  const removeSavedProduct = (productId: string, silent = false) => {
    browsing.setSavedProductIds(prev => prev.filter(id => id !== productId));
    if (!silent) showToast(`Removed "${productLabel(productId)}" from Saved for Later.`);
  };
  const isProductSaved = (productId: string) => browsing.savedProductIds.includes(productId);
  const toggleSaveProduct = (productId: string): boolean => {
    if (isProductSaved(productId)) {
      removeSavedProduct(productId);
      return false;
    }
    saveProduct(productId);
    return true;
  };
  const clearSavedProducts = () => {
    browsing.setSavedProductIds([]);
    showToast('Cleared all items from Saved for Later.');
  };
  const moveSavedToQuote = (productId: string) => {
    const product = storefrontById.get(productId);
    if (!product) return;
    quote.addToQuote(product, 1);
    removeSavedProduct(productId, true);
    showToast(`Moved "${product.model}" to your Quotation list.`);
  };
  const moveAllSavedToQuote = () => {
    const toMove = browsing.savedProducts;
    if (toMove.length === 0) return;
    toMove.forEach(p => quote.addToQuote(p, 1));
    browsing.setSavedProductIds([]);
    showToast(`Moved ${toMove.length} item(s) to your Quotation list.`);
  };

  const addReview: typeof reviews.addReview = data => {
    const r = reviews.addReview(data);
    showToast('Review saved in this browser only (unmoderated demo).');
    return r;
  };
  const voteHelpfulReview = (id: string) => {
    reviews.voteHelpfulReview(id);
    showToast('Marked review as helpful (this browser only).');
  };

  /** Restores demo fixtures. Requires explicit confirmation in the UI. */
  const resetDemoData = () => {
    catalog.resetCatalog();
    staff.resetStaffDemo();
    setCurrentRole('owner');
    quote.clearQuote();
    setSelectedProductId(null);
    setQuickViewProductId(null);
    browsing.resetBrowsingDemo();
    alerts.resetAlertsDemo();
    reviews.resetReviewsDemo();
    inventory.resetInventoryDemo();
    // Keys are rewritten by the slices; removing first clears any unreadable data.
    DEMO_DATA_KEYS.forEach(k => removeKey(k));
    showToast('Demo data restored to the original sample catalogue.');
  };

  return {
    // catalogue
    products: catalog.products,
    activeProducts: catalog.activeProducts,
    archivedProducts: catalog.archivedProducts,
    /** Storefront-safe list (published, not archived, hidden prices removed). */
    publishedProducts: catalog.storefrontProducts,
    getStorefrontProduct,
    categories: catalog.categories,
    brands: catalog.brands,
    addProduct,
    updateProduct: catalog.updateProduct,
    updatePrice: catalog.updatePrice,
    togglePriceVisibility: catalog.togglePriceVisibility,
    archiveProduct: catalog.archiveProduct,
    restoreProduct: catalog.restoreProduct,
    togglePublishProduct: catalog.togglePublishProduct,
    addCategory: catalog.addCategory,
    updateCategory: catalog.updateCategory,
    deleteCategory: catalog.deleteCategory,
    addBrand: catalog.addBrand,
    updateBrand: catalog.updateBrand,
    deleteBrand: catalog.deleteBrand,

    // inventory
    updateStock,
    receiveGoods: inventory.receiveGoods,
    stockMovements: inventory.stockMovements,
    clearStockHistory: inventory.clearStockHistory,
    lowStockThreshold: inventory.lowStockThreshold,
    setLowStockThreshold: inventory.setLowStockThreshold,
    categoryThresholds: inventory.categoryThresholds,
    setCategoryThresholds: inventory.setCategoryThresholds,

    // staff & session
    staffList: staff.staffList,
    addStaff: staff.addStaff,
    updateStaffRole: staff.updateStaffRole,
    toggleStaffStatus: staff.toggleStaffStatus,
    revokeStaff: staff.revokeStaff,
    currentRole,
    actor,
    setDemoRole,
    currentView,
    setCurrentView,

    // quotation
    ...quote,

    // browsing
    ...browsing,
    toggleCompareProduct,

    // saved for later
    isProductSaved,
    toggleSaveProduct,
    saveProduct,
    removeSavedProduct,
    clearSavedProducts,
    moveSavedToQuote,
    moveAllSavedToQuote,

    // alerts
    ...alerts,

    // reviews
    reviews: reviews.reviews,
    getProductReviews: reviews.getProductReviews,
    getProductRatingSummary: reviews.getProductRatingSummary,
    addReview,
    voteHelpfulReview,

    // modals
    selectedProductId,
    setSelectedProductId,
    quickViewProductId,
    setQuickViewProductId,
    isConfiguratorOpen,
    setIsConfiguratorOpen,
    isWarrantyModalOpen,
    setIsWarrantyModalOpen,

    // utilities
    toastMessage,
    showToast,
    storageIssues,
    resetDemoData,
    formatLKR,
  };
}

export type StoreValue = ReturnType<typeof useStoreValue>;

const StoreContext = createContext<StoreValue | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useStoreValue();
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = (): StoreValue => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
