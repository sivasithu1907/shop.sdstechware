/** App-wide limits and defaults. Business-sensitive values live in business.ts. */

export const LIMITS = {
  /** Maximum products in the comparison matrix. */
  compareMax: 4,
  /** Quotation line quantity bounds. */
  quoteQtyMin: 1,
  quoteQtyMax: 9999,
  /** Goods receipt / reorder line quantity bounds. */
  movementQtyMax: 100000,
  /** Recent searches kept. */
  recentSearchesMax: 6,
  /** Product image upload size (data URLs are stored in the browser). */
  productImageMaxBytes: 2 * 1024 * 1024,
  /** Chat screenshot size (stored in the browser). */
  chatImageMaxBytes: 1024 * 1024,
} as const;

export const LOW_STOCK = {
  defaultThreshold: 8,
  minThreshold: 1,
  maxThreshold: 500,
  presets: [3, 5, 8, 10, 15, 20],
  /**
   * Category overrides carried over from the earlier prototype. Most names do
   * not match the current demo categories (only "Networking" does), so they
   * have no effect on those categories. Kept to preserve behaviour — review
   * and align with real category names.
   */
  defaultCategoryThresholds: {
    Networking: 15,
    'Power & UPS': 3,
    Displays: 5,
    'Laptops & Desktops': 4,
    'Storage & NAS': 6,
    Peripherals: 12,
    Components: 10,
  } as Record<string, number>,
} as const;

/** Fallback budget slider range when no product has a public price. */
export const DEFAULT_BUDGET_BOUNDS = { min: 0, max: 50000 } as const;
