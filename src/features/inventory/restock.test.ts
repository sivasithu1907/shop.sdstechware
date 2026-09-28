import { describe, expect, it } from 'vitest';
import { makeProduct } from '../../test/fixtures';
import { getDemoActor } from '../staff/actor';
import { normalizeStockMovement } from './history';
import { applyGoodsReceipt, applyStockCount, buildReorderDraft, parseCostInput, validateMovementQuantity } from './restock';

const actor = getDemoActor('stock_editor');
const now = new Date('2026-09-01T10:00:00.000Z');

describe('receipt quantity validation', () => {
  it('accepts whole numbers from 1 up to the limit', () => {
    expect(validateMovementQuantity(1)).toBeNull();
    expect(validateMovementQuantity(250)).toBeNull();
  });
  it('rejects zero, negatives, fractions, NaN and absurd values', () => {
    for (const bad of [0, -3, 2.5, Number.NaN, Number.POSITIVE_INFINITY, 10_000_000]) {
      expect(validateMovementQuantity(bad)).not.toBeNull();
    }
  });
});

describe('goods receipt', () => {
  const router = makeProduct({ id: 'r', model: 'Router', stock: 2, price: 28900, isPricePublic: false, purchaseCost: null });
  const ssd = makeProduct({ id: 's', model: 'SSD', stock: 0, price: 24500, isPricePublic: false, purchaseCost: 19000 });
  const webcam = makeProduct({ id: 'w', model: 'Webcam', stock: null });
  const products = [router, ssd, webcam];

  it('increases stock only for confirmed lines and records one history entry per line', () => {
    const result = applyGoodsReceipt(
      products,
      { reference: 'INV-778', lines: [{ productId: 'r', quantity: 10, unitCost: 21000 }, { productId: 's', quantity: 4, unitCost: null }] },
      actor,
      now,
    );
    expect(result.ok).toBe(true);
    expect(result.products.find(p => p.id === 'r')!.stock).toBe(12);
    expect(result.products.find(p => p.id === 's')!.stock).toBe(4);
    expect(result.products.find(p => p.id === 'w')!.stock).toBeNull();
    expect(result.movements).toHaveLength(2);
    const [m1, m2] = result.movements;
    expect(m1).toMatchObject({ kind: 'goods_receipt', previousStock: 2, quantityDelta: 10, newStock: 12, reference: 'INV-778', unitCost: 21000, totalCost: 210000 });
    expect(m1.actor).toEqual(actor);
    expect(m1.actorLabel).toBe('Demo session (Stock Editor role)');
    expect(m2.batchId).toBe(m1.batchId);
  });

  it('keeps unknown purchase cost unknown (never zero) and never uses the selling price', () => {
    const result = applyGoodsReceipt(products, { lines: [{ productId: 'r', quantity: 5, unitCost: null }] }, actor, now);
    expect(result.ok).toBe(true);
    expect(result.movements[0].unitCost).toBeNull();
    expect(result.movements[0].totalCost).toBeNull();
    expect(result.products.find(p => p.id === 'r')!.purchaseCost).toBeNull();
    expect(JSON.stringify(result.movements[0])).not.toContain('28900');
  });

  it('records a known receipt cost as the last known purchase cost', () => {
    const result = applyGoodsReceipt(products, { lines: [{ productId: 's', quantity: 1, unitCost: 18500 }] }, actor, now);
    expect(result.products.find(p => p.id === 's')!.purchaseCost).toBe(18500);
    expect(result.products.find(p => p.id === 's')!.price).toBe(24500);
  });

  it('requires explicit confirmation when starting stock is unconfirmed', () => {
    const refused = applyGoodsReceipt(products, { lines: [{ productId: 'w', quantity: 3, unitCost: null }] }, actor, now);
    expect(refused.ok).toBe(false);
    expect(refused.errors[0].message).toMatch(/unconfirmed/i);

    const accepted = applyGoodsReceipt(
      products,
      { lines: [{ productId: 'w', quantity: 3, unitCost: null, confirmUnknownStartingStock: true }] },
      actor,
      now,
    );
    expect(accepted.ok).toBe(true);
    expect(accepted.products.find(p => p.id === 'w')!.stock).toBe(3);
    expect(accepted.movements[0].previousStock).toBeNull();
    expect(accepted.movements[0].notes).toMatch(/unconfirmed/i);
  });

  it('applies nothing and records nothing if any line in a batch is invalid', () => {
    const result = applyGoodsReceipt(
      products,
      {
        lines: [
          { productId: 'r', quantity: 10, unitCost: null },
          { productId: 's', quantity: 0, unitCost: null }, // invalid
          { productId: 'missing', quantity: 2, unitCost: null }, // invalid
        ],
      },
      actor,
      now,
    );
    expect(result.ok).toBe(false);
    expect(result.movements).toEqual([]);
    expect(result.products).toBe(products); // unchanged reference
    expect(result.products.find(p => p.id === 'r')!.stock).toBe(2);
    expect(result.errors.map(e => e.productId).sort()).toEqual(['missing', 's']);
  });

  it('rejects duplicate lines, archived products, negative costs and the viewer role', () => {
    expect(applyGoodsReceipt(products, { lines: [{ productId: 'r', quantity: 1, unitCost: null }, { productId: 'r', quantity: 1, unitCost: null }] }, actor).ok).toBe(false);
    expect(applyGoodsReceipt([makeProduct({ id: 'a', isArchived: true })], { lines: [{ productId: 'a', quantity: 1, unitCost: null }] }, actor).ok).toBe(false);
    expect(applyGoodsReceipt(products, { lines: [{ productId: 'r', quantity: 1, unitCost: -1 }] }, actor).ok).toBe(false);
    expect(applyGoodsReceipt(products, { lines: [{ productId: 'r', quantity: 1, unitCost: null }] }, getDemoActor('viewer')).ok).toBe(false);
    expect(applyGoodsReceipt(products, { lines: [] }, actor).ok).toBe(false);
  });
});

