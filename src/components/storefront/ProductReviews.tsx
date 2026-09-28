import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/StoreContext';

import {
  Star,
  ThumbsUp,
  MessageSquarePlus,
  Filter,
  Sparkles,
  Building2,
  User,
  X,
  Send,
  SlidersHorizontal,
} from 'lucide-react';

interface ProductReviewsProps {
  productId: string;
  productModel: string;
  productBrand: string;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  productModel,
  productBrand,
}) => {
  const { getProductReviews, getProductRatingSummary, addReview, voteHelpfulReview } = useStore();

  const reviews = getProductReviews(productId);
  const summary = getProductRatingSummary(productId);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'lowest' | 'helpful'>('recent');

  // New review form fields
  const [formRating, setFormRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formComment, setFormComment] = useState('');
  const [formAuthorName, setFormAuthorName] = useState('');
  const [formAuthorCompany, setFormAuthorCompany] = useState('');
  const [formAuthorRole, setFormAuthorRole] = useState('');
  const [formError, setFormError] = useState('');
  const [votedReviews, setVotedReviews] = useState<Record<string, boolean>>({});

  // Filter and sort reviews
  const filteredAndSortedReviews = useMemo(() => {
    let result = [...reviews];

    if (selectedStarFilter !== null) {
      result = result.filter(r => Math.round(r.rating) === selectedStarFilter);
    }

    result.sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === 'highest') {
        return b.rating - a.rating;
      }
      if (sortBy === 'lowest') {
        return a.rating - b.rating;
      }
      if (sortBy === 'helpful') {
        return (b.helpfulCount || 0) - (a.helpfulCount || 0);
      }
      return 0;
    });

    return result;
  }, [reviews, selectedStarFilter, sortBy]);

  const handleVoteHelpful = (reviewId: string) => {
    if (votedReviews[reviewId]) return;
    voteHelpfulReview(reviewId);
    setVotedReviews(prev => ({ ...prev, [reviewId]: true }));
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formTitle.trim()) {
      setFormError('Please enter a review title or summary headline.');
      return;
    }
    if (!formComment.trim() || formComment.trim().length < 15) {
      setFormError('Please write a detailed testimonial (at least 15 characters).');
      return;
    }
    if (!formAuthorName.trim()) {
      setFormError('Please provide your name or organization initials.');
      return;
    }

    addReview({
      productId,
      authorName: formAuthorName.trim(),
      authorCompany: formAuthorCompany.trim() || undefined,
      authorRole: formAuthorRole.trim() || undefined,
      rating: formRating,
      title: formTitle.trim(),
      comment: formComment.trim(),
    });

    // Reset form
    setFormTitle('');
    setFormComment('');
    setFormAuthorName('');
    setFormAuthorCompany('');
    setFormAuthorRole('');
    setFormRating(5);
    setIsFormOpen(false);
  };

  const ratingDescriptions: Record<number, string> = {
    5: '5 Stars - Exceptional enterprise performance & reliability',
    4: '4 Stars - Very good, delivers on technical requirements',
    3: '3 Stars - Average, meets basic office baseline',
    2: '2 Stars - Below expectations for deployment',
    1: '1 Star - Unsatisfactory or frequent issues',
  };

  // Helper to render star icons
  const renderStars = (rating: number, sizeClass = 'w-4 h-4') => {
    return (
      <div className="flex items-center gap-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map(starNum => {
          const isFilled = rating >= starNum;
          const isHalf = !isFilled && rating >= starNum - 0.5;

          return (
            <span key={starNum} className="relative inline-block">
              <Star
                className={`${sizeClass} ${
                  isFilled
                    ? 'fill-amber-400 text-amber-400'
                    : isHalf
                    ? 'fill-amber-400/50 text-amber-400'
                    : 'text-slate-300 fill-slate-100'
                }`}
              />
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="pt-8 border-t border-[#DCE7EF] space-y-6">
      {/* Component Title & Top CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-[#10283D]">
              Reviews
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EBF3F8] text-[#275B86] border border-[#275B86]/20">
              {summary.count} {summary.count === 1 ? 'Review' : 'Reviews'}
            </span>
          </div>
          <p className="text-xs text-[#62798C] mt-0.5">
            Reviews are stored in this browser only and are not moderated or verified. Items marked “Demo sample” are illustrative, not real customers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsFormOpen(prev => !prev)}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-all shadow-xs ${
            isFormOpen
              ? 'bg-[#F1F5F9] text-[#183B57] hover:bg-[#E2E8F0] border border-[#DCE7EF]'
              : 'bg-[#275B86] hover:bg-[#10283D] text-white'
          }`}
        >
          {isFormOpen ? (
            <>
              <X className="w-3.5 h-3.5" />
              <span>Cancel Review</span>
            </>
          ) : (
            <>
              <MessageSquarePlus className="w-4 h-4" />
              <span>Write a Review</span>
            </>
          )}
        </button>
      </div>

      {/* Ratings Summary Card */}
      <div className="bg-[#F7FAFD] border border-[#DCE7EF] rounded-xl p-4 sm:p-6 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Average Rating Block */}
          <div className="md:col-span-4 text-center md:text-left md:border-r md:border-[#DCE7EF] md:pr-6 space-y-2">
            <div className="flex items-baseline justify-center md:justify-start gap-2">
              <span className="text-4xl sm:text-5xl font-black text-[#10283D] font-mono tracking-tight">
                {summary.average !== null ? summary.average.toFixed(1) : '–'}
              </span>
              <span className="text-sm font-semibold text-[#62798C]">/ 5.0</span>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-1.5">
              {renderStars(summary.average ?? 0, 'w-5 h-5')}
            </div>

            <div className="text-xs text-[#62798C]">
              {summary.count > 0
                ? `Based on ${summary.count} review${summary.count !== 1 ? 's' : ''}${summary.demoCount > 0 ? ` (${summary.demoCount} demo sample${summary.demoCount !== 1 ? 's' : ''})` : ''}`
                : 'No reviews yet'}
            </div>


          </div>

          {/* Rating Breakdown Bars */}
          <div className="md:col-span-8 space-y-1.5">
            {[5, 4, 3, 2, 1].map(stars => {
              const starCount = summary.breakdown[stars] || 0;
              const percentage = summary.count > 0 ? (starCount / summary.count) * 100 : 0;
              const isSelected = selectedStarFilter === stars;

              return (
                <button
                  type="button"
                  key={stars}
                  onClick={() => setSelectedStarFilter(isSelected ? null : stars)}
                  className={`w-full group flex items-center gap-3 text-xs py-1 px-2 rounded-md transition-colors text-left ${
                    isSelected ? 'bg-[#EBF3F8] ring-1 ring-[#275B86]/40' : 'hover:bg-white'
                  }`}
                  title={`Filter by ${stars} star reviews`}
                >
                  <span className="w-12 text-[#183B57] font-semibold flex items-center gap-1 shrink-0">
                    <span>{stars}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </span>

                  <div className="flex-1 h-2.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        stars >= 4 ? 'bg-[#275B86]' : stars === 3 ? 'bg-[#489DCA]' : 'bg-amber-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <span className="w-12 text-right font-mono text-[11px] text-[#62798C] group-hover:text-[#183B57] shrink-0">
                    {starCount} ({percentage.toFixed(0)}%)
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Filter Clear banner */}
        {selectedStarFilter !== null && (
          <div className="mt-4 pt-3 border-t border-[#DCE7EF] flex items-center justify-between text-xs text-[#275B86]">
            <span>
              Showing only <strong>{selectedStarFilter}-Star</strong> reviews (
              {summary.breakdown[selectedStarFilter] || 0} found)
            </span>
            <button
              type="button"
              onClick={() => setSelectedStarFilter(null)}
              className="text-xs font-semibold text-red-600 hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Show all reviews</span>
            </button>
          </div>
        )}
      </div>

      {/* Review Submission Form (Expandable) */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmitReview}
          className="bg-white border-2 border-[#275B86]/30 rounded-xl p-5 sm:p-6 shadow-md space-y-5 animate-fadeIn"
        >
          <div className="border-b border-[#DCE7EF] pb-3 flex items-center justify-between">
            <div>
              <h4 className="text-sm sm:text-base font-bold text-[#10283D] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#275B86]" />
                <span>Write a Written Testimonial &amp; Rating</span>
              </h4>
              <p className="text-xs text-[#62798C] mt-0.5">
                Reviewing: <span className="font-semibold text-[#183B57]">{productBrand} {productModel}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Interactive Star Rating Picker */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#10283D]">
              Overall Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(starNum => {
                  const activeLevel = hoverRating !== null ? hoverRating : formRating;
                  const isFilled = activeLevel >= starNum;

                  return (
                    <button
                      type="button"
                      key={starNum}
                      onClick={() => setFormRating(starNum)}
                      onMouseEnter={() => setHoverRating(starNum)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 hover:scale-110 transition-transform focus:outline-none"
                      aria-label={`Rate ${starNum} out of 5 stars`}
                    >
                      <Star
                        className={`w-6 h-6 ${
                          isFilled
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 fill-slate-100'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <span className="text-xs font-medium text-[#275B86] ml-2">
                {ratingDescriptions[hoverRating !== null ? hoverRating : formRating]}
              </span>
            </div>
          </div>

          {/* Headline / Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#10283D]">
              Review Title / Summary Headline <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              placeholder="e.g., Outstanding durability and reliability in our dev workstations"
              className="w-full text-xs px-3.5 py-2.5 bg-[#F7FAFD] border border-[#DCE7EF] rounded-md text-[#183B57] placeholder:text-slate-400 focus:outline-none focus:border-[#275B86] focus:bg-white"
            />
          </div>

          {/* Written Testimonial */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#10283D]">
              Written Testimonial / Experience <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={formComment}
              onChange={e => setFormComment(e.target.value)}
              placeholder="Describe your technical experience, office deployment, build quality, compatibility, and real-world performance..."
              className="w-full text-xs px-3.5 py-2.5 bg-[#F7FAFD] border border-[#DCE7EF] rounded-md text-[#183B57] placeholder:text-slate-400 focus:outline-none focus:border-[#275B86] focus:bg-white resize-y"
            />
            <span className="text-[11px] text-[#62798C] block">
              Minimum 15 characters. Be specific regarding corporate workflow or technical deployment.
            </span>
          </div>

          {/* Reviewer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#10283D]">
                Your Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formAuthorName}
                  onChange={e => setFormAuthorName(e.target.value)}
                  placeholder="e.g., Dinuka Fernando"
                  className="w-full text-xs pl-8 pr-3 py-2 bg-[#F7FAFD] border border-[#DCE7EF] rounded-md text-[#183B57] focus:outline-none focus:border-[#275B86] focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#10283D]">
                Company / Organization
              </label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={formAuthorCompany}
                  onChange={e => setFormAuthorCompany(e.target.value)}
                  placeholder="e.g., Virtusa LK"
                  className="w-full text-xs pl-8 pr-3 py-2 bg-[#F7FAFD] border border-[#DCE7EF] rounded-md text-[#183B57] focus:outline-none focus:border-[#275B86] focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#10283D]">
                Role / Job Title
              </label>
              <input
                type="text"
                value={formAuthorRole}
                onChange={e => setFormAuthorRole(e.target.value)}
                placeholder="e.g., Systems Administrator"
                className="w-full text-xs px-3 py-2 bg-[#F7FAFD] border border-[#DCE7EF] rounded-md text-[#183B57] focus:outline-none focus:border-[#275B86] focus:bg-white"
              />
            </div>
          </div>

          <p className="text-[11px] text-[#62798C] pt-1">
            Prototype: your review is saved only in this browser, is not moderated, and is shown as unverified.
          </p>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#DCE7EF]">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-xs font-medium text-[#62798C] hover:text-[#183B57] rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#275B86] hover:bg-[#10283D] rounded-md transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Review</span>
            </button>
          </div>
        </form>
      )}

      {/* Review Filter & Sort Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 text-xs font-medium text-[#62798C]">
          <Filter className="w-3.5 h-3.5 text-[#275B86]" />
          <span>
            Showing {filteredAndSortedReviews.length} of {reviews.length} {reviews.length === 1 ? 'testimonial' : 'testimonials'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs bg-white border border-[#DCE7EF] rounded-md px-2.5 py-1.5 shadow-2xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#275B86]" />
            <span className="text-[#62798C]">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-[#183B57] font-semibold focus:outline-none cursor-pointer"
            >
              <option value="recent">Most Recent</option>
              <option value="highest">Highest Rating (5★)</option>
              <option value="lowest">Lowest Rating (1★)</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredAndSortedReviews.length === 0 ? (
          <div className="bg-white border border-[#DCE7EF] rounded-xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#EBF3F8] text-[#275B86] flex items-center justify-center mx-auto">
              <Star className="w-6 h-6 text-[#275B86]" />
            </div>
            <h4 className="text-sm font-bold text-[#10283D]">
              {selectedStarFilter !== null
                ? `No ${selectedStarFilter}-star reviews found`
                : 'No customer reviews yet'}
            </h4>
            <p className="text-xs text-[#62798C] max-w-sm mx-auto">
              {selectedStarFilter !== null
                ? 'Try clearing the star filter to view testimonials from other ratings.'
                : 'No reviews yet. Reviews written here are saved in this browser only.'}
            </p>
            {selectedStarFilter !== null ? (
              <button
                type="button"
                onClick={() => setSelectedStarFilter(null)}
                className="text-xs font-semibold text-[#275B86] hover:underline"
              >
                Clear star rating filter
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#275B86] hover:bg-[#10283D] rounded-md transition-colors"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                <span>Write the First Review</span>
              </button>
            )}
          </div>
        ) : (
          filteredAndSortedReviews.map(review => {
            const hasVoted = Boolean(votedReviews[review.id]);

            // Reviewer avatar initials
            const initials = review.authorName
              .split(' ')
              .map(n => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div
                key={review.id}
                className="bg-white border border-[#DCE7EF] rounded-xl p-4 sm:p-5 space-y-3 shadow-2xs hover:border-[#489DCA]/60 transition-all"
              >
                {/* Review Header: User info, Stars, Date */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Avatar Initials */}
                    <div className="w-10 h-10 rounded-full bg-[#10283D] text-[#489DCA] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs border border-[#489DCA]/20">
                      {initials}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#10283D]">
                          {review.authorName}
                        </span>

                        {review.isDemoSample ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300">
                            Demo sample — not a real customer
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            Unverified · saved in this browser
                          </span>
                        )}
                      </div>

                      {/* Role & Company */}
                      {(review.authorRole || review.authorCompany) && (
                        <div className="text-[11px] text-[#62798C] flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {review.authorRole && <span>{review.authorRole}</span>}
                          {review.authorRole && review.authorCompany && <span>•</span>}
                          {review.authorCompany && (
                            <span className="font-medium text-[#275B86]">
                              {review.authorCompany}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stars & Formatted Date */}
                  <div className="flex sm:flex-col sm:items-end gap-2 sm:gap-1">
                    {renderStars(review.rating, 'w-3.5 h-3.5')}
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(review.date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Review Title */}
                <h5 className="text-xs sm:text-sm font-bold text-[#10283D] leading-snug">
                  "{review.title}"
                </h5>

                {/* Testimonial Written Comment */}
                <p className="text-xs text-[#183B57] leading-relaxed whitespace-pre-line">
                  {review.comment}
                </p>

                {/* Review Footer / Helpful Vote */}
                <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#62798C]">
                    Was this technical feedback helpful to your organization?
                  </span>

                  <button
                    type="button"
                    onClick={() => handleVoteHelpful(review.id)}
                    disabled={hasVoted}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                      hasVoted
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-default'
                        : 'bg-[#F7FAFD] text-[#275B86] hover:bg-[#EBF3F8] border border-[#DCE7EF]'
                    }`}
                    title={hasVoted ? 'You marked this review as helpful' : 'Mark this review as helpful'}
                  >
                    <ThumbsUp className={`w-3 h-3 ${hasVoted ? 'text-emerald-600 fill-emerald-600' : ''}`} />
                    <span>{hasVoted ? 'Helpful' : 'Helpful'}</span>
                    <span className="font-mono">({review.helpfulCount || 0})</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
