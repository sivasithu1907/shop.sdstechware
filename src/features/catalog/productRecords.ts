import { asFiniteNumberOrNull, asString, isRecord } from '../../lib/storage';
import type { Brand, Category, Product, ProductSpec } from '../../types';

/**
 * Image paths used by the earlier prototype pointed into /src/assets, which
 * does not exist in a production build. Images now live in /public/images/products.
 */
const LEGACY_IMAGE_PREFIX = '/src/assets/images/';
const IMAGE_PREFIX = '/images/products/';

export function migrateImagePath(src: string): string {
  return src.startsWith(LEGACY_IMAGE_PREFIX) ? IMAGE_PREFIX + src.slice(LEGACY_IMAGE_PREFIX.length) : src;
}

function normalizeSpecs(v: unknown): ProductSpec[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter(isRecord)
    .map(s => ({ key: asString(s.key), value: asString(s.value) }))
    .filter(s => s.key || s.value);
}

function normalizeStock(v: unknown): number | null {
  const n = asFiniteNumberOrNull(v);
  if (n === null) return null;
  // Invalid stored stock (negative or fractional) is treated as unconfirmed rather than guessed.
  return Number.isInteger(n) && n >= 0 ? n : null;
}

/** Normalise one stored product. Returns null only if it has no usable identity. */
export function normalizeProduct(raw: unknown): Product | null {
  if (!isRecord(raw)) return null;
  const id = asString(raw.id);
  const model = asString(raw.model);
  if (!id || !model) return null;

  const price = asFiniteNumberOrNull(raw.price);
  const purchaseCost = asFiniteNumberOrNull(raw.purchaseCost);
  const now = new Date().toISOString();

  return {
    id,
    model,
    name: asString(raw.name, model),
    brand: asString(raw.brand),
    category: asString(raw.category),
    sku: asString(raw.sku),
    shortDescription: asString(raw.shortDescription),
    description: asString(raw.description),
    specifications: normalizeSpecs(raw.specifications),
    images: Array.isArray(raw.images)
      ? raw.images.filter((s): s is string => typeof s === 'string' && s.length > 0).map(migrateImagePath)
      : [],
    price: price !== null && price >= 0 ? price : null,
    isPricePublic: raw.isPricePublic === true,
    purchaseCost: purchaseCost !== null && purchaseCost >= 0 ? purchaseCost : null,
    stock: normalizeStock(raw.stock),
    isPublished: raw.isPublished !== false,
    isArchived: raw.isArchived === true,
    isFeatured: raw.isFeatured === true,
    featuredCaption: typeof raw.featuredCaption === 'string' ? raw.featuredCaption : undefined,
    createdAt: asString(raw.createdAt, now),
    updatedAt: asString(raw.updatedAt, now),
  };
}

export function normalizeCategory(raw: unknown): Category | null {
  if (!isRecord(raw)) return null;
  const id = asString(raw.id);
  const name = asString(raw.name);
  if (!id || !name) return null;
  return { id, name, description: asString(raw.description) };
}

export function normalizeBrand(raw: unknown): Brand | null {
  if (!isRecord(raw)) return null;
  const id = asString(raw.id);
  const name = asString(raw.name);
  if (!id || !name) return null;
  return { id, name, country: typeof raw.country === 'string' ? raw.country : undefined };
}

export type Result = { success: true } | { success: false; error: string };

export const ok: Result = { success: true };
export const fail = (error: string): Result => ({ success: false, error });

/** Validate a stock value for direct edits: null (unconfirmed) or a non-negative integer. */
export function validateStockValue(stock: number | null): Result {
  if (stock === null) return ok;
  if (!Number.isFinite(stock) || !Number.isInteger(stock)) return fail('Stock quantity must be a whole number.');
  if (stock < 0) return fail('Stock quantity cannot be negative.');
  return ok;
}

/** Validate a selling price / purchase cost: null (not entered) or a finite non-negative number. */
export function validateMoney(value: number | null, label: string): Result {
  if (value === null) return ok;
  if (!Number.isFinite(value)) return fail(`${label} must be a valid number.`);
  if (value < 0) return fail(`${label} cannot be negative.`);
  return ok;
}