describe('reorder draft', () => {
  it('uses purchase cost (unknown when missing), never the selling price, and never changes stock', () => {
    const withCost = makeProduct({ id: 'c', price: 50000, isPricePublic: true, purchaseCost: 41000, stock: 1 });
    const noCost = makeProduct({ id: 'n', price: 30000, isPricePublic: true, purchaseCost: null, stock: 0 });
    const products = [withCost, noCost];
    const snapshot = JSON.stringify(products);

    const outcome = buildReorderDraft(products, { c: 2, n: 5 }, () => 8, actor, now, 'DRAFT-1');
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    const draft = outcome.value;
    expect(draft.reference).toBe('DRAFT-1');
    expect(draft.totalUnits).toBe(7);
    expect(draft.lines.find(l => l.productId === 'c')!.lineCost).toBe(82000);
    expect(draft.lines.find(l => l.productId === 'n')!.unitCost).toBeNull();
    expect(draft.knownCostTotal).toBe(82000);
    expect(draft.linesWithUnknownCost).toBe(1);
    expect(JSON.stringify(draft)).not.toContain('50000');
    expect(JSON.stringify(products)).toBe(snapshot);
  });

  it('rejects invalid draft quantities', () => {
    const p = makeProduct({ id: 'c' });
    expect(buildReorderDraft([p], { c: 0 }, () => 8, actor).ok).toBe(false);
    expect(buildReorderDraft([p], {}, () => 8, actor).ok).toBe(false);
  });
});

describe('stock count', () => {
  const p = makeProduct({ id: 'p', stock: 5 });

  it('records the difference and allows setting stock back to unconfirmed', () => {
    const r = applyStockCount([p], 'p', 3, actor, now, 'Cycle count');
    expect(r.ok).toBe(true);
    expect(r.movement).toMatchObject({ kind: 'stock_count', previousStock: 5, newStock: 3, quantityDelta: -2, notes: 'Cycle count' });
    const u = applyStockCount([p], 'p', null, actor, now);
    expect(u.movement).toMatchObject({ previousStock: 5, newStock: null, quantityDelta: null });
  });

  it('does not record anything when nothing changes or input is invalid', () => {
    expect(applyStockCount([p], 'p', 5, actor, now)).toMatchObject({ ok: true, unchanged: true, movement: null });
    expect(applyStockCount([p], 'p', -1, actor, now).ok).toBe(false);
    expect(applyStockCount([p], 'p', 1.5, actor, now).ok).toBe(false);
    expect(applyStockCount([p], 'missing', 1, actor, now).ok).toBe(false);
  });
});

describe('cost input parsing', () => {
  it('treats blank as unknown and rejects invalid text', () => {
    expect(parseCostInput('')).toBeNull();
    expect(parseCostInput('  ')).toBeNull();
    expect(parseCostInput('21,500')).toBe(21500);
    expect(parseCostInput('0')).toBe(0);
    expect(parseCostInput('abc')).toBeUndefined();
    expect(parseCostInput('-4')).toBeUndefined();
  });
});

describe('legacy history migration', () => {
  it('keeps legacy records but does not present their staff name or selling-price cost as fact', () => {
    const legacy = {
      id: 'restock-seed-1',
      productId: 'prod-tplink-ax53',
      productModel: 'Archer AX53',
      productBrand: 'TP-Link',
      productSku: 'TPL',
      category: 'Networking',
      previousStock: 1,
      addedQuantity: 15,
      newStock: 16,
      timestamp: '2026-03-01T00:00:00.000Z',
      staffName: 'Kasun Perera',
      staffRole: 'owner',
      method: 'quick_restock',
      poNumber: 'PO-1',
      unitPrice: 24500,
      totalCost: 367500,
    };
    const m = normalizeStockMovement(legacy)!;
    expect(m.kind).toBe('legacy');
    expect(m.actor).toBeNull();
    expect(m.actorLabel).toMatch(/not verified/);
    expect(m.unitCost).toBeNull();
    expect(m.totalCost).toBeNull();
    expect(m.quantityDelta).toBe(15);
    expect(m.legacy?.totalCost).toBe(367500); // original preserved, not discarded
  });

  it('round-trips current records and rejects unusable entries', () => {
    const r = applyGoodsReceipt([makeProduct({ id: 'x', stock: 1 })], { lines: [{ productId: 'x', quantity: 2, unitCost: 5 }] }, actor, now);
    const stored = JSON.parse(JSON.stringify(r.movements[0]));
    expect(normalizeStockMovement(stored)).toEqual(r.movements[0]);
    expect(normalizeStockMovement({ foo: 1 })).toBeNull();
    expect(normalizeStockMovement('text')).toBeNull();
  });
});
