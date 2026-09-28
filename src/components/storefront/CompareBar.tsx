import React from 'react';
import { useStore } from '../../store/StoreContext';
import { Scale, X, ArrowRight, Trash2 } from 'lucide-react';

export const CompareBar: React.FC = () => {
  const {
    compareProductIds,
    removeFromCompare,
    clearCompare,
    setIsCompareModalOpen,
    publishedProducts,
  } = useStore();

  if (compareProductIds.length === 0) return null;

  const selectedProducts = compareProductIds
    .map(id => publishedProducts.find(p => p.id === id))
    .filter(Boolean);

  return (
    <aside
      aria-label="Product comparison tray"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl bg-[#10283D] text-white rounded-xl shadow-2xl border border-white/20 px-4 py-3 animate-slideUp"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Summary & Selected Product Chips */}
        <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-md bg-[#275B86] flex items-center justify-center text-white">
              <Scale className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold tracking-tight block">
                Compare Tray
              </span>
              <span className="text-[10px] text-slate-300 font-mono block -mt-0.5">
                {compareProductIds.length} of 4 selected
              </span>
            </div>
          </div>

          {/* Product Thumbnails */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            {selectedProducts.map(p => p && (
              <div
                key={p.id}
                className="group relative flex items-center gap-1.5 bg-white/10 hover:bg-white/15 border border-white/10 px-2 py-1 rounded text-[11px] shrink-0"
              >
                <div className="w-4 h-4 rounded bg-white overflow-hidden shrink-0 flex items-center justify-center">
                  {p.images && p.images[0] ? (
                    <img src={p.images[0]} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-[8px] text-slate-600">IT</span>
                  )}
                </div>
                <span className="truncate max-w-[90px] sm:max-w-[120px] font-medium text-slate-200">
                  {p.model}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromCompare(p.id);
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                  aria-label={`Remove ${p.model} from comparison`}
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={clearCompare}
            className="text-[11px] text-slate-300 hover:text-red-400 transition-colors px-2 py-1 flex items-center gap-1"
            title="Clear all selected products"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Clear</span>
          </button>

          <button
            onClick={() => setIsCompareModalOpen(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#489DCA] hover:bg-[#358bbb] text-white text-xs font-semibold shadow-xs transition-all"
          >
            <span>Compare Side-by-Side</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
