import React, { useState } from 'react';
import { Product } from '../../types';
import { useStore } from '../../store/StoreContext';
import { getPublicPrice } from '../../features/catalog/pricing';
import { CUSTOMER_REQUEST_SAVED_TEXT } from '../../features/alerts/notifications';
import { Plus, Check, Eye, ImageOff, Scale, Bell, Mail, Bookmark, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const {
    addToQuote,
    setSelectedProductId,
    setQuickViewProductId,
    formatLKR,
    quoteItems,
    compareProductIds,
    toggleCompareProduct,
    isCompareMode,
    addStockAlert,
    isProductSaved,
    toggleSaveProduct,
    getProductRatingSummary,
  } = useStore();
  const [justAdded, setJustAdded] = useState(false);
  const [alertEmail, setAlertEmail] = useState('');
  const [alertSubmitted, setAlertSubmitted] = useState(false);
  const [alertError, setAlertError] = useState('');

  const isInQuote = quoteItems.some(i => i.productId === product.id);
  const isComparing = compareProductIds.includes(product.id);
  const isSaved = isProductSaved(product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQuote(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleCompareProduct(product.id);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickViewProductId(product.id);
  };

  const handleAlertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  // Stock status text and styling
  const renderStockStatus = () => {
    if (product.stock === null) {
      return (
        <span className="text-[11px] text-[#62798C] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Availability not confirmed
        </span>
      );
    }
    if (product.stock === 0) {
      return (
        <span className="text-[11px] text-red-600 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Out of stock
        </span>
      );
    }
    return (
      <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        In stock
      </span>
    );
  };

  // Public price rule: see features/catalog/pricing.ts
  const publicPrice = getPublicPrice(product);
  const showPublicPrice = publicPrice !== null;

  return (
    <div
      onClick={() => setSelectedProductId(product.id)}
      className={`group bg-white rounded-lg border overflow-hidden transition-all duration-200 cursor-pointer flex flex-col justify-between ${
        isComparing
          ? 'border-[#275B86] shadow-md ring-2 ring-[#275B86]/30'
          : 'border-[#DCE7EF] hover:border-[#489DCA]/60 hover:shadow-md hover:-translate-y-1'
      }`}
    >
      <div>
        {/* Product Image Area on Soft Blue-Grey Background */}
        <div className="relative aspect-[4/3] bg-[#F1F5F9] overflow-hidden flex items-center justify-center p-3 border-b border-[#DCE7EF]">
          {/* Compare Badge / Toggle Button */}
          <button
            type="button"
            onClick={handleToggleCompare}
            className={`absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium transition-all ${
              isComparing
                ? 'bg-[#10283D] text-white shadow-sm opacity-100 ring-2 ring-[#489DCA]'
                : isCompareMode
                ? 'bg-white/95 text-[#183B57] border border-[#DCE7EF] shadow-xs opacity-100 hover:bg-[#EBF3F8]'
                : 'bg-white/90 text-[#183B57] opacity-0 group-hover:opacity-100 border border-[#DCE7EF] hover:bg-[#EBF3F8]'
            }`}
            title={isComparing ? 'Remove from comparison' : 'Add to comparison matrix'}
            aria-label={isComparing ? 'Remove from compare' : 'Add to compare'}
          >
            <Scale className={`w-3 h-3 ${isComparing ? 'text-[#489DCA]' : 'text-[#275B86]'}`} />
            <span className="text-[10px] font-semibold">{isComparing ? 'Comparing' : 'Compare'}</span>
          </button>

          {/* Bookmark / Save for Later Toggle Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleSaveProduct(product.id);
            }}
            className={`absolute top-2 right-2 z-10 p-1.5 rounded-full transition-all duration-150 ${
              isSaved
                ? 'bg-white text-[#275B86] shadow-sm ring-1 ring-[#275B86]/40 opacity-100'
                : 'bg-white/90 text-slate-400 hover:text-[#275B86] hover:bg-white border border-[#DCE7EF] shadow-2xs opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
            }`}
            title={isSaved ? 'Remove from Saved for Later' : 'Save for later'}
            aria-label={isSaved ? `Remove ${product.model} from Saved for Later` : `Save ${product.model} for later`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-[#275B86] text-[#275B86]' : ''}`} />
          </button>

          {product.images && product.images.length > 0 && product.images[0] ? (
            <img
              src={product.images[0]}
              alt={`${product.brand} ${product.model}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // Image fallback
                (e.target as HTMLElement).style.display = 'none';
                const parent = (e.target as HTMLElement).parentElement;
                if (parent) {
                  const fallback = parent.querySelector('.fallback-box');
                  if (fallback) fallback.classList.remove('hidden');
                }
              }}
            />
          ) : null}

          {/* Clean 'Image pending' Fallback State */}
          <div
            className={`fallback-box flex flex-col items-center justify-center text-center p-4 text-[#62798C] ${
              product.images && product.images.length > 0 && product.images[0] ? 'hidden' : 'flex'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-[#E2E8F0] flex items-center justify-center text-slate-400 mb-2">
              <ImageOff className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-600">Image pending</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Catalog item {product.sku}</span>
          </div>

          {/* Interactive Quick View Button Overlay on Image */}
          <button
            type="button"
            onClick={handleQuickView}
            className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-[#10283D]/90 hover:bg-[#10283D] text-white shadow-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 backdrop-blur-xs cursor-pointer"
            title={`Quick preview ${product.model}`}
            aria-label={`Quick View ${product.model}`}
          >
            <Eye className="w-3.5 h-3.5 text-[#489DCA]" />
            <span className="tracking-wide whitespace-nowrap">Quick View</span>
          </button>
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-2">
          {/* Metadata Row: Category, Brand & Rating */}
          <div className="flex items-center justify-between gap-1 text-[11px] text-[#62798C] font-medium">
            <div className="flex items-center gap-1.5 truncate">
              <span>{product.brand}</span>
              <span className="text-slate-300">·</span>
              <span className="truncate">{product.category}</span>
            </div>

            {(() => {
              const ratingSum = getProductRatingSummary(product.id);
              if (ratingSum.count === 0 || ratingSum.average === null) return null;
              const allDemo = ratingSum.demoCount === ratingSum.count;
              return (
                <div className="flex items-center gap-1 text-[11px] font-semibold text-[#183B57] shrink-0">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{ratingSum.average.toFixed(1)}</span>
                  <span className="text-[10px] text-slate-400 font-normal" title={allDemo ? 'Demo sample reviews, not real customers' : undefined}>
                    ({ratingSum.count}{allDemo ? ' demo' : ''})
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Product Name / Model */}
          <h3 className="text-sm font-semibold text-[#183B57] group-hover:text-[#275B86] transition-colors line-clamp-1 leading-snug">
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                setSelectedProductId(product.id);
              }}
              className="text-left focus:outline-none focus-visible:underline focus-visible:text-[#275B86]"
            >
              {product.model}
            </button>
          </h3>

          {/* Short Description */}
          <p className="text-xs text-[#62798C] line-clamp-2 leading-relaxed min-h-[2.5rem]">
            {product.shortDescription || 'Genuine enterprise & commercial IT solution.'}
          </p>
        </div>
      </div>

      {/* Card Footer: Availability, Price / Request Price, and Add Button */}
      <div className="px-4 pb-4 pt-1 border-t border-slate-100 mt-2 space-y-3">
        <div className="flex items-center justify-between text-xs pt-1">
          {renderStockStatus()}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            {showPublicPrice ? (
              <div>
                <span className="text-sm font-bold text-[#10283D] font-mono tabular-nums block">
                  {formatLKR(publicPrice)}
                </span>
                <span className="text-[10px] text-slate-400 block -mt-0.5">Indicative price</span>
              </div>
            ) : (
              <div>
                <span className="text-xs font-semibold text-[#275B86] block">
                  Request price
                </span>
                <span className="text-[10px] text-slate-400 block -mt-0.5">Quotation model</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleQuickView}
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium text-[#275B86] bg-[#F7FAFD] border border-[#DCE7EF] hover:bg-[#EBF3F8] hover:border-[#275B86]/40 transition-colors"
              title="Quick preview product"
              aria-label={`Quick View ${product.model}`}
            >
              <Eye className="w-3.5 h-3.5 text-[#275B86]" />
              <span className="hidden sm:inline text-[11px] font-semibold">Preview</span>
            </button>

            <button
              type="button"
              onClick={handleAdd}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
                justAdded
                  ? 'bg-emerald-600 text-white'
                  : isInQuote
                  ? 'bg-[#EBF3F8] text-[#275B86] hover:bg-[#275B86] hover:text-white'
                  : 'bg-[#F1F5F9] text-[#183B57] hover:bg-[#275B86] hover:text-white'
              }`}
              title="Add to quotation enquiry"
            >
              {justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Added</span>
                </>
              ) : isInQuote ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>In Quote</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Quote</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 'Email me when back in stock' input field for currently out-of-stock items */}
        {product.stock === 0 && (
          <div
            onClick={e => e.stopPropagation()}
            className="pt-2.5 border-t border-[#DCE7EF] space-y-1.5"
          >
            {alertSubmitted ? (
              <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded text-[11px] text-emerald-800 font-medium animate-fadeIn">
                <div className="flex items-center gap-1.5 truncate">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate" title={CUSTOMER_REQUEST_SAVED_TEXT}>Request saved. No automatic email — staff may contact you.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAlertSubmitted(false)}
                  className="text-[10px] text-emerald-700 underline hover:text-emerald-900 ml-1.5 shrink-0"
                >
                  Change
                </button>
              </div>
            ) : (
              <form onSubmit={handleAlertSubmit} className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#10283D] flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Bell className="w-3 h-3 text-[#275B86]" />
                    <span>Ask to be told when back in stock:</span>
                  </span>
                  <span className="text-[9px] text-[#62798C] font-normal">Manual follow-up</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <Mail className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      aria-label={`Email for back-in-stock request: ${product.model}`}
                      value={alertEmail}
                      onChange={e => {
                        setAlertEmail(e.target.value);
                        if (alertError) setAlertError('');
                      }}
                      placeholder="Enter work email..."
                      className="w-full pl-6 pr-2 py-1.5 text-[11px] bg-[#F7FAFD] border border-[#DCE7EF] rounded text-[#183B57] placeholder:text-slate-400 focus:outline-none focus:border-[#275B86] focus:bg-white transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 text-[11px] font-semibold text-white bg-[#275B86] hover:bg-[#10283D] rounded transition-colors whitespace-nowrap shadow-xs"
                  >
                    Request
                  </button>
                </div>
                {alertError && (
                  <p className="text-[10px] text-red-600 font-medium">{alertError}</p>
                )}
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
