import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/StoreContext';
import { getPublicPrice } from '../../features/catalog/pricing';
import { LIMITS } from '../../config/settings';
import { useDialog } from '../../hooks/useDialog';
import { Product } from '../../types';
import {
  X,
  Scale,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Layers,
  Star,
} from 'lucide-react';

export const ProductCompareModal: React.FC = () => {
  const {
    compareProductIds,
    removeFromCompare,
    clearCompare,
    isCompareModalOpen,
    setIsCompareModalOpen,
    publishedProducts,
    formatLKR,
    addToQuote,
    quoteItems,
    setSelectedProductId,
    getProductRatingSummary,
  } = useStore();

  const [highlightDifferences, setHighlightDifferences] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const compareProducts: Product[] = useMemo(() => {
    return compareProductIds
      .map(id => publishedProducts.find(p => p.id === id))
      .filter((p): p is Product => Boolean(p));
  }, [compareProductIds, publishedProducts]);

  // Collect all unique specification keys across all compared products
  const allSpecKeys = useMemo(() => {
    const keySet = new Set<string>();
    compareProducts.forEach(p => {
      p.specifications?.forEach(s => {
        if (s.key.trim()) keySet.add(s.key.trim());
      });
    });
    return Array.from(keySet);
  }, [compareProducts]);

  const dialogRef = useDialog<HTMLDivElement>(isCompareModalOpen, () => setIsCompareModalOpen(false));

  if (!isCompareModalOpen) return null;

  const handleAddQuote = (product: Product) => {
    addToQuote(product, 1);
    setAddedIds(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds(prev => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-[#10283D]/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn"
      onClick={() => setIsCompareModalOpen(false)}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-title"
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        className="relative bg-white rounded-xl shadow-2xl border border-[#DCE7EF] w-full max-w-5xl max-h-[92vh] flex flex-col text-[#183B57] overflow-hidden focus:outline-none"
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#DCE7EF] bg-[#F7FAFD] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#275B86] text-white flex items-center justify-center shadow-xs">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="compare-title" className="text-sm sm:text-base font-bold text-[#10283D]">
                  Product Comparison Matrix
                </h2>
                <span className="text-[10px] bg-[#EBF3F8] text-[#275B86] font-mono px-2 py-0.5 rounded-full font-bold">
                  {compareProducts.length} of {LIMITS.compareMax} items
                </span>
              </div>
              <p className="text-[11px] text-[#62798C] mt-0.5 hidden sm:block">
                Side-by-side technical evaluation and quotation status for enterprise procurement
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {compareProducts.length > 1 && (
              <label className="hidden sm:flex items-center gap-1.5 text-xs text-[#62798C] cursor-pointer">
                <input
                  type="checkbox"
                  checked={highlightDifferences}
                  onChange={e => setHighlightDifferences(e.target.checked)}
                  className="rounded text-[#275B86] focus:ring-0"
                />
                <span>Highlight differences</span>
              </label>
            )}

            {compareProducts.length > 0 && (
              <button
                onClick={clearCompare}
                className="text-xs text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1"
                title="Clear comparison list"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )}

            <button
              onClick={() => setIsCompareModalOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-[#183B57] hover:bg-slate-200/60 transition-colors"
              aria-label="Close comparison modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {compareProducts.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#10283D]">No products selected for comparison</h3>
              <p className="text-xs text-[#62798C] max-w-sm mx-auto">
                Enable &ldquo;Compare Products&rdquo; in the catalog header or click the compare checkbox on any product card to begin side-by-side evaluation.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setIsCompareModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#275B86] hover:bg-[#10283D] rounded-md transition-colors"
                >
                  Return to Catalog
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Product Columns (Side by Side) */}
              <div className="overflow-x-auto pb-2 scrollbar-thin">
                <div
                  className="grid gap-4 min-w-[640px]"
                  style={{
                    gridTemplateColumns: `repeat(${Math.max(compareProducts.length, 2)}, minmax(200px, 1fr))`,
                  }}
                >
                  {compareProducts.map(product => {
                    const isInQuote = quoteItems.some(i => i.productId === product.id);
                    const isAddedJustNow = Boolean(addedIds[product.id]);
                    const publicPrice = getPublicPrice(product);
                    const showPrice = publicPrice !== null;

                    return (
                      <div
                        key={product.id}
                        className="bg-[#F7FAFD] rounded-lg border border-[#DCE7EF] p-4 flex flex-col justify-between space-y-4 relative group"
                      >
                        {/* Remove item button */}
                        <button
                          onClick={() => removeFromCompare(product.id)}
                          className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-600 bg-white/80 rounded transition-colors"
                          title="Remove from comparison"
                          aria-label={`Remove ${product.model} from comparison`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        <div className="space-y-3">
                          {/* Image */}
                          <div
                            onClick={() => {
                              setSelectedProductId(product.id);
                              setIsCompareModalOpen(false);
                            }}
                            className="aspect-[4/3] bg-white rounded border border-[#DCE7EF] overflow-hidden flex items-center justify-center p-2 cursor-pointer hover:border-[#275B86] transition-colors"
                            title="Click to view full product details"
                          >
                            {product.images && product.images[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.model}
                                className="w-full h-full object-contain mix-blend-multiply"
                              />
                            ) : (
                              <span className="text-[10px] text-slate-400">Image pending</span>
                            )}
                          </div>

                          {/* Brand & Model */}
                          <div>
                            <span className="text-[10px] font-semibold text-[#62798C] uppercase tracking-wider block">
                              {product.brand}
                            </span>
                            <h3
                              onClick={() => {
                                setSelectedProductId(product.id);
                                setIsCompareModalOpen(false);
                              }}
                              className="text-xs sm:text-sm font-bold text-[#10283D] hover:text-[#275B86] cursor-pointer transition-colors leading-snug line-clamp-2"
                            >
                              {product.model}
                            </h3>
                            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                              {product.sku}
                            </span>
                            {(() => {
                              const ratingSum = getProductRatingSummary(product.id);
                              if (ratingSum.average === null) {
                                return (
                                  <span className="text-[10px] text-slate-400 block mt-1">No reviews yet</span>
                                );
                              }
                              return (
                                <div
                                  onClick={() => {
                                    setSelectedProductId(product.id);
                                    setIsCompareModalOpen(false);
                                  }}
                                  className="flex items-center gap-1.5 mt-1 cursor-pointer hover:opacity-80 transition-opacity"
                                  title="View customer reviews"
                                >
                                  <div className="flex items-center gap-0.5">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                    <span className="text-[11px] font-bold text-[#10283D]">
                                      {ratingSum.average.toFixed(1)}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-[#62798C]">
                                    ({ratingSum.count} {ratingSum.count === 1 ? 'review' : 'reviews'}{ratingSum.demoCount > 0 ? `, ${ratingSum.demoCount} demo` : ''})
                                  </span>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Price & Stock */}
                          <div className="pt-2 border-t border-[#DCE7EF] space-y-1.5">
                            <div>
                              <span className="text-[10px] text-[#62798C] block">Pricing Status</span>
                              {showPrice ? (
                                <span className="text-xs sm:text-sm font-bold font-mono text-[#10283D]">
                                  {formatLKR(publicPrice)}
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-[#275B86]">
                                  Price on Request
                                </span>
                              )}
                            </div>

                            <div>
                              <span className="text-[10px] text-[#62798C] block">Availability</span>
                              {product.stock === null ? (
                                <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  Unconfirmed
                                </span>
                              ) : product.stock === 0 ? (
                                <span className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                  Out of stock
                                </span>
                              ) : (
                                <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  In stock
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Add to Quotation Action */}
                        <div className="pt-3 border-t border-[#DCE7EF]">
                          <button
                            onClick={() => handleAddQuote(product)}
                            className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded text-xs font-semibold transition-all ${
                              isAddedJustNow
                                ? 'bg-emerald-600 text-white'
                                : isInQuote
                                ? 'bg-[#EBF3F8] text-[#275B86] hover:bg-[#275B86] hover:text-white'
                                : 'bg-[#275B86] hover:bg-[#10283D] text-white shadow-xs'
                            }`}
                          >
                            {isAddedJustNow ? (
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
                                <span>Add to Quote</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Technical Specification Comparison Table */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#275B86]" />
                  <h4 className="text-xs font-bold text-[#10283D] uppercase tracking-wider">
                    Specification Matrix
                  </h4>
                </div>

                <div className="border border-[#DCE7EF] rounded-lg overflow-x-auto bg-white shadow-xs">
                  <table className="w-full text-left text-xs min-w-[640px]">
                    <thead className="bg-[#F7FAFD] text-[#62798C] border-b border-[#DCE7EF] text-[11px] font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-4 w-44">Attribute</th>
                        {compareProducts.map(p => (
                          <th key={p.id} className="py-2.5 px-4 font-bold text-[#10283D]">
                            {p.model}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE7EF]">
                      {/* Category row */}
                      <tr className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-medium text-[#62798C] bg-[#F7FAFD]/60">
                          Category
                        </td>
                        {compareProducts.map(p => (
                          <td key={p.id} className="py-2.5 px-4 font-semibold text-[#183B57]">
                            {p.category}
                          </td>
                        ))}
                      </tr>

                      {/* Brand row */}
                      <tr className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-medium text-[#62798C] bg-[#F7FAFD]/60">
                          Brand / Manufacturer
                        </td>
                        {compareProducts.map(p => (
                          <td key={p.id} className="py-2.5 px-4 text-[#183B57]">
                            {p.brand}
                          </td>
                        ))}
                      </tr>

                      {/* Customer Rating row */}
                      <tr className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-medium text-[#62798C] bg-[#F7FAFD]/60">
                          Rating & Reviews
                        </td>
                        {compareProducts.map(p => {
                          const ratingSum = getProductRatingSummary(p.id);
                          return (
                            <td key={p.id} className="py-2.5 px-4 text-[#183B57]">
                              {ratingSum.average !== null ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="flex items-center text-amber-500">
                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                    <span className="ml-1 font-bold text-xs text-[#10283D]">
                                      {ratingSum.average.toFixed(1)}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-[#62798C]">
                                    ({ratingSum.count} {ratingSum.count === 1 ? 'review' : 'reviews'}{ratingSum.demoCount > 0 ? `, ${ratingSum.demoCount} demo` : ''})
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">No reviews yet</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Overview / Short Description */}
                      <tr className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-medium text-[#62798C] bg-[#F7FAFD]/60">
                          Summary
                        </td>
                        {compareProducts.map(p => (
                          <td key={p.id} className="py-2.5 px-4 text-[#62798C] text-[11px] leading-relaxed">
                            {p.shortDescription || 'Genuine enterprise & commercial IT solution.'}
                          </td>
                        ))}
                      </tr>

                      {/* Dynamic Specs */}
                      {allSpecKeys.map(specKey => {
                        const values = compareProducts.map(p => {
                          const match = p.specifications?.find(
                            s => s.key.toLowerCase().trim() === specKey.toLowerCase().trim()
                          );
                          return match?.value || '—';
                        });

                        const isDifferent =
                          values.some(v => v !== values[0]) && compareProducts.length > 1;

                        const rowClass =
                          highlightDifferences && isDifferent
                            ? 'bg-amber-50/70 text-[#10283D]'
                            : 'hover:bg-slate-50';

                        return (
                          <tr key={specKey} className={rowClass}>
                            <td className="py-2.5 px-4 font-medium text-[#62798C] bg-[#F7FAFD]/60 flex items-center gap-1.5">
                              <span>{specKey}</span>
                              {highlightDifferences && isDifferent && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Values differ" />
                              )}
                            </td>
                            {values.map((val, idx) => (
                              <td key={idx} className="py-2.5 px-4 text-[#183B57]">
                                {val}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Informational Callout */}
              <div className="p-3 bg-[#EBF3F8] border border-[#DCE7EF] rounded-md text-xs text-[#275B86] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#275B86]" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-[#10283D]">Commercial Procurement Note:</span>
                  <p className="text-[11px] text-[#275B86] leading-relaxed">
                    Pricing, availability, warranty and delivery are confirmed by SDS Techware in a formal quotation. Specifications shown are catalogue data and should be verified for your use case.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#DCE7EF] bg-[#F7FAFD] flex items-center justify-between text-xs text-[#62798C]">
          <span>SDS Techware (Pvt) Ltd. · Technical Product Comparison</span>
          <button
            onClick={() => setIsCompareModalOpen(false)}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-[#275B86] hover:bg-[#10283D] rounded transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
