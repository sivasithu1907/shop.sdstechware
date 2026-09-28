import React, { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { getPublicPrice } from '../../features/catalog/pricing';
import { useDialog } from '../../hooks/useDialog';
import { Bookmark, X, Trash2, FileText, ArrowRight, Check, Eye, Star } from 'lucide-react';

export const SavedForLaterDrawer: React.FC = () => {
  const {
    isSavedDrawerOpen,
    setIsSavedDrawerOpen,
    savedProducts,
    removeSavedProduct,
    clearSavedProducts,
    moveSavedToQuote,
    moveAllSavedToQuote,
    addToQuote,
    quoteItems,
    setSelectedProductId,
    setIsQuoteDrawerOpen,
    formatLKR,
    getProductRatingSummary,
  } = useStore();

  const [clearConfirm, setClearConfirm] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const dialogRef = useDialog<HTMLDivElement>(isSavedDrawerOpen, () => {
    setIsSavedDrawerOpen(false);
    setClearConfirm(false);
  });

  if (!isSavedDrawerOpen) return null;

  // Filter products by local query if provided
  const displayedProducts = savedProducts.filter(p => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      p.model.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const isItemInQuote = (productId: string) => {
    return quoteItems.some(item => item.productId === productId);
  };

  const getQuoteQuantity = (productId: string) => {
    const item = quoteItems.find(item => item.productId === productId);
    return item ? item.quantity : 0;
  };

  const handleOpenProduct = (productId: string) => {
    setSelectedProductId(productId);
    setIsSavedDrawerOpen(false);
  };

  const handleTransferAllToQuote = () => {
    moveAllSavedToQuote();
    // Prompt option to view quotation
    setIsSavedDrawerOpen(false);
    setIsQuoteDrawerOpen(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-[#10283D]/50 backdrop-blur-xs flex justify-end"
      onClick={() => {
        setIsSavedDrawerOpen(false);
        setClearConfirm(false);
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Saved for later"
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        className="focus:outline-none w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between text-[#183B57] animate-slideInRight"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-[#DCE7EF] flex items-center justify-between bg-[#F7FAFD]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EBF3F8] text-[#275B86] flex items-center justify-center border border-[#275B86]/20">
              <Bookmark className="w-4 h-4 fill-[#275B86]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#10283D]">Saved for Later</h2>
                <span className="text-xs bg-[#275B86] text-white px-2 py-0.5 rounded-full font-bold">
                  {savedProducts.length}
                </span>
              </div>
              <p className="text-[11px] text-[#62798C]">
                Locally saved procurement bookmark list
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsSavedDrawerOpen(false);
              setClearConfirm(false);
            }}
            className="p-1 rounded-md text-slate-400 hover:text-[#183B57] hover:bg-slate-200/60 transition-colors"
            aria-label="Close saved products drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar inside drawer when 3+ items */}
        {savedProducts.length >= 3 && (
          <div className="px-4 py-2 bg-white border-b border-[#DCE7EF]">
            <input
              type="text"
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              placeholder="Filter saved items by model or brand..."
              className="w-full text-xs px-3 py-1.5 bg-[#F7FAFD] border border-[#DCE7EF] rounded text-[#183B57] placeholder:text-slate-400 focus:outline-none focus:border-[#275B86]"
            />
          </div>
        )}

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {savedProducts.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#EBF3F8] text-[#275B86] flex items-center justify-center mx-auto border border-[#275B86]/15">
                <Bookmark className="w-7 h-7 text-[#275B86]" />
              </div>
              <h3 className="text-base font-bold text-[#10283D]">Your saved list is empty</h3>
              <p className="text-xs text-[#62798C] max-w-xs mx-auto leading-relaxed">
                Click the bookmark icon on any product in the store to save it here. Items are saved in your browser storage so you can easily return and request corporate quotes.
              </p>
              <div className="pt-3">
                <button
                  onClick={() => setIsSavedDrawerOpen(false)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#275B86] hover:bg-[#10283D] rounded-md transition-colors shadow-xs"
                >
                  <span>Explore Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Header summary row */}
              <div className="flex items-center justify-between text-xs text-[#62798C] pb-1 border-b border-[#DCE7EF]">
                <span>
                  Showing {displayedProducts.length} of {savedProducts.length} item{savedProducts.length !== 1 ? 's' : ''}
                </span>

                {clearConfirm ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-red-600 font-semibold">Clear all?</span>
                    <button
                      onClick={() => {
                        clearSavedProducts();
                        setClearConfirm(false);
                      }}
                      className="text-[11px] bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded font-semibold transition-colors"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setClearConfirm(false)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 px-1 py-0.5"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setClearConfirm(true)}
                    className="text-red-600 hover:underline flex items-center gap-1 text-[11px] transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear List</span>
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {displayedProducts.map(product => {
                  const inQuote = isItemInQuote(product.id);
                  const quoteQty = getQuoteQuantity(product.id);
                  const publicPrice = getPublicPrice(product);
                  const showPrice = publicPrice !== null;

                  return (
                    <div
                      key={product.id}
                      className="bg-white border border-[#DCE7EF] hover:border-[#489DCA] rounded-lg p-3 sm:p-3.5 transition-all shadow-2xs group flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        {/* Thumbnail */}
                        <button
                          type="button"
                          onClick={() => handleOpenProduct(product.id)}
                          className="w-16 h-16 shrink-0 bg-[#F1F5F9] rounded-md border border-[#DCE7EF] overflow-hidden p-1 flex items-center justify-center hover:opacity-90 transition-opacity"
                          title="Click to view details"
                        >
                          {product.images && product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.model}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-contain mix-blend-multiply"
                            />
                          ) : (
                            <span className="text-[9px] text-slate-400 font-mono">No image</span>
                          )}
                        </button>

                        {/* Title & Brand */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <span className="text-[10px] font-bold text-[#275B86] uppercase tracking-wider block">
                                {product.brand}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenProduct(product.id)}
                                className="text-xs font-bold text-[#10283D] hover:text-[#275B86] transition-colors text-left line-clamp-1 block"
                              >
                                {product.model}
                              </button>
                            </div>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => removeSavedProduct(product.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors shrink-0"
                              title="Remove from saved list"
                              aria-label={`Remove ${product.model} from saved items`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] font-mono text-[#62798C] bg-[#F7FAFD] px-1 py-0.2 rounded border border-[#DCE7EF]">
                              {product.sku}
                            </span>

                            {/* Rating badge */}
                            {(() => {
                              const ratingSum = getProductRatingSummary(product.id);
                              if (ratingSum.average === null) return null;
                              return (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#10283D] bg-amber-50/70 border border-amber-200/60 px-1.5 py-0.2 rounded">
                                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                  {ratingSum.average.toFixed(1)}
                                  <span className="text-slate-400 font-normal">({ratingSum.count})</span>
                                </span>
                              );
                            })()}

                            {/* Stock Indicator */}
                            {product.stock === null ? (
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                Stock unconfirmed
                              </span>
                            ) : product.stock === 0 ? (
                              <span className="text-[10px] text-red-700 bg-red-50 px-1.5 py-0.2 rounded border border-red-200 font-medium">
                                Out of stock
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-medium">
                                In stock
                              </span>
                            )}
                          </div>

                          {/* Price */}
                          <div className="mt-1.5">
                            {showPrice ? (
                              <span className="text-xs font-bold text-[#10283D] font-mono">
                                {formatLKR(publicPrice)}
                              </span>
                            ) : (
                              <span className="text-[11px] text-[#275B86] font-medium">
                                Price on Request (RFQ)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Item Bottom Actions */}
                      <div className="pt-2 border-t border-[#DCE7EF] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenProduct(product.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#62798C] hover:text-[#183B57] transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Specs</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          {inQuote ? (
                            <button
                              type="button"
                              onClick={() => addToQuote(product, 1)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 rounded transition-colors"
                              title="Click to add one more to quotation"
                            >
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>In Quote ({quoteQty}) +1</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => moveSavedToQuote(product.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-white bg-[#275B86] hover:bg-[#10283D] rounded transition-colors shadow-2xs"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Move to Quote</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer Actions */}
        {savedProducts.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-[#DCE7EF] bg-[#F7FAFD] space-y-3">
            <button
              type="button"
              onClick={handleTransferAllToQuote}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#275B86] hover:bg-[#10283D] text-white rounded-md text-xs sm:text-sm font-semibold transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Move All to Quotation Request ({savedProducts.length})</span>
            </button>

            <div className="flex items-center justify-between text-[11px] text-[#62798C]">
              <span>Saved locally in your browser</span>
              <button
                type="button"
                onClick={() => {
                  setIsSavedDrawerOpen(false);
                  setIsQuoteDrawerOpen(true);
                }}
                className="text-[#275B86] font-semibold hover:underline flex items-center gap-1"
              >
                <span>View Quotation ({quoteItems.reduce((a, b) => a + b.quantity, 0)})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
