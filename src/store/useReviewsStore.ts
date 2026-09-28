import { DEFAULT_REVIEWS } from '../data/seedReviews';
import { normalizeReview, ratingSummary, type RatingSummary } from '../features/reviews/reviews';
import { createId } from '../lib/ids';
import { normalizeArray, readJSON, STORAGE_KEYS } from '../lib/storage';
import type { ProductReview } from '../types';
import { usePersistentState } from './usePersistentState';

type WriteErrorHandler = (key: string, message: string) => void;

/**
 * Reviews are stored only in this browser. Seeded reviews are labelled demo
 * samples; submitted reviews are unmoderated and unverified.
 */
export function useReviewsStore(onWriteError: WriteErrorHandler) {
  const [reviews, setReviews] = usePersistentState<ProductReview[]>(
    STORAGE_KEYS.REVIEWS,
    () => readJSON(STORAGE_KEYS.REVIEWS, p => normalizeArray(p, normalizeReview), () => [...DEFAULT_REVIEWS]).value,
    onWriteError,
  );

  const getProductReviews = (productId: string) => reviews.filter(r => r.productId === productId);
  const getProductRatingSummary = (productId: string): RatingSummary => ratingSummary(getProductReviews(productId));

  const addReview = (data: Omit<ProductReview, 'id' | 'date' | 'helpfulCount' | 'verifiedPurchase' | 'isDemoSample'>): ProductReview => {
    const review: ProductReview = {
      ...data,
      rating: Math.min(5, Math.max(1, Math.round(data.rating))),
      id: createId('rev'),
      date: new Date().toISOString().split('T')[0],
      helpfulCount: 0,
      // Purchases cannot be verified in this prototype.
      verifiedPurchase: false,
    };
    setReviews(prev => [review, ...prev]);
    return review;
  };

  const voteHelpfulReview = (reviewId: string) =>
    setReviews(prev => prev.map(r => (r.id === reviewId ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1 } : r)));

  const resetReviewsDemo = () => setReviews([...DEFAULT_REVIEWS]);

  return { reviews, getProductReviews, getProductRatingSummary, addReview, voteHelpfulReview, resetReviewsDemo };
}
