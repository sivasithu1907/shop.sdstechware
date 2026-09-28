import { describe, expect, it } from 'vitest';
import { makeProduct } from '../../test/fixtures';
import { toStorefrontProduct } from '../catalog/pricing';
import { computeQuoteTotals, normalizeQuoteQuantity, normalizeStoredQuoteItem, resolveQuoteItems } from './quoteItems';
import { buildEnquiryText } from './quotationText';

const customer = { name: 'A', company: '', email: '', phone: '', notes: '' };

describe('quotation list', () => {
  it('migrates the old stored format without keeping the embedded (possibly hidden) price', () => {
    const legacy = { productId: 'prod-mx', quantity: 2, product: makeProduct({ id: 'prod-mx', model: 'MX', price: 36800, isPricePublic: false, stock: 12 }) };
    const stored = normalizeStoredQuoteItem(legacy)!;
    expect(stored.source).toBe('catalog');
    expect(JSON.stringify(stored)).not.toContain('36800');
    expect(stored.snapshot.model).toBe('MX');
  });

  it('treats configurator / warranty / chat lines as custom requests without prices', () => {
    const legacyCustom = { productId: 'prod-custom-123', quantity: 1, product: makeProduct({ id: 'prod-custom-123', price: 3500000, isPricePublic: true }) };
    const stored = normalizeStoredQuoteItem(legacyCustom)!;
    expect(stored.source).toBe('custom');
    const [line] = resolveQuoteItems([stored], []);
    expect(line.product.price).toBeNull();
    expect(line.isListed).toBe(true);
  });

  it('resolves prices from the live storefront catalogue and never exposes hidden prices', () => {
    const catalog = [
      makeProduct({ id: 'pub', price: 1800, isPricePublic: true }),
      makeProduct({ id: 'hid', price: 24500, isPricePublic: false }),
    ].map(toStorefrontProduct);
    const stored = ['pub', 'hid', 'gone'].map(id => normalizeStoredQuoteItem({ productId: id, quantity: 3, snapshot: { model: id } })!);
    const lines = resolveQuoteItems(stored, catalog);
    expect(lines.find(l => l.productId === 'pub')!.product.price).toBe(1800);
    expect(lines.find(l => l.productId === 'hid')!.product.price).toBeNull();
    const gone = lines.find(l => l.productId === 'gone')!;
    expect(gone.isListed).toBe(false);
    expect(gone.product.price).toBeNull();

    const totals = computeQuoteTotals(lines);
    expect(totals.allLinesPriced).toBe(false);
    expect(totals.pricedSubtotal).toBe(5400);
    const text = buildEnquiryText(lines, customer);
    expect(text).not.toContain('24,500');
    expect(text).not.toContain('24500');
    expect(text).toContain('Not available');
  });

  it('only reports a total when every line has a public price', () => {
    const catalog = [makeProduct({ id: 'a', price: 1000 }), makeProduct({ id: 'b', price: 2500 })].map(toStorefrontProduct);
    const lines = resolveQuoteItems(
      [normalizeStoredQuoteItem({ productId: 'a', quantity: 2 })!, normalizeStoredQuoteItem({ productId: 'b', quantity: 1 })!],
      catalog,
    );
    expect(computeQuoteTotals(lines)).toMatchObject({ allLinesPriced: true, pricedSubtotal: 4500, totalUnits: 3, lineCount: 2 });
  });

  it('clamps quantities to whole numbers within limits', () => {
    expect(normalizeQuoteQuantity(0)).toBe(1);
    expect(normalizeQuoteQuantity(-4)).toBe(1);
    expect(normalizeQuoteQuantity(2.9)).toBe(2);
    expect(normalizeQuoteQuantity('7')).toBe(7);
    expect(normalizeQuoteQuantity('abc')).toBe(1);
    expect(normalizeQuoteQuantity(1_000_000)).toBe(9999);
  });
});
