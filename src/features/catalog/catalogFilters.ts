import type { Product } from '../../types';
import { comparePublicPrice, matchesBudget, type BudgetFilter } from './pricing';
import { matchProductSearch } from './search';

export type CatalogSort = 'featured' | 'relevance' | 'name' | 'brand' | 'price_asc' | 'price_desc';

export interface CatalogCriteria {
  category: string; // 'all' or category name
  brands: string[]; // empty = all brands
  inStockOnly: boolean;
  search: string;
  budget: BudgetFilter;
  sort: CatalogSort;
}

const displayName = (p: Product) => p.name || p.model;

/**
 * Filter and sort storefront products. Pure function shared by the catalogue
 * grid, breadcrumbs count and mobile drawer so all counts agree.
 * Price-related steps use only public prices.
 */
export function filterAndSortCatalog(products: Product[], c: CatalogCriteria): Product[] {
  const matched: Array<{ product: Product; score: number }> = [];
  for (const p of products) {
    if (c.category !== 'all' && p.category !== c.category) continue;
    if (c.brands.length > 0 && !c.brands.includes(p.brand)) continue;
    if (c.inStockOnly && !(p.stock !== null && p.stock > 0)) continue;
    if (!matchesBudget(p, c.budget)) continue;
    const search = matchProductSearch(p, c.search);
    if (!search.matches) continue;
    matched.push({ product: p, score: search.score });
  }

  const byFeaturedThenName = (a: Product, b: Product) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return displayName(a).localeCompare(displayName(b));
  };

  matched.sort((x, y) => {
    const a = x.product;
    const b = y.product;
    switch (c.sort) {
      case 'relevance':
        if (y.score !== x.score) return y.score - x.score;
        return byFeaturedThenName(a, b);
      case 'featured':
        return byFeaturedThenName(a, b);
      case 'name':
        return displayName(a).localeCompare(displayName(b));
      case 'brand': {
        const d = a.brand.localeCompare(b.brand);
        return d !== 0 ? d : displayName(a).localeCompare(displayName(b));
      }
      case 'price_asc':
      case 'price_desc': {
        const d = comparePublicPrice(a, b, c.sort === 'price_asc' ? 'asc' : 'desc');
        return d !== 0 ? d : displayName(a).localeCompare(displayName(b));
      }
      default:
        return 0;
    }
  });

  return matched.map(m => m.product);
}

export function countByCategory(products: Product[]): Record<string, number> {
  const counts: Record<string, number> = { all: products.length };
  for (const p of products) counts[p.category] = (counts[p.category] || 0) + 1;
  return counts;
}

export function countByBrand(products: Product[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of products) counts[p.brand] = (counts[p.brand] || 0) + 1;
  return counts;
}
