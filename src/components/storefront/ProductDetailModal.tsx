import React, { Suspense, lazy, useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { X, Plus, Minus, Check, FileText, ImageOff, ShieldAlert, Bell, BellRing, Mail, Bookmark, Star, TrendingUp } from 'lucide-react';
import { ProductReviews } from './ProductReviews';
import { PriceAlertModal } from './PriceAlertModal';
import { getPublicPrice } from '../../features/catalog/pricing';
import { CUSTOMER_REQUEST_SAVED_TEXT } from '../../features/alerts/notifications';
import { useDialog } from '../../hooks/useDialog';

// Recharts is only needed for the (demo) price chart, so it is loaded on demand.
const PriceHistoryChart = lazy(() => import('./PriceHistoryChart').then(m => ({ default: m.PriceHistoryChart })));

export const ProductDetailModal: React.FC = () => {
  const {
    selectedProductId,
    setSelectedProductId,
    getStorefrontProduct,
    addToQuote,
    formatLKR,
    quoteItems,
    addStockAlert,
    isProductSaved,
    toggleSaveProduct,
    getProductRatingSummary,
    getPriceAlertsForProduct,
  } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [modalAlertEmail, setModalAlertEmail] = useState('');
  const [modalAlertSubmitted, setModalAlertSubmitted] = useState(false);
  const [modalAlertError, setModalAlertError] = useState('');
  const [isPriceAlertOpen, setIsPriceAlertOpen] = useState(false);

  // Storefront-safe product only (unpublished/archived products are not shown).
  const product = getStorefrontProduct(selectedProductId);
  const dialogRef = useDialog<HTMLDivElement>(Boolean(product), () => handleClose());

  if (!selectedProductId || !product) return null;

  const isInQuote = quoteItems.some(i => i.productId === product.id);
  const isSaved = isProductSaved(product.id);
  const ratingSummary = getProductRatingSummary(product.id);
  const activePriceAlerts = getPriceAlertsForProduct(product.id);
  const hasPriceAlert = activePriceAlerts.length > 0;
  const existingPriceAlert = activePriceAlerts[0];

  const handleClose = () => {
    setSelectedProductId(null);
    setQuantity(1);
    setSelectedImageIdx(0);
    setModalAlertEmail('');
    setModalAlertSubmitted(false);
    setModalAlertError('');
    setIsPriceAlertOpen(false);
  };

  const handleModalAlertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAlertEmail.trim()) {
      setModalAlertError('Please enter your email.');
      return;
    }
    const res = addStockAlert(product.id, modalAlertEmail.trim());
    if (res.success) {
      setModalAlertSubmitted(true);
      setModalAlertError('');
      setModalAlertEmail('');
    } else {
      setModalAlertError(res.error || 'Failed to register notification.');
    }
  };

  const handleAddToCart = () => {
    addToQuote(product, quantity);
    setAddedFeedback(true);
    setTimeout(() => {
      setAddedFeedback(false);
    }, 1500);
  };

  // Stock status badge
  const renderStock = () => {
    if (product.stock === null) {
      return (
        <div className="inline-flex items-center gap-1.5 text-xs text-[#62798C] bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Availability not confirmed (Inquire for ETA)</span>
        </div>
      );
    }
    if (product.stock === 0) {
      return (
        <div className="inline-flex items-center gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded font-medium">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span>Currently out of stock</span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded font-medium">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span>In stock for quotation &amp; procurement</span>
      </div>
    );
  };

  const publicPrice = getPublicPrice(product);
  const showPublicPrice = publicPrice !== null;
  const currentImage = product.images && product.images[selectedImageIdx];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-[#10283D]/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
      onClick={handleClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        className="relative bg-white rounded-xl shadow-2xl border border-[#DCE7EF] w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col text-[#183B57] focus:outline-none"
      >
        {/* Header / Close button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DCE7EF] bg-[#F7FAFD]">
          <div className="flex items-center gap-2 text-xs text-[#62798C]">
            <span className="font-semibold text-[#10283D]">{product.brand}</span>
            <span>·</span>
            <span>{product.category}</span>
            <span>·</span>
            <span className="font-mono text-slate-400">SKU: {product.sku}</span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-md text-slate-400 hover:text-[#183B57] hover:bg-slate-100 transition-colors"
            aria-label="Close product details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: Scrollable Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-8">
          {/* Main Product Info & Media Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left Column: Media Gallery */}
          <div className="md:col-span-6 space-y-4">
            <div className="aspect-[4/3] bg-[#F1F5F9] rounded-lg border border-[#DCE7EF] overflow-hidden flex items-center justify-center p-6 relative">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={`${product.brand} ${product.model}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain mix-blend-multiply transition-all"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                    const parent = (e.target as HTMLElement).parentElement;
                    if (parent) {
                      const fallback = parent.querySelector('.detail-fallback');
                      if (fallback) fallback.classList.remove('hidden');
                    }
                  }}
                />
              ) : null}

              {/* Clean Image Pending Fallback */}
              <div
                className={`detail-fallback flex flex-col items-center justify-center text-center p-6 ${
                  currentImage ? 'hidden' : 'flex'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-[#E2E8F0] flex items-center justify-center text-slate-400 mb-2">
                  <ImageOff className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-slate-700">Image pending</span>
                <span className="text-xs text-slate-400 mt-1 max-w-xs">
                  Official high-resolution photography will be uploaded by the catalog administrator.
                </span>
              </div>
            </div>

            {/* Thumbnail selector if multiple images */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`w-16 h-16 rounded border p-1 bg-[#F1F5F9] shrink-0 transition-all ${
                      selectedImageIdx === idx
                        ? 'border-[#275B86] ring-2 ring-[#489DCA]/30'
                        : 'border-[#DCE7EF] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Sample Catalog Disclaimer Callout */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-500 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                Demonstration catalogue entry. Specifications, warranty terms and stock are provisional and confirmed in a formal quotation.
              </span>
            </div>
          </div>

          {/* Right Column: Information, Specs & Purchase Action */}
          <div className="md:col-span-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-[#275B86] uppercase tracking-wider">
                  {product.brand}
                </span>
                <h2 id="product-detail-title" className="text-xl sm:text-2xl font-bold text-[#10283D] mt-0.5">
                  {product.model}
                </h2>
                <p className="text-xs text-[#62798C] mt-1">{product.name}</p>

                {/* Customer Star Rating Summary Line */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map(starNum => {
                      const avg = ratingSummary.average ?? 0;
                      const isFilled = ratingSummary.count > 0 && avg >= starNum;
                      const isHalf = !isFilled && ratingSummary.count > 0 && avg >= starNum - 0.5;
                      return (
                        <Star
                          key={starNum}
                          className={`w-3.5 h-3.5 ${
                            isFilled
                              ? 'fill-amber-400 text-amber-400'
                              : isHalf
                              ? 'fill-amber-400/50 text-amber-400'
                              : 'text-slate-300 fill-slate-100'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('customer-reviews-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-xs font-semibold text-[#275B86] hover:underline flex items-center gap-1"
                  >
                    {ratingSummary.average !== null ? (
                      <>
                        <span>{ratingSummary.average.toFixed(1)}</span>
                        <span className="text-[#62798C] font-normal">
                          ({ratingSummary.count} {ratingSummary.count === 1 ? 'review' : 'reviews'}
                          {ratingSummary.demoCount > 0 ? `, ${ratingSummary.demoCount} demo sample${ratingSummary.demoCount === 1 ? '' : 's'}` : ''})
                        </span>
                      </>
                    ) : (
                      <span className="text-[#62798C] font-normal">No reviews yet</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Availability */}
              <div>{renderStock()}</div>

              {/* Price / Request Price */}
              <div className="py-3 border-y border-[#DCE7EF] space-y-2.5">
                {showPublicPrice ? (
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <span className="text-xs text-[#62798C] block">Indicative Price</span>
                      <span className="text-2xl font-bold text-[#10283D] font-mono tabular-nums">
                        {formatLKR(publicPrice)}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Indicative only. Final price, availability and taxes are confirmed in a formal quotation.
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('price-history-section');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-2.5 py-1.5 bg-[#EBF3F8] hover:bg-[#DCE7EF] text-[#275B86] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        title="View the illustrative (demo) price chart"
                      >
                        <TrendingUp className="w-3.5 h-3.5 text-[#275B86]" />
                        <span>Price chart (demo)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsPriceAlertOpen(true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                          hasPriceAlert
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                            : 'bg-[#10283D] hover:bg-[#183B57] text-white'
                        }`}
                        title={hasPriceAlert ? 'Manage your saved price alert request' : 'Save a price-drop request (browser only, no automatic emails)'}
                      >
                        {hasPriceAlert ? (
                          <>
                            <BellRing className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Alert saved</span>
                          </>
                        ) : (
                          <>
                            <Bell className="w-3.5 h-3.5 text-[#489DCA]" />
                            <span>Price alert</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-[#62798C]">Pricing Model</div>
                      <div className="text-lg font-bold text-[#275B86]">Price on Request</div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Add this item to your quotation list and send the enquiry to SDS Techware to request a formal quotation.
                      </p>
                    </div>

                  </div>
                )}

                {/* Active Price Alert Status Chip */}
                {hasPriceAlert && showPublicPrice && (
                  <div className="flex items-center justify-between p-2 px-3 bg-emerald-50/90 border border-emerald-200 rounded-lg text-xs text-emerald-900 animate-fadeIn">
                    <div className="flex items-center gap-2 min-w-0">
                      <BellRing className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">
                        Price alert request saved in this browser for <strong>{existingPriceAlert?.email}</strong>
                        {existingPriceAlert?.targetPrice
                          ? ` (Trigger: ≤ ${formatLKR(existingPriceAlert.targetPrice)})`
                          : ' (any price drop)'}. No automatic monitoring.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPriceAlertOpen(true)}
                      className="text-[11px] font-bold text-emerald-700 underline hover:text-emerald-900 cursor-pointer ml-2 shrink-0"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5 text-xs text-[#183B57] leading-relaxed">
                <h4 className="font-semibold text-[#10283D]">Overview</h4>
                <p>{product.description || product.shortDescription}</p>
              </div>

              {/* Specifications Table (when supplied) */}
              {product.specifications && product.specifications.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-semibold text-[#10283D] uppercase tracking-wider">
                    Specifications
                  </h4>
                  <div className="border border-[#DCE7EF] rounded-md overflow-hidden text-xs">
                    <dl className="divide-y divide-[#DCE7EF]">
                      {product.specifications.map((spec, index) => (
                        <div
                          key={index}
                          className={`grid grid-cols-3 p-2.5 ${
                            index % 2 === 0 ? 'bg-[#F7FAFD]' : 'bg-white'
                          }`}
                        >
                          <dt className="font-medium text-[#62798C]">{spec.key}</dt>
                          <dd className="col-span-2 text-[#183B57] font-normal">{spec.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              )}
            </div>

            {/* Action Section: Quantity Stepper & Add to Quotation */}
            <div className="pt-4 border-t border-[#DCE7EF] space-y-3">
              {/* Restock notification banner if out of stock */}
              {product.stock === 0 && (
                <div className="bg-[#F7FAFD] border border-[#DCE7EF] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#10283D] flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-[#275B86]" />
                      <span>Ask to be told when back in stock</span>
                    </span>
                    <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
                      Currently Out of Stock
                    </span>
                  </div>

                  {modalAlertSubmitted ? (
                    <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 font-medium animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{CUSTOMER_REQUEST_SAVED_TEXT}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setModalAlertSubmitted(false)}
                        className="text-xs text-emerald-700 underline hover:text-emerald-900 ml-2 shrink-0"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleModalAlertSubmit} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Mail className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="email"
                            required
                            value={modalAlertEmail}
                            onChange={e => {
                              setModalAlertEmail(e.target.value);
                              if (modalAlertError) setModalAlertError('');
                            }}
                            placeholder="Enter work / corporate email..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#DCE7EF] rounded text-[#183B57] placeholder:text-slate-400 focus:outline-none focus:border-[#275B86]"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#275B86] hover:bg-[#10283D] rounded transition-colors whitespace-nowrap shadow-xs"
                        >
                          Save request
                        </button>
                      </div>
                      {modalAlertError && (
                        <p className="text-[11px] text-red-600 font-medium">{modalAlertError}</p>
                      )}
                    </form>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="flex items-center border border-[#DCE7EF] rounded-md bg-[#F7FAFD]">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="p-2 text-slate-600 hover:text-[#183B57] transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-bold text-[#10283D] font-mono min-w-[2.5rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="p-2 text-slate-600 hover:text-[#183B57] transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => toggleSaveProduct(product.id)}
                  className={`flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2.5 rounded-md text-xs sm:text-sm font-semibold border transition-all ${
                    isSaved
                      ? 'bg-[#EBF3F8] border-[#275B86] text-[#275B86] shadow-2xs'
                      : 'bg-white border-[#DCE7EF] hover:border-[#275B86] text-[#183B57] hover:bg-[#F7FAFD]'
                  }`}
                  title={isSaved ? 'Remove from Saved for Later' : 'Save for later'}
                  aria-label={isSaved ? 'Remove from Saved for Later' : 'Save for later'}
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#275B86] text-[#275B86]' : 'text-slate-500'}`} />
                  <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
                </button>

                <button
                  onClick={handleAddToCart}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-md text-xs sm:text-sm font-semibold transition-all shadow-sm ${
                    addedFeedback
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#275B86] hover:bg-[#10283D] text-white'
                  }`}
                >
                  {addedFeedback ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Quotation List!</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>{isInQuote ? 'Update Quotation Quantity' : 'Add to Quotation'}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-[11px] text-[#62798C] text-center">
                No payment is taken. The quotation list prepares an enquiry for you to send to SDS Techware.
              </div>
            </div>
          </div>
        </div>

        {/* 6-Month Price History Trend Chart (Recharts) */}
        <div id="price-history-section">
          <Suspense fallback={<div className="h-24 rounded-xl border border-[#DCE7EF] bg-[#F8FAFC] text-xs text-[#62798C] flex items-center justify-center">Loading chart…</div>}>
          <PriceHistoryChart
            product={product}
            onOpenPriceAlert={() => setIsPriceAlertOpen(true)}
            hasActiveAlert={hasPriceAlert}
          />
          </Suspense>
        </div>

        {/* Customer Reviews & Written Testimonials Component */}
        <div id="customer-reviews-section">
          <ProductReviews
            productId={product.id}
            productModel={product.model}
            productBrand={product.brand}
          />
        </div>
      </div>
    </div>

    {/* Price Drop Alert Subscription Modal */}
    {isPriceAlertOpen && (
      <PriceAlertModal
        isOpen={isPriceAlertOpen}
        onClose={() => setIsPriceAlertOpen(false)}
        product={product}
      />
    )}
  </div>
  );
};
