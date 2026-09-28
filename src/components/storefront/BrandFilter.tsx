import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/StoreContext';
import { Search, X, Check, Tag } from 'lucide-react';

interface BrandFilterProps {
  compact?: boolean;
}

export const BrandFilter: React.FC<BrandFilterProps> = ({ compact = false }) => {
  const {
    brands,
    publishedProducts,
    selectedCategory,
    selectedBrand,
    setSelectedBrand,
    selectedBrands,
    toggleBrandFilter,
  } = useStore();

  const [brandSearch, setBrandSearch] = useState('');

  // Calculate product counts for each brand under the current category
  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const relevantProducts = publishedProducts.filter(p => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }
      return true;
    });

    relevantProducts.forEach(p => {
      counts[p.brand] = (counts[p.brand] || 0) + 1;
    });

    return counts;
  }, [publishedProducts, selectedCategory]);

  // Filter brands based on search input
  const filteredBrands = useMemo(() => {
    return brands
      .filter(b => b.name.toLowerCase().includes(brandSearch.trim().toLowerCase()))
      .sort((a, b) => {
        // Sort brands with active products first, then alphabetical
        const countA = brandCounts[a.name] || 0;
        const countB = brandCounts[b.name] || 0;
        if (countA > 0 && countB === 0) return -1;
        if (countA === 0 && countB > 0) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [brands, brandSearch, brandCounts]);

  const totalMatchingBrandsWithProducts = useMemo(() => {
    return Object.values(brandCounts).filter(c => c > 0).length;
  }, [brandCounts]);

  const isBrandActive = (brandName: string) => {
    if (selectedBrands.length > 0) {
      return selectedBrands.includes(brandName);
    }
    return selectedBrand === brandName;
  };

  const handleSelectAll = () => {
    setSelectedBrand('all');
  };

  const hasActiveBrandFilter = selectedBrand !== 'all' || selectedBrands.length > 0;

  return (
    <div className={`space-y-3 ${compact ? 'text-xs' : ''}`}>
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#DCE7EF]">
        <div className="flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-[#275B86]" />
          <h3 className="text-xs font-bold text-[#10283D] uppercase tracking-wider">
            Brands
          </h3>
          {hasActiveBrandFilter && (
            <span className="text-[10px] bg-[#275B86] text-white px-1.5 py-0.2 rounded-full font-semibold">
              {selectedBrands.length > 0 ? selectedBrands.length : 1}
            </span>
          )}
        </div>

        {hasActiveBrandFilter && (
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-[11px] text-[#275B86] hover:text-[#10283D] hover:underline cursor-pointer font-medium"
          >
            Reset
          </button>
        )}
      </div>

      {/* Brand Search Input */}
      {brands.length > 5 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#62798C]" />
          <input
            type="text"
            value={brandSearch}
            onChange={e => setBrandSearch(e.target.value)}
            placeholder="Search brands..."
            className="w-full pl-8 pr-7 py-1 text-xs bg-[#F7FAFD] border border-[#DCE7EF] rounded text-[#183B57] placeholder:text-[#62798C]/60 focus:outline-none focus:border-[#275B86] focus:bg-white transition-colors"
          />
          {brandSearch && (
            <button
              type="button"
              onClick={() => setBrandSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#62798C] hover:text-[#183B57]"
              title="Clear brand search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Brand Selection List */}
      <div className="space-y-1 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
        {/* All Brands Option */}
        <button
          type="button"
          onClick={handleSelectAll}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-colors text-left text-xs ${
            !hasActiveBrandFilter
              ? 'bg-[#EBF3F8] text-[#275B86] font-semibold'
              : 'text-[#183B57] hover:bg-[#F7FAFD]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                !hasActiveBrandFilter
                  ? 'bg-[#275B86] border-[#275B86] text-white'
                  : 'border-[#CBD5E1] bg-white'
              }`}
            >
              {!hasActiveBrandFilter && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </span>
            <span>All Brands</span>
          </div>
          <span className="text-[11px] text-[#62798C] font-mono">
            {totalMatchingBrandsWithProducts}
          </span>
        </button>

        {/* Individual Brands */}
        {filteredBrands.length > 0 ? (
          filteredBrands.map(brand => {
            const count = brandCounts[brand.name] || 0;
            const active = isBrandActive(brand.name);
            const isDisabled = count === 0;

            return (
              <button
                key={brand.id}
                type="button"
                onClick={() => toggleBrandFilter(brand.name)}
                disabled={isDisabled}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-colors text-left text-xs group ${
                  active
                    ? 'bg-[#EBF3F8] text-[#275B86] font-semibold'
                    : isDisabled
                    ? 'text-slate-400 opacity-60 cursor-not-allowed'
                    : 'text-[#183B57] hover:bg-[#F7FAFD] cursor-pointer'
                }`}
                title={isDisabled ? `No products for ${brand.name} in current category` : `Filter by ${brand.name}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      active
                        ? 'bg-[#275B86] border-[#275B86] text-white'
                        : isDisabled
                        ? 'border-slate-200 bg-slate-50'
                        : 'border-[#CBD5E1] bg-white group-hover:border-[#275B86]'
                    }`}
                  >
                    {active && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </span>
                  <span className="truncate">{brand.name}</span>
                </div>
                <span
                  className={`text-[11px] font-mono ml-2 shrink-0 ${
                    active
                      ? 'text-[#275B86] font-bold'
                      : isDisabled
                      ? 'text-slate-300'
                      : 'text-[#62798C]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })
        ) : (
          <div className="py-3 text-center text-xs text-[#62798C]">
            No brands match "{brandSearch}"
          </div>
        )}
      </div>
    </div>
  );
};
