import { describe, expect, it } from 'vitest';
import { migrateImagePath, normalizeProduct } from './productRecords';
import { ratingSummary } from '../reviews/reviews';

describe('stored product migration', () => {
  it('rewrites the old /src/assets image paths to the public folder', () => {
    expect(migrateImagePath('/src/assets/images/a.jpg')).toBe('/images/products/a.jpg');
    expect(migrateImagePath('data:image/png;base64,xx')).toBe('data:image/png;base64,xx');
    const p = normalizeProduct({ id: 'x', model: 'M', images: ['/src/assets/images/a.jpg', 42], price: 100, stock: 3 })!;
    expect(p.images).toEqual(['/images/products/a.jpg']);
  });

  it('keeps unknown values unknown instead of guessing', () => {
    const p = normalizeProduct({ id: 'x', model: 'M', price: 'abc', stock: -2, purchaseCost: undefined })!;
    expect(p.price).toBeNull();
    expect(p.stock).toBeNull();
    expect(p.purchaseCost).toBeNull();
    expect(p.isPricePublic).toBe(false);
    expect(normalizeProduct({ model: 'no id' })).toBeNull();
  });
});

describe('rating summary', () => {
  it('has no average (not a default 5.0) when there are no reviews', () => {
    expect(ratingSummary([]).average).toBeNull();
  });
});
