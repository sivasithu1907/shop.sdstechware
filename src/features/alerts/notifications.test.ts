import { describe, expect, it } from 'vitest';
import { makeProduct } from '../../test/fixtures';
import { getDemoActor } from '../staff/actor';
import type { StockAlertRequest } from '../../types';
import {
  applyAlertTransition,
  createPriceAlert,
  createStockAlert,
  dismissRequest,
  isReadyToContact,
  markManuallyNotified,
  normalizePriceAlert,
  normalizeStockAlert,
  upsertStockAlert,
} from './notifications';

const actor = getDemoActor('product_manager');
const now = new Date('2026-09-10T08:30:00.000Z');

const pending = (id: string): StockAlertRequest => ({
  id,
  productId: 'p1',
  productModel: 'M',
  productBrand: 'B',
  productSku: 'S',
  email: `${id}@example.com`,
  createdAt: '2026-09-01T00:00:00.000Z',
  status: 'pending',
});

describe('manual notification status', () => {
  it('records who (demo role) and when, and that the method was manual', () => {
    const r = markManuallyNotified(pending('a'), actor, now);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.status).toBe('notified');
    expect(r.value.notificationMethod).toBe('manual');
    expect(r.value.statusChangedAt).toBe(now.toISOString());
    expect(r.value.statusChangedBy).toEqual({ kind: 'demo_session', role: 'product_manager', label: 'Demo session (Product Manager role)' });
  });

  it('refuses to mark an already-notified or dismissed request again', () => {
    const done = { ...pending('a'), status: 'notified' as const };
    expect(markManuallyNotified(done, actor, now).ok).toBe(false);
    expect(markManuallyNotified({ ...pending('b'), status: 'dismissed' }, actor, now).ok).toBe(false);
    expect(dismissRequest({ ...pending('c'), status: 'dismissed' }, actor, now).ok).toBe(false);
  });

  it('leaves the list unchanged when a transition fails', () => {
    const list = [pending('a'), { ...pending('b'), status: 'notified' as const }];
    const failed = applyAlertTransition(list, 'b', a => markManuallyNotified(a, actor, now));
    expect(failed.outcome.ok).toBe(false);
    expect(failed.list).toBe(list);
    const missing = applyAlertTransition(list, 'zzz', a => markManuallyNotified(a, actor, now));
    expect(missing.outcome.ok).toBe(false);
    expect(missing.list).toBe(list);
    const ok = applyAlertTransition(list, 'a', a => markManuallyNotified(a, actor, now));
    expect(ok.list[0].status).toBe('notified');
    expect(ok.list[1]).toBe(list[1]);
  });

  it('flags pending requests whose product is back in stock', () => {
    expect(isReadyToContact(pending('a'), makeProduct({ id: 'p1', stock: 3 }))).toBe(true);
    expect(isReadyToContact(pending('a'), makeProduct({ id: 'p1', stock: 0 }))).toBe(false);
    expect(isReadyToContact(pending('a'), makeProduct({ id: 'p1', stock: null }))).toBe(false);
    expect(isReadyToContact({ ...pending('a'), status: 'notified' }, makeProduct({ id: 'p1', stock: 3 }))).toBe(false);
  });
});

describe('customer requests', () => {
  it('validates email and de-duplicates per product + email', () => {
    const p = makeProduct({ id: 'p1' });
    expect(createStockAlert(p, 'not-an-email').ok).toBe(false);
    const a = createStockAlert(p, '  Buyer@Example.com ');
    expect(a.ok).toBe(true);
    if (!a.ok) return;
    expect(a.value.email).toBe('buyer@example.com');
    const list = upsertStockAlert([a.value], { ...a.value, id: 'newer' });
    expect(list.map(x => x.id)).toEqual(['newer']);
  });

  it('only accepts price alerts for products with a public price', () => {
    const hidden = makeProduct({ price: 36800, isPricePublic: false });
    const r = createPriceAlert(hidden, 'a@example.com', null);
    expect(r.ok).toBe(false);

    const publicP = makeProduct({ price: 40000, isPricePublic: true });
    const ok = createPriceAlert(publicP, 'a@example.com', 36000, 10);
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.value.currentPrice).toBe(40000);
    expect(createPriceAlert(publicP, 'a@example.com', 45000).ok).toBe(false);
    expect(createPriceAlert(publicP, 'a@example.com', 0).ok).toBe(false);
  });

  it('anonymises the old seeded sample requests but keeps customer-entered ones', () => {
    const seeded = normalizeStockAlert({ ...pending('alert-seed-1'), email: 'procurement@realcompany.lk' })!;
    expect(seeded.email.endsWith('@example.com')).toBe(true);
    expect(seeded.isDemoSample).toBe(true);
    const real = normalizeStockAlert({ ...pending('alert-123'), email: 'someone@company.lk' })!;
    expect(real.email).toBe('someone@company.lk');
    const price = normalizePriceAlert({
      id: 'price-alert-seed-1',
      productId: 'p',
      email: 'x@realcompany.lk',
      currentPrice: 1,
      targetPrice: null,
      createdAt: '',
      status: 'active',
    })!;
    expect(price.email.endsWith('@example.com')).toBe(true);
    expect(normalizeStockAlert({ id: 'x' })).toBeNull();
  });
});
