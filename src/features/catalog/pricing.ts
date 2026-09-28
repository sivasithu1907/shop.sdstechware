import { DEFAULT_BUDGET_BOUNDS } from '../../config/settings';
import type { Product } from '../../types';

/**
 * PUBLIC PRICE RULE (single source of truth)
 * -----------------------------------------
 * A product's selling price is public only when:
 *   1. staff enabled public visibility (isPricePublic === true), AND
 *   2. a valid price exists: a finite number greater than zero.
 *
 * Zero is handled deliberately: LKR 0 can be stored (e.g. while a price is
 * being set up) but it is never published, because showing "LKR 0" to a
 * customer is almost always a data-entry mistake. Such products behave as
 * "Price on Request" and staff see a warning in the editor.
 *
 * Every storefront view, filter, sort, chart, statistic and export must use
 * these helpers (or storefront-safe products from toStorefrontProduct).
 *
 * NOTE: hiding a price in the UI is not a confidentiality boundary. In this
 * frontend-only prototype all product data sits in the browser. A real
 * backend must exclude private prices from public API responses.
 */

export function isValidPriceAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/** A price that could be published (valid and greater than zero). */
export function isPublishablePrice(value: unknown): value is number {
  return isValidPriceAmount(value) && value > 0;
}

export function getPublicPrice(product: Pick<Product, 'price' | 'isPricePublic'>): number | null {
  if (product.isPricePublic !== true) return null;
  return isPublishablePrice(product.price) ? product.price : null;
}

export function hasPublicPrice(product: Pick<Product, 'price' | 'isPricePublic'>): boolean {
  return getPublicPrice(product) !== null;
}

/**
 * Return a copy that is safe to give to storefront components: hidden selling
 * prices and internal purchase costs are removed.
 */
export function toStorefrontProduct(product: Product): Product {
  const publicPrice = getPublicPrice(product);
  const { purchaseCost: _internalCost, ...rest } = product;
  return {
    ...rest,
    price: publicPrice,
    isPricePublic: publicPrice !== null,
  };
}

export interface PriceBounds {
  min: number;
  max: number;
}

/** Slider bounds computed from PUBLIC prices only. */
export function computePublicPriceBounds(products: Product[]): PriceBounds {
  const prices = products.map(getPublicPrice).filter((p): p is number => p !== null);
  if (prices.length === 0) return { ...DEFAULT_BUDGET_BOUNDS };
  const min = Math.max(0, Math.floor(Math.min(...prices) / 1000) * 1000);
  let max = Math.ceil(Math.max(...prices) / 5000) * 5000;
  if (max <= min) max = min + 5000;
  return { min, max };
}

export interface BudgetFilter {
  min: number;
  max: number;
  includeQuoteOnly: boolean;
}

/** Budget rule: public-priced items must fall in range; Price-on-Request items follow includeQuoteOnly. */
export function matchesBudget(product: Product, budget: BudgetFilter): boolean {
  const price = getPublicPrice(product);
  if (price === null) return budget.includeQuoteOnly;
  return price >= budget.min && price <= budget.max;
}

export function isBudgetFilterActive(budget: BudgetFilter, bounds: PriceBounds): boolean {
  return budget.min > bounds.min || budget.max < bounds.max || !budget.includeQuoteOnly;
}

/**
 * Compare by public price. Products without a public price always sort after
 * priced products in BOTH directions, so their position reveals nothing about
 * a hidden price. Ties keep their relative order (stable sort).
 */
export function comparePublicPrice(a: Product, b: Product, direction: 'asc' | 'desc'): number {
  const pa = getPublicPrice(a);
  const pb = getPublicPrice(b);
  if (pa === null && pb === null) return 0;
  if (pa === null) return 1;
  if (pb === null) return -1;
  return direction === 'asc' ? pa - pb : pb - pa;
}

export interface BudgetStats {
  totalMatching: number;
  inRangePricedCount: number;
  quoteOnlyCount: number;
  /** null when no public-priced product is in range. */
  avgPrice: number | null;
  lowestPrice: number | null;
  highestPrice: number | null;
  percentOfCatalog: number;
}

export function computeBudgetStats(products: Product[], budget: BudgetFilter): BudgetStats {
  const publicPrices = products.map(p => ({ p, price: getPublicPrice(p) }));
  const inRange = publicPrices
    .filter((x): x is { p: Product; price: number } => x.price !== null)
    .filter(x => x.price >= budget.min && x.price <= budget.max)
    .map(x => x.price);
  const quoteOnlyCount = publicPrices.filter(x => x.price === null).length;
  const totalMatching = inRange.length + (budget.includeQuoteOnly ? quoteOnlyCount : 0);
  return {
    totalMatching,
    inRangePricedCount: inRange.length,
    quoteOnlyCount,
    avgPrice: inRange.length ? Math.round(inRange.reduce((s, v) => s + v, 0) / inRange.length) : null,
    lowestPrice: inRange.length ? Math.min(...inRange) : null,
    highestPrice: inRange.length ? Math.max(...inRange) : null,
    percentOfCatalog: products.length ? Math.round((totalMatching / products.length) * 100) : 0,
  };
}
