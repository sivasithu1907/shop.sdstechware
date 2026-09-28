import { LOW_STOCK } from '../../config/settings';
import type { Product } from '../../types';

export function clampThreshold(value: number): number {
  if (!Number.isFinite(value)) return LOW_STOCK.defaultThreshold;
  return Math.max(LOW_STOCK.minThreshold, Math.min(LOW_STOCK.maxThreshold, Math.round(value)));
}

export function effectiveThreshold(category: string, globalThreshold: number, overrides: Record<string, number>): number {
  return overrides[category] !== undefined ? overrides[category] : globalThreshold;
}

/** Unconfirmed stock (null) is only "low" when the user chooses to include it. */
export function isLowStock(product: Product, threshold: number, includeUnconfirmed: boolean): boolean {
  if (product.stock === null) return includeUnconfirmed;
  return product.stock <= threshold;
}

export function isCriticalStock(product: Product, threshold: number): boolean {
  return product.stock !== null && product.stock > 0 && product.stock <= Math.max(2, Math.floor(threshold / 3));
}

/**
 * Suggested reorder quantity (a suggestion only — staff edit it).
 * Target = max(2 × threshold, 10). When current stock is unconfirmed the
 * suggestion assumes nothing is on hand and is labelled as such in the UI.
 */
export function suggestedReorderQty(currentStock: number | null, threshold: number): number {
  const target = Math.max(threshold * 2, 10);
  const deficit = Math.max(1, target - (currentStock ?? 0));
  return Math.max(5, Math.ceil(deficit / 5) * 5);
}

export function normalizeThresholdOverrides(parsed: unknown): { value: Record<string, number>; dropped: number } | null {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
  const value: Record<string, number> = {};
  let dropped = 0;
  for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) value[k] = clampThreshold(v);
    else dropped++;
  }
  return { value, dropped };
}
