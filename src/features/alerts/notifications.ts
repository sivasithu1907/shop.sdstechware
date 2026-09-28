import { asFiniteNumberOrNull, asString, isRecord } from '../../lib/storage';
import { createId } from '../../lib/ids';
import type { DemoActor, PriceAlertRequest, Product, StockAlertRequest, StockAlertStatus } from '../../types';
import { getPublicPrice } from '../catalog/pricing';

/**
 * Stock ("back in stock") and price alert requests.
 *
 * IMPORTANT: this prototype has no email/SMS/WhatsApp integration. Saving a
 * request only stores it in this browser. Staff contact customers manually
 * and then record that with "Mark as manually notified".
 */

export const CUSTOMER_REQUEST_SAVED_TEXT =
  'Request saved in this browser only. No automatic email will be sent — SDS Techware staff may contact you manually.';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(normalizeEmail(email));
}

export type Outcome<T> = { ok: true; value: T } | { ok: false; error: string };

export function createStockAlert(product: Product | undefined, email: string, now: Date = new Date()): Outcome<StockAlertRequest> {
  const e = normalizeEmail(email);
  if (!e || !isValidEmail(e)) return { ok: false, error: 'Please enter a valid email address.' };
  if (!product) return { ok: false, error: 'Product not found.' };
  return {
    ok: true,
    value: {
      id: createId('alert'),
      productId: product.id,
      productModel: product.model,
      productBrand: product.brand,
      productSku: product.sku,
      email: e,
      createdAt: now.toISOString(),
      status: 'pending',
    },
  };
}

/** Add a request, replacing an existing one for the same product + email. */
export function upsertStockAlert(list: StockAlertRequest[], alert: StockAlertRequest): StockAlertRequest[] {
  return [alert, ...list.filter(a => !(a.productId === alert.productId && a.email.toLowerCase() === alert.email))];
}

/**
 * Record that staff contacted the customer outside the app.
 * Only pending requests can be marked; the actor and time are recorded.
 */
export function markManuallyNotified(alert: StockAlertRequest, actor: DemoActor, now: Date = new Date()): Outcome<StockAlertRequest> {
  if (alert.status !== 'pending') {
    return { ok: false, error: `Request is already ${alert.status === 'notified' ? 'marked as notified' : 'dismissed'}.` };
  }
  return {
    ok: true,
    value: { ...alert, status: 'notified', statusChangedAt: now.toISOString(), statusChangedBy: actor, notificationMethod: 'manual' },
  };
}

export function dismissRequest(alert: StockAlertRequest, actor: DemoActor, now: Date = new Date()): Outcome<StockAlertRequest> {
  if (alert.status === 'dismissed') return { ok: false, error: 'Request is already dismissed.' };
  return { ok: true, value: { ...alert, status: 'dismissed', statusChangedAt: now.toISOString(), statusChangedBy: actor } };
}

/** Apply a transition to one request in a list. The list is unchanged when the transition fails. */
export function applyAlertTransition(
  list: StockAlertRequest[],
  id: string,
  transition: (a: StockAlertRequest) => Outcome<StockAlertRequest>,
): { list: StockAlertRequest[]; outcome: Outcome<StockAlertRequest> } {
  const target = list.find(a => a.id === id);
  if (!target) return { list, outcome: { ok: false, error: 'Request not found.' } };
  const outcome = transition(target);
  if (!outcome.ok) return { list, outcome };
  return { list: list.map(a => (a.id === id ? outcome.value : a)), outcome };
}

/** Pending request whose product is now in stock — staff may want to contact the customer. */
export function isReadyToContact(alert: StockAlertRequest, product: Product | undefined): boolean {
  return alert.status === 'pending' && !!product && product.stock !== null && product.stock > 0;
}

export function statusLabel(status: StockAlertStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'notified':
      return 'Manually notified';
    case 'dismissed':
      return 'Dismissed';
  }
}

// ---------------- price alerts ----------------

