import React, { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { getPublicPrice } from '../../features/catalog/pricing';
import { CUSTOMER_REQUEST_SAVED_TEXT } from '../../features/alerts/notifications';
import { useDialog } from '../../hooks/useDialog';
import { X, Plus, Minus, Check, FileText, ImageOff, ArrowRight, Bell, Mail, Bookmark, Star } from 'lucide-react';

export const QuickViewModal: React.FC = () => {
  const {
    quickViewProductId,
    setQuickViewProductId,
    setSelectedProductId,
    getStorefrontProduct,
    addToQuote,
    formatLKR,
    quoteItems,
    addStockAlert,
    isProductSaved,
    toggleSaveProduct,
    getProductRatingSummary,
  } = useStore();

  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [alertEmail, setAlertEmail] = useState('');
  const [alertSubmitted, setAlertSubmitted] = useState(false);
  const [alertError, setAlertError] = useState('');

  const product = getStorefrontProduct(quickViewProductId);
  // Escape, focus trap and scroll lock (see hooks/useDialog.ts)
  const dialogRef = useDialog<HTMLDivElement>(Boolean(product), () => handleClose());

  if (!quickViewProductId || !product) return null;

  const isInQuote = quoteItems.some(i => i.productId === product.id);
  const isSaved = isProductSaved(product.id);

  const handleClose = () => {
    setQuickViewProductId(null);
    setQuantity(1);
    setAddedFeedback(false);
    setAlertEmail('');
    setAlertSubmitted(false);
    setAlertError('');
  };

  const handleAddToCart = () => {
    addToQuote(product, quantity);
    setAddedFeedback(true);
    setTimeout(() => {
      setAddedFeedback(false);
    }, 1400);
  };

  const handleOpenFullDetail = () => {
    handleClose();
    setSelectedProductId(product.id);
  };

  const handleStockAlertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertEmail.trim()) {
      setAlertError('Please enter your email.');
      return;
    }
    const res = addStockAlert(product.id, alertEmail.trim());
    if (res.success) {
      setAlertSubmitted(true);
      setAlertError('');
      setAlertEmail('');
    } else {
      setAlertError(res.error || 'Failed to register notification.');
    }
  };

  // Stock status text and badge
  const renderStock = () => {
    if (product.stock === null) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-[#62798C] bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Availability unconfirmed
        </span>
      );
    }
    if (product.stock === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Out of stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        In stock
      </span>
    );
  };

  const publicPrice = getPublicPrice(product);
  const showPublicPrice = publicPrice !== null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Dimmed Backdrop with soft blur */}
      <div
        className="fixed inset-0 bg-[#10283D]/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
        {/* Lightweight Pop-up Container */}
        <div
          ref={dialogRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={`Quick View: ${product.model}`}
          className="focus:outline-none relative w-full max-w-lg transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all border border-[#DCE7EF] my-6 animate-scaleIn"
          onClick={e => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#DCE7EF] bg-[#F7FAFD]">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#EBF3F8] text-[#275B86] border border-[#275B86]/20">
                Quick Preview
              </span>
              <span className="text-xs text-[#62798C] font-mono">
                SKU: {product.sku}
              </span>
            </div>

            <button
              onClick={handleClose}
              className="p-1 rounded-md text-slate-400 hover:text-[#183B57] hover:bg-slate-200/60 transition-colors"
              aria-label="Close Quick View"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            {/* Top row: Compact Image & Essential Info */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
              {/* Product Thumbnail / Image */}
              <div className="sm:col-span-5 aspect-[4/3] sm:aspect-square bg-[#F1F5F9] rounded-lg border border-[#DCE7EF] p-2 flex items-center justify-center overflow-hidden relative">
                {product.images && product.images.length > 0 && product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt={`${product.brand} ${product.model}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain mix-blend-multiply"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                      const parent = (e.target as HTMLElement).parentElement;
                      if (parent) {
                        const fallback = parent.querySelector('.fallback-box');
                        if (fallback) fallback.classList.remove('hidden');
                      }
                    }}
                  />
                ) : null}

                <div
                  className={`fallback-box flex flex-col items-center justify-center text-center p-2 text-[#62798C] ${
                    product.images && product.images.length > 0 && product.images[0] ? 'hidden' : 'flex'
                  }`}
                >
                  <ImageOff className="w-6 h-6 mb-1 text-slate-400" />
                  <span className="text-[10px] text-slate-500 font-medium">Image pending</span>
                </div>
              </div>

              {/* Title, Brand, Category, Stock & Price */}
              <div className="sm:col-span-7 space-y-2">
                <div>
                  <span className="text-[11px] font-semibold text-[#275B86] uppercase tracking-wider block">
                    {product.brand} · {product.category}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-[#10283D] leading-snug">
                    {product.model}
                  </h3>

                  {(() => {
                    const ratingSum = getProductRatingSummary(product.id);
                    return (
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[1, 2, 3, 4, 5].map(starNum => (
                            <Star
                              key={starNum}
                              className={`w-3 h-3 ${
                                (ratingSum.average ?? 0) >= starNum
                                  ? 'fill-amber-400 text-amber-400'
                                  : ratingSum.average !== null && ratingSum.average >= starNum - 0.5
                                  ? 'fill-amber-400/50 text-amber-400'
                                  : 'text-slate-300 fill-slate-100'
                              }`}
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setQuickViewProductId(null);
                            setSelectedProductId(product.id);
                            setTimeout(() => {
                              const el = document.getElementById('customer-reviews-section');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                          }}
                          className="text-[11px] font-semibold text-[#275B86] hover:underline flex items-center gap-1"
                        >
                          {ratingSum.average !== null ? (
                            <>
                              <span>{ratingSum.average.toFixed(1)}</span>
                              <span className="text-slate-400 font-normal">
                                ({ratingSum.count} {ratingSum.count === 1 ? 'review' : 'reviews'}
                                {ratingSum.demoCount > 0 ? `, ${ratingSum.demoCount} demo` : ''})
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-400 font-normal">No reviews yet</span>
                          )}
                        </button>
                      </div>
                    );
                  })()}
                </div>

                <div className="pt-0.5">
                  {renderStock()}
                </div>

                {/* Price Display */}
                <div className="pt-1">
                  {showPublicPrice ? (
                    <div>
                      <span className="text-lg font-bold text-[#10283D] font-mono tabular-nums">
                        {formatLKR(publicPrice)}
                      </span>
                      <span className="text-[10px] text-slate-400 block -mt-0.5">
                        Indicative price — confirmed in a formal quotation
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-sm font-semibold text-[#275B86] block">
                        Price on Request
                      </span>
                      <span className="text-[10px] text-slate-400 block -mt-0.5">
                        Add to your quotation list to request pricing
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Short Description */}
            <p className="text-xs text-[#183B57] leading-relaxed bg-[#F7FAFD] p-2.5 rounded-lg border border-[#DCE7EF]/70">
              {product.shortDescription || product.description}
            </p>

            {/* Key Specifications (Top 2-3 essential specs) */}
            {product.specifications && product.specifications.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-[#62798C] uppercase tracking-wider block">
                  Essential Specifications
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {product.specifications.slice(0, 4).map((spec, index) => (
                    <div
                      key={index}
                      className="px-2.5 py-1.5 rounded bg-white border border-[#DCE7EF] text-[11px] flex items-center justify-between"
                    >
                      <span className="text-[#62798C] font-medium">{spec.key}:</span>
                      <span className="text-[#10283D] font-semibold truncate max-w-[140px] text-right" title={spec.value}>
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Restock Notification Request (if out of stock) */}
            {product.stock === 0 && (
              <div className="pt-2 border-t border-[#DCE7EF] space-y-1.5">
                {alertSubmitted ? (
                  <div className="flex items-center gap-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 font-medium">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{CUSTOMER_REQUEST_SAVED_TEXT}</span>
                  </div>
                ) : (
                  <form onSubmit={handleStockAlertSubmit} className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#183B57] flex items-center gap-1">
                      <Bell className="w-3 h-3 text-[#275B86]" />
                      <span>Ask to be told when back in stock:</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <Mail className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={alertEmail}
                          onChange={e => {
                            setAlertEmail(e.target.value);
                            if (alertError) setAlertError('');
                          }}
                          placeholder="Enter work email..."
                          className="w-full pl-6 pr-2 py-1 text-xs bg-[#F7FAFD] border border-[#DCE7EF] rounded text-[#183B57] placeholder:text-slate-400 focus:outline-none focus:border-[#275B86]"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-2.5 py-1 text-xs font-semibold text-white bg-[#275B86] hover:bg-[#10283D] rounded transition-colors whitespace-nowrap shadow-xs"
                      >
                        Save request
                      </button>
                    </div>
                    {alertError && (
                      <p className="text-[10px] text-red-600 font-medium">{alertError}</p>
                    )}
                  </form>
                )}
              </div>
            )}

            {/* Action Bar: Quantity & Add to Quote */}
            <div className="pt-3 border-t border-[#DCE7EF] flex items-center gap-2.5">
              {/* Quantity Stepper */}
              <div className="flex items-center border border-[#DCE7EF] rounded-md bg-[#F7FAFD]">
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="p-1.5 text-slate-600 hover:text-[#183B57] transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-2.5 text-xs font-bold text-[#10283D] font-mono min-w-[2rem] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(q => q + 1)}
                  className="p-1.5 text-slate-600 hover:text-[#183B57] transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add to Quote Button */}
              <button
                type="button"
                onClick={() => toggleSaveProduct(product.id)}
                className={`p-2 rounded-md border transition-all ${
                  isSaved
                    ? 'bg-[#EBF3F8] border-[#275B86] text-[#275B86]'
                    : 'bg-white border-[#DCE7EF] hover:border-[#275B86] text-slate-500 hover:text-[#183B57]'
                }`}
                title={isSaved ? 'Remove from Saved for Later' : 'Save for later'}
                aria-label={isSaved ? 'Remove from Saved for Later' : 'Save for later'}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#275B86] text-[#275B86]' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-xs font-semibold transition-all shadow-xs ${
                  addedFeedback
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#275B86] hover:bg-[#10283D] text-white'
                }`}
              >
                {addedFeedback ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Added to Quotation!</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" />
                    <span>{isInQuote ? 'Update Quote Qty' : 'Add to Quote'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Link to Full Details */}
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={handleOpenFullDetail}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#275B86] hover:text-[#10283D] hover:underline"
              >
                <span>View full product specifications &amp; gallery</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
