import type { Product, Category, Brand } from '../../types';

export interface SearchMatchResult {
  matches: boolean;
  score: number;
  matchedFields: string[];
}

/**
 * Robust multi-token search for SDS Techware product catalog.
 * Checks product name, model, brand, sku, category, description, and specifications.
 * All tokens in query must match at least one field (AND condition).
 */
export function matchProductSearch(product: Product, query: string): SearchMatchResult {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) {
    return { matches: true, score: 0, matchedFields: [] };
  }

  const tokens = cleanQuery.split(/\s+/).filter(t => t.length > 0);
  if (tokens.length === 0) {
    return { matches: true, score: 0, matchedFields: [] };
  }

  const name = (product.name || '').toLowerCase();
  const model = (product.model || '').toLowerCase();
  const brand = (product.brand || '').toLowerCase();
  const sku = (product.sku || '').toLowerCase();
  const category = (product.category || '').toLowerCase();
  const shortDesc = (product.shortDescription || '').toLowerCase();
  const desc = (product.description || '').toLowerCase();
  const specsText = (product.specifications || [])
    .map(s => `${s.key.toLowerCase()} ${s.value.toLowerCase()}`)
    .join(' ');

  let totalScore = 0;
  const matchedFieldsSet = new Set<string>();

  // Check full query exact or phrase match first for high relevance
  if (model === cleanQuery) {
    totalScore += 120;
    matchedFieldsSet.add('exact_model');
  } else if (model.includes(cleanQuery)) {
    totalScore += 80;
    matchedFieldsSet.add('model');
  }

  if (name === cleanQuery) {
    totalScore += 110;
    matchedFieldsSet.add('exact_name');
  } else if (name.includes(cleanQuery)) {
    totalScore += 70;
    matchedFieldsSet.add('name');
  }

  if (brand === cleanQuery) {
    totalScore += 90;
    matchedFieldsSet.add('exact_brand');
  } else if (brand.includes(cleanQuery)) {
    totalScore += 50;
    matchedFieldsSet.add('brand');
  }

  if (sku === cleanQuery || sku.includes(cleanQuery)) {
    totalScore += 60;
    matchedFieldsSet.add('sku');
  }

  // Token-by-token check: every token must be found in at least one field of this product
  for (const token of tokens) {
    let tokenMatched = false;

    if (model.includes(token)) {
      totalScore += 25;
      matchedFieldsSet.add('model');
      tokenMatched = true;
    }
    if (name.includes(token)) {
      totalScore += 20;
      matchedFieldsSet.add('name');
      tokenMatched = true;
    }
    if (brand.includes(token)) {
      totalScore += 20;
      matchedFieldsSet.add('brand');
      tokenMatched = true;
    }
    if (sku.includes(token)) {
      totalScore += 15;
      matchedFieldsSet.add('sku');
      tokenMatched = true;
    }
    if (category.includes(token)) {
      totalScore += 10;
      matchedFieldsSet.add('category');
      tokenMatched = true;
    }
    if (shortDesc.includes(token) || desc.includes(token)) {
      totalScore += 8;
      matchedFieldsSet.add('description');
      tokenMatched = true;
    }
    if (specsText.includes(token)) {
      totalScore += 8;
      matchedFieldsSet.add('specifications');
      tokenMatched = true;
    }

    // If any token fails to match anywhere in the product, it fails the AND query
    if (!tokenMatched) {
      return { matches: false, score: 0, matchedFields: [] };
    }
  }

  return {
    matches: true,
    score: totalScore,
    matchedFields: Array.from(matchedFieldsSet),
  };
}

export interface SearchSuggestions {
  matchingBrands: { brand: string; count: number }[];
  matchingCategories: { category: string; count: number }[];
  matchingProducts: Product[];
  totalMatches: number;
}

/**
 * Generate autocomplete suggestions (brands, categories, products) for a given query
 */
export function getSearchSuggestions(
  query: string,
  products: Product[],
  categories: Category[],
  brands: Brand[]
): SearchSuggestions {
  const clean = query.trim().toLowerCase();
  if (!clean || clean.length < 1) {
    return {
      matchingBrands: [],
      matchingCategories: [],
      matchingProducts: [],
      totalMatches: 0,
    };
  }

  // Matching Brands
  const matchingBrands = brands
    .filter(b => b.name.toLowerCase().includes(clean))
    .map(b => {
      const count = products.filter(
        p => p.isPublished && !p.isArchived && p.brand.toLowerCase() === b.name.toLowerCase()
      ).length;
      return { brand: b.name, count };
    })
    .filter(b => b.count > 0);

  // Matching Categories
  const matchingCategories = categories
    .filter(c => c.name.toLowerCase().includes(clean))
    .map(c => {
      const count = products.filter(
        p => p.isPublished && !p.isArchived && p.category.toLowerCase() === c.name.toLowerCase()
      ).length;
      return { category: c.name, count };
    })
    .filter(c => c.count > 0);

  // Scored matching products
  const scoredProducts = products
    .filter(p => p.isPublished && !p.isArchived)
    .map(p => ({
      product: p,
      result: matchProductSearch(p, query),
    }))
    .filter(item => item.result.matches)
    .sort((a, b) => b.result.score - a.result.score);

  return {
    matchingBrands: matchingBrands.slice(0, 4),
    matchingCategories: matchingCategories.slice(0, 4),
    matchingProducts: scoredProducts.slice(0, 5).map(i => i.product),
    totalMatches: scoredProducts.length,
  };
}
