import React from 'react';
import { useStore } from '../../store/StoreContext';
import { useDialog } from '../../hooks/useDialog';
import { BrandFilter } from './BrandFilter';
import { PriceRangeCalculator } from './PriceRangeCalculator';
import { X, SlidersHorizontal, RotateCcw, Package } from 'lucide-react';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filteredCount: number;
}

export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  isOpen,
  onClose,
  filteredCount,
}) => {
  const {
    categories,
    publishedProducts,
    selectedCategory,
    setSelectedCategory,
    selectedBrand,
    selectedBrands,
    inStockOnly,
    setInStockOnly,
    resetFilters,
    isBudgetFilterActive,
  } = useStore();
  const dialogRef = useDialog<HTMLDivElement>(isOpen, onClose);

  if (!isOpen) return null;

  // Category product counts
  const categoryCounts: Record<string, number> = { all: publishedProducts.length };
  publishedProducts.forEach(p => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedBrand !== 'all' ||
    selectedBrands.length > 0 ||
    inStockOnly ||
    isBudgetFilterActive;

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filter and refine products"
        tabIndex={-1}
        className="relative ml-auto w-full max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-slideInRight focus:outline-none"
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-[#DCE7EF] flex items-center justify-between bg-[#F7FAFD]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#275B86]" />
            <h2 className="font-bold text-[#10283D] text-sm">Filter &amp; Refine</h2>
            {hasActiveFilters && (
              <span className="text-[10px] bg-[#275B86] text-white px-2 py-0.5 rounded-full font-semibold">
                Active
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[#62798C] hover:text-[#10283D] hover:bg-slate-200 transition-colors"
            title="Close filters"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Availability Toggle */}
          <div className="bg-[#F7FAFD] border border-[#DCE7EF] rounded-lg p-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#275B86]" />
                <span className="text-xs font-semibold text-[#183B57]">In-Stock Only</span>
              </div>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={e => setInStockOnly(e.target.value === 'true' ? false : !inStockOnly)}
                className="w-4 h-4 rounded text-[#275B86] border-[#CBD5E1] focus:ring-[#275B86] cursor-pointer"
              />
            </label>
            <p className="text-[10px] text-[#62798C] mt-1 pl-6">
              Hide out-of-stock and unconfirmed inventory items
            </p>
          </div>

          {/* Category Filter */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-[#DCE7EF]">
              <h3 className="text-xs font-bold text-[#10283D] uppercase tracking-wider">
                Categories
              </h3>
              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="text-[11px] text-[#275B86] hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs text-left transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-[#EBF3F8] text-[#275B86] font-semibold'
                    : 'text-[#183B57] hover:bg-[#F7FAFD]'
                }`}
              >
                <span>All Categories</span>
                <span className="text-[11px] text-[#62798C] font-mono">
                  {publishedProducts.length}
                </span>
              </button>

              {categories.map(cat => {
                const count = categoryCounts[cat.name] || 0;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs text-left transition-colors ${
                      selectedCategory === cat.name
                        ? 'bg-[#EBF3F8] text-[#275B86] font-semibold'
                        : 'text-[#183B57] hover:bg-[#F7FAFD]'
                    }`}
                  >
                    <span className="truncate pr-1">{cat.name}</span>
                    <span className="text-[11px] text-[#62798C] font-mono">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brand Filter */}
          <div className="pt-2 border-t border-[#DCE7EF]">
            <BrandFilter />
          </div>

          {/* Price Range & Budget Slider */}
          <div className="pt-2 border-t border-[#DCE7EF]">
            <PriceRangeCalculator onFilterApplied={() => {}} />
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-[#DCE7EF] bg-[#F7FAFD] flex items-center gap-3">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-md transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-[#275B86] hover:bg-[#10283D] text-white text-xs font-bold rounded-md shadow-xs transition-colors text-center"
          >
            Show {filteredCount} Products
          </button>
        </div>
      </div>
    </div>
  );
};
