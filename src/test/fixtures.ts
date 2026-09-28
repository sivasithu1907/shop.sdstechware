import type { Product } from '../types';

/** Minimal product builder for unit tests. */
export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    model: 'Model 1',
    name: 'Product 1',
    brand: 'BrandA',
    category: 'Networking',
    sku: 'SKU-1',
    shortDescription: '',
    description: '',
    specifications: [],
    images: [],
    price: 10000,
    isPricePublic: true,
    purchaseCost: null,
    stock: 5,
    isPublished: true,
    isArchived: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}
