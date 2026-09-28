import { useCallback, useMemo, useRef } from 'react';
import { INITIAL_BRANDS, INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '../data/seedData';
import { isPublishablePrice, toStorefrontProduct } from '../features/catalog/pricing';
import {
  fail,
  normalizeBrand,
  normalizeCategory,
  normalizeProduct,
  ok,
  validateMoney,
  validateStockValue,
  type Result,
} from '../features/catalog/productRecords';
import { canEditCatalog } from '../features/staff/actor';
import { createId } from '../lib/ids';
import { normalizeArray, readJSON, STORAGE_KEYS } from '../lib/storage';
import type { Brand, Category, Product, StaffRole } from '../types';
import { usePersistentState } from './usePersistentState';

type WriteErrorHandler = (key: string, message: string) => void;

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export function loadProducts(): Product[] {
  return readJSON(STORAGE_KEYS.PRODUCTS, p => normalizeArray(p, normalizeProduct), () => clone(INITIAL_PRODUCTS)).value;
}

/**
 * Products, categories and brands (catalogue data).
 * Stock changes are NOT made here — they go through the inventory store so
 * every change is recorded in history.
 */
export function useCatalogStore(currentRole: StaffRole, onWriteError: WriteErrorHandler) {
  const [products, setProducts] = usePersistentState<Product[]>(STORAGE_KEYS.PRODUCTS, loadProducts, onWriteError);
  const [categories, setCategories] = usePersistentState<Category[]>(
    STORAGE_KEYS.CATEGORIES,
    () => readJSON(STORAGE_KEYS.CATEGORIES, p => normalizeArray(p, normalizeCategory), () => clone(INITIAL_CATEGORIES)).value,
    onWriteError,
  );
  const [brands, setBrands] = usePersistentState<Brand[]>(
    STORAGE_KEYS.BRANDS,
    () => readJSON(STORAGE_KEYS.BRANDS, p => normalizeArray(p, normalizeBrand), () => clone(INITIAL_BRANDS)).value,
    onWriteError,
  );

  // Latest products for synchronous validation inside event handlers.
  const productsRef = useRef(products);
  productsRef.current = products;

  const activeProducts = useMemo(() => products.filter(p => !p.isArchived), [products]);
  const archivedProducts = useMemo(() => products.filter(p => p.isArchived), [products]);
  /** Storefront-safe list: published, not archived, hidden prices and costs removed. */
  const storefrontProducts = useMemo(
    () => activeProducts.filter(p => p.isPublished).map(toStorefrontProduct),
    [activeProducts],
  );

  const canEdit = canEditCatalog(currentRole);
  const denied = (what: string) => fail(`Your current role is not authorised to ${what}.`);

  const commitProducts = useCallback(
    (next: Product[]) => {
      productsRef.current = next;
      setProducts(next);
    },
    [setProducts],
  );

  const touch = (p: Product, patch: Partial<Product>): Product => ({ ...p, ...patch, updatedAt: new Date().toISOString() });

  /** Enforce price rules on any product write. */
  const normalizePricing = (p: Product): Product => {
    // Public visibility requires a publishable (> 0) price; 0 or blank is kept private.
    const isPricePublic = p.isPricePublic && isPublishablePrice(p.price);
    return { ...p, isPricePublic };
  };

  const addProduct = (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Result & { product?: Product } => {
    if (!canEdit) return denied('add products');
    if (!data.model.trim()) return fail('Product model name is required.');
    if (!data.brand.trim()) return fail('Brand is required.');
    if (!data.category.trim()) return fail('Category is required.');
    const priceCheck = validateMoney(data.price, 'Price');
    if (!priceCheck.success) return priceCheck;
    const costCheck = validateMoney(data.purchaseCost ?? null, 'Purchase cost');
    if (!costCheck.success) return costCheck;
    const stockCheck = validateStockValue(data.stock);
    if (!stockCheck.success) return stockCheck;
    const now = new Date().toISOString();
    const product = normalizePricing({ ...data, id: createId('prod'), createdAt: now, updatedAt: now });
    commitProducts([product, ...productsRef.current]);
    return { success: true, product };
  };

  /** Update catalogue fields. Stock is intentionally excluded (use the inventory store). */
  const updateProduct = (id: string, updates: Partial<Omit<Product, 'stock' | 'id'>>): Result => {
    if (!canEdit) return denied('modify product details');
    const existing = productsRef.current.find(p => p.id === id);
    if (!existing) return fail('Product not found.');
    if ('price' in updates) {
      const check = validateMoney(updates.price ?? null, 'Price');
      if (!check.success) return check;
    }
    if ('purchaseCost' in updates) {
      const check = validateMoney(updates.purchaseCost ?? null, 'Purchase cost');
      if (!check.success) return check;
    }
    const { stock: _ignored, id: _id, ...safe } = updates as Partial<Product>;
    const next = normalizePricing(touch(existing, safe));
    commitProducts(productsRef.current.map(p => (p.id === id ? next : p)));
    return ok;
  };

  const updatePrice = (id: string, newPrice: number | null, isPublic?: boolean): Result => {
    const existing = productsRef.current.find(p => p.id === id);
    if (!existing) return fail('Product not found.');
    return updateProduct(id, { price: newPrice, isPricePublic: isPublic ?? existing.isPricePublic });
  };

  const togglePriceVisibility = (id: string): Result => {
    if (!canEdit) return denied('change price visibility');
    const existing = productsRef.current.find(p => p.id === id);
    if (!existing) return fail('Product not found.');
    if (!existing.isPricePublic && !isPublishablePrice(existing.price)) {
      return fail('Enter a price greater than zero before making it public.');
    }
    commitProducts(productsRef.current.map(p => (p.id === id ? touch(p, { isPricePublic: !p.isPricePublic }) : p)));
    return ok;
  };

  const setFlag = (id: string, patch: Partial<Product>, what: string): Result => {
    if (!canEdit) return denied(what);
    if (!productsRef.current.some(p => p.id === id)) return fail('Product not found.');
    commitProducts(productsRef.current.map(p => (p.id === id ? touch(p, patch) : p)));
    return ok;
  };
  const archiveProduct = (id: string) => setFlag(id, { isArchived: true }, 'archive products');
  const restoreProduct = (id: string) => setFlag(id, { isArchived: false }, 'restore products');
  const togglePublishProduct = (id: string) => {
    const p = productsRef.current.find(x => x.id === id);
    return setFlag(id, { isPublished: !(p?.isPublished ?? false) }, 'publish products');
  };

  // ---------------- categories & brands ----------------
  const addCategory = (name: string, description?: string): Result => {
    if (!canEdit) return denied('add categories');
    const trimmed = name.trim();
    if (!trimmed) return fail('Category name cannot be empty.');
    if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) return fail('Category already exists.');
    setCategories(prev => [...prev, { id: createId('cat'), name: trimmed, description: description?.trim() || '' }]);
    return ok;
  };

  const updateCategory = (id: string, name: string, description?: string): Result => {
    if (!canEdit) return denied('modify categories');
    const trimmed = name.trim();
    if (!trimmed) return fail('Category name cannot be empty.');
    const existing = categories.find(c => c.id === id);
    if (!existing) return fail('Category not found.');
    if (categories.some(c => c.id !== id && c.name.toLowerCase() === trimmed.toLowerCase())) {
      return fail('Another category with this name already exists.');
    }
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, name: trimmed, description: description?.trim() || '' } : c)));
    if (existing.name !== trimmed) {
      commitProducts(productsRef.current.map(p => (p.category === existing.name ? touch(p, { category: trimmed }) : p)));
    }
    return ok;
  };

  const deleteCategory = (id: string): Result => {
    if (!canEdit) return denied('delete categories');
    const cat = categories.find(c => c.id === id);
    if (!cat) return fail('Category not found.');
    const using = productsRef.current.filter(p => p.category === cat.name && !p.isArchived).length;
    if (using > 0) {
      return fail(`Cannot delete "${cat.name}". It is assigned to ${using} active product(s). Reassign products first.`);
    }
    setCategories(prev => prev.filter(c => c.id !== id));
    return ok;
  };

  const addBrand = (name: string, country?: string): Result => {
    if (!canEdit) return denied('add brands');
    const trimmed = name.trim();
    if (!trimmed) return fail('Brand name cannot be empty.');
    if (brands.some(b => b.name.toLowerCase() === trimmed.toLowerCase())) return fail('Brand already exists.');
    setBrands(prev => [...prev, { id: createId('brand'), name: trimmed, country: country?.trim() || undefined }]);
    return ok;
  };

  const updateBrand = (id: string, name: string, country?: string): Result => {
    if (!canEdit) return denied('modify brands');
    const trimmed = name.trim();
    if (!trimmed) return fail('Brand name cannot be empty.');
    const existing = brands.find(b => b.id === id);
    if (!existing) return fail('Brand not found.');
    if (brands.some(b => b.id !== id && b.name.toLowerCase() === trimmed.toLowerCase())) {
      return fail('Another brand with this name already exists.');
    }
    setBrands(prev => prev.map(b => (b.id === id ? { ...b, name: trimmed, country: country?.trim() || undefined } : b)));
    if (existing.name !== trimmed) {
      commitProducts(productsRef.current.map(p => (p.brand === existing.name ? touch(p, { brand: trimmed }) : p)));
    }
    return ok;
  };

  const deleteBrand = (id: string): Result => {
    if (!canEdit) return denied('delete brands');
    const brand = brands.find(b => b.id === id);
    if (!brand) return fail('Brand not found.');
    const using = productsRef.current.filter(p => p.brand === brand.name && !p.isArchived).length;
    if (using > 0) {
      return fail(`Cannot delete brand "${brand.name}". It is assigned to ${using} active product(s). Reassign products first.`);
    }
    setBrands(prev => prev.filter(b => b.id !== id));
    return ok;
  };

  const resetCatalog = () => {
    commitProducts(clone(INITIAL_PRODUCTS));
    setCategories(clone(INITIAL_CATEGORIES));
    setBrands(clone(INITIAL_BRANDS));
  };

  return {
    products,
    productsRef,
    commitProducts,
    activeProducts,
    archivedProducts,
    storefrontProducts,
    categories,
    brands,
    addProduct,
    updateProduct,
    updatePrice,
    togglePriceVisibility,
    archiveProduct,
    restoreProduct,
    togglePublishProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    addBrand,
    updateBrand,
    deleteBrand,
    resetCatalog,
  };
}