/**
 * Price-drop requests are only accepted for products with a PUBLIC price;
 * otherwise the target/discount would reveal or depend on a hidden price.
 * Nothing monitors prices automatically in this prototype.
 */
export function createPriceAlert(
  product: Product | undefined,
  email: string,
  targetPrice: number | null,
  dropPercentage?: number,
  now: Date = new Date(),
): Outcome<PriceAlertRequest> {
  const e = normalizeEmail(email);
  if (!e || !isValidEmail(e)) return { ok: false, error: 'Please enter a valid email address.' };
  if (!product) return { ok: false, error: 'Product not found.' };
  const publicPrice = getPublicPrice(product);
  if (publicPrice === null) {
    return { ok: false, error: 'Price alerts are only available for products with a published price.' };
  }
  if (targetPrice !== null && (!Number.isFinite(targetPrice) || targetPrice <= 0 || targetPrice >= publicPrice)) {
    return { ok: false, error: 'Target price must be a positive amount below the current published price.' };
  }
  return {
    ok: true,
    value: {
      id: createId('price-alert'),
      productId: product.id,
      productModel: product.model,
      productBrand: product.brand,
      productSku: product.sku,
      currentPrice: publicPrice,
      targetPrice,
      dropPercentage,
      email: e,
      createdAt: now.toISOString(),
      status: 'active',
    },
  };
}

// ---------------- storage normalisation ----------------

/**
 * The earlier prototype seeded demo requests with email addresses at real
 * company domains. Those seeded records (ids "alert-seed-*" and
 * "price-alert-seed-*") are anonymised on load; customer-entered requests
 * are left untouched.
 */
function anonymisedSeedEmail(id: string, email: string): string {
  if (id.startsWith('alert-seed-') || id.startsWith('price-alert-seed-')) {
    return email.endsWith('@example.com') ? email : `${id}@example.com`;
  }
  return email;
}

export function normalizeStockAlert(raw: unknown): StockAlertRequest | null {
  if (!isRecord(raw)) return null;
  const id = asString(raw.id);
  const productId = asString(raw.productId);
  const email = asString(raw.email);
  if (!id || !productId || !email) return null;
  const status: StockAlertStatus = raw.status === 'notified' || raw.status === 'dismissed' ? raw.status : 'pending';
  return {
    id,
    productId,
    productModel: asString(raw.productModel),
    productBrand: asString(raw.productBrand),
    productSku: asString(raw.productSku),
    email: anonymisedSeedEmail(id, email),
    createdAt: asString(raw.createdAt, new Date(0).toISOString()),
    status,
    statusChangedAt: typeof raw.statusChangedAt === 'string' ? raw.statusChangedAt : undefined,
    statusChangedBy: isRecord(raw.statusChangedBy) ? (raw.statusChangedBy as unknown as DemoActor) : undefined,
    notificationMethod: raw.notificationMethod === 'manual' ? 'manual' : undefined,
    isDemoSample: raw.isDemoSample === true || id.startsWith('alert-seed-') ? true : undefined,
  };
}

export function normalizePriceAlert(raw: unknown): PriceAlertRequest | null {
  if (!isRecord(raw)) return null;
  const id = asString(raw.id);
  const productId = asString(raw.productId);
  const email = asString(raw.email);
  if (!id || !productId || !email) return null;
  const status = raw.status === 'triggered' || raw.status === 'cancelled' ? raw.status : 'active';
  const drop = asFiniteNumberOrNull(raw.dropPercentage);
  return {
    id,
    productId,
    productModel: asString(raw.productModel),
    productBrand: asString(raw.productBrand),
    productSku: asString(raw.productSku),
    currentPrice: asFiniteNumberOrNull(raw.currentPrice),
    targetPrice: asFiniteNumberOrNull(raw.targetPrice),
    dropPercentage: drop === null ? undefined : drop,
    email: anonymisedSeedEmail(id, email),
    createdAt: asString(raw.createdAt, new Date(0).toISOString()),
    status,
    isDemoSample: raw.isDemoSample === true || id.startsWith('price-alert-seed-') ? true : undefined,
  };
}
