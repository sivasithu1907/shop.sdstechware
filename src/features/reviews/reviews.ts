import { DEFAULT_REVIEWS } from '../../data/seedReviews';
import { asFiniteNumberOrNull, asString, isRecord } from '../../lib/storage';
import type { ProductReview } from '../../types';

export interface RatingSummary {
  /** null when there are no reviews (never shown as a default "5.0"). */
  average: number | null;
  count: number;
  breakdown: Record<number, number>;
  demoCount: number;
}

export function ratingSummary(reviews: ProductReview[]): RatingSummary {
  const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  if (reviews.length === 0) return { average: null, count: 0, breakdown, demoCount: 0 };
  let total = 0;
  for (const r of reviews) {
    const rounded = Math.min(5, Math.max(1, Math.round(r.rating)));
    breakdown[rounded] = (breakdown[rounded] || 0) + 1;
    total += r.rating;
  }
  return {
    average: Math.round((total / reviews.length) * 10) / 10,
    count: reviews.length,
    breakdown,
    demoCount: reviews.filter(r => r.isDemoSample).length,
  };
}

const SEED_BY_ID = new Map(DEFAULT_REVIEWS.map(r => [r.id, r]));

/**
 * Normalise a stored review. Reviews seeded by the earlier prototype (same
 * ids as DEFAULT_REVIEWS) named real companies as reviewers; they are replaced
 * by the anonymised demo versions (helpful votes kept). Reviews written in
 * the browser are kept as entered; the self-declared "verified" flag is kept
 * but never displayed as verified.
 */
export function normalizeReview(raw: unknown): ProductReview | null {
  if (!isRecord(raw)) return null;
  const id = asString(raw.id);
  const productId = asString(raw.productId);
  const rating = asFiniteNumberOrNull(raw.rating);
  if (!id || !productId || rating === null) return null;

  const seed = SEED_BY_ID.get(id);
  const helpful = asFiniteNumberOrNull(raw.helpfulCount) ?? 0;
  if (seed) return { ...seed, helpfulCount: Math.max(seed.helpfulCount, helpful) };

  return {
    id,
    productId,
    authorName: asString(raw.authorName, 'Anonymous'),
    authorCompany: typeof raw.authorCompany === 'string' && raw.authorCompany ? raw.authorCompany : undefined,
    authorRole: typeof raw.authorRole === 'string' && raw.authorRole ? raw.authorRole : undefined,
    rating: Math.min(5, Math.max(1, rating)),
    title: asString(raw.title),
    comment: asString(raw.comment),
    date: asString(raw.date),
    verifiedPurchase: raw.verifiedPurchase === true,
    helpfulCount: helpful,
    isDemoSample: raw.isDemoSample === true ? true : undefined,
  };
}
