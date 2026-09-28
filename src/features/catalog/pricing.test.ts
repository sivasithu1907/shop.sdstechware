import { describe, expect, it } from 'vitest';
import { makeProduct } from '../../test/fixtures';
import {
  comparePublicPrice,
  computeBudgetStats,
  computePublicPriceBounds,
  getPublicPrice,
  isBudgetFilterActive,
  matchesBudget,
  toStorefrontProduct,
} from './pricing';
import { filterAndSortCatalog } from './catalogFilters';

describe('public price rule', () => {
  it('shows a price only when visibility is on and the price is a positive number', () => {
    expect(getPublicPrice(makeProduct({ price: 43500, isPricePublic: true }))).toBe(43500);
    expect(getPublicPrice(makeProduct({ price: 43500, isPricePublic: false }))).toBeNull();
    expect(getPublicPrice(makeProduct({ price: null, isPricePublic: true }))).toBeNull();
  });

  it('never publishes zero, negative or non-finite prices (treated as Price on Request)', () => {
    expect(getPublicPrice(makeProduct({ price: 0, isPricePublic: true }))).toBeNull();
    expect(getPublicPrice(makeProduct({ price: -5, isPricePublic: true }))).toBeNull();
    expect(getPublicPrice(makeProduct({ price: Number.NaN, isPricePublic: true }))).toBeNull();
    expect(getPublicPrice(makeProduct({ price: Number.POSITIVE_INFINITY, isPricePublic: true }))).toBeNull();
  });

  it('storefront copies carry no hidden price and no purchase cost', () => {
    const hidden = toStorefrontProduct(makeProduct({ price: 36800, isPricePublic: false, purchaseCost: 30000 }));
    expect(hidden.price).toBeNull();
    expect(hidden.isPricePublic).toBe(false);
    expect('purchaseCost' in hidden).toBe(false);
    expect(JSON.stringify(hidden)).not.toContain('36800');
    expect(JSON.stringify(hidden)).not.toContain('30000');

    const zero = toStorefrontProduct(makeProduct({ price: 0, isPricePublic: true }));
    expect(zero.price).toBeNull();
    expect(zero.isPricePublic).toBe(false);
  });
});

describe('budget, bounds, sorting and statistics use public prices only', () => {
  const pub1 = makeProduct({ id: 'a', model: 'A', price: 3800, isPricePublic: true });
  const pub2 = makeProduct({ id: 'b', model: 'B', price: 43500, isPricePublic: true });
  const hiddenCheap = makeProduct({ id: 'h1', model: 'H1', price: 100, isPricePublic: false });
  const hiddenDear = makeProduct({ id: 'h2', model: 'H2', price: 999999, isPricePublic: false });
  const all = [hiddenDear, pub2, hiddenCheap, pub1];

  it('slider bounds ignore hidden prices', () => {
    const bounds = computePublicPriceBounds(all);
    expect(bounds).toEqual({ min: 3000, max: 45000 });
  });

  it('hidden-price products follow the "include Price on Request" switch, whatever their hidden price', () => {
    const budget = { min: 20000, max: 50000, includeQuoteOnly: false };
    expect(matchesBudget(hiddenCheap, budget)).toBe(false);
    expect(matchesBudget(hiddenDear, budget)).toBe(false);
    expect(matchesBudget(hiddenCheap, { ...budget, includeQuoteOnly: true })).toBe(true);
    expect(matchesBudget(hiddenDear, { ...budget, includeQuoteOnly: true })).toBe(true);
    expect(matchesBudget(pub1, budget)).toBe(false);
    expect(matchesBudget(pub2, budget)).toBe(true);
  });

  it('price sorting puts Price-on-Request items last in both directions without ordering them by hidden price', () => {
    const asc = [...all].sort((x, y) => comparePublicPrice(x, y, 'asc')).map(p => p.id);
    const desc = [...all].sort((x, y) => comparePublicPrice(x, y, 'desc')).map(p => p.id);
    expect(asc.slice(0, 2)).toEqual(['a', 'b']);
    expect(desc.slice(0, 2)).toEqual(['b', 'a']);
    // Hidden items keep their original relative order (h2 before h1 in the input), in both directions.
    expect(asc.slice(2)).toEqual(['h2', 'h1']);
    expect(desc.slice(2)).toEqual(['h2', 'h1']);
  });

  it('catalogue price sort gives the same hidden-item order regardless of hidden values', () => {
    const budget = { min: 0, max: 100000, includeQuoteOnly: true };
    const sortWith = (hiddenPrices: [number, number]) =>
      filterAndSortCatalog(
        [
          makeProduct({ id: 'x', model: 'Xeta', price: hiddenPrices[0], isPricePublic: false }),
          makeProduct({ id: 'y', model: 'Alpha', price: hiddenPrices[1], isPricePublic: false }),
          pub1,
        ],
        { category: 'all', brands: [], inStockOnly: false, search: '', budget, sort: 'price_asc' },
      ).map(p => p.id);
    expect(sortWith([1, 999999])).toEqual(sortWith([999999, 1]));
  });

  it('budget statistics exclude hidden prices', () => {
    const stats = computeBudgetStats(all, { min: 0, max: 50000, includeQuoteOnly: true });
    expect(stats.inRangePricedCount).toBe(2);
    expect(stats.quoteOnlyCount).toBe(2);
    expect(stats.avgPrice).toBe(Math.round((3800 + 43500) / 2));
    expect(stats.lowestPrice).toBe(3800);
    expect(stats.highestPrice).toBe(43500);

    const none = computeBudgetStats([hiddenCheap], { min: 0, max: 50000, includeQuoteOnly: true });
    expect(none.avgPrice).toBeNull();
  });

  it('reports whether the budget filter narrows the catalogue', () => {
    const bounds = { min: 3000, max: 45000 };
    expect(isBudgetFilterActive({ ...bounds, includeQuoteOnly: true }, bounds)).toBe(false);
    expect(isBudgetFilterActive({ min: 3000, max: 20000, includeQuoteOnly: true }, bounds)).toBe(true);
    expect(isBudgetFilterActive({ ...bounds, includeQuoteOnly: false }, bounds)).toBe(true);
  });
});
