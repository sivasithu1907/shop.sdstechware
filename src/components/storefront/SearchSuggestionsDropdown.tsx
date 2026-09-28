import React from 'react';
import { useStore } from '../../store/StoreContext';
import type { SearchSuggestions } from '../../features/catalog/search';
import { getPublicPrice } from '../../features/catalog/pricing';
import { Tag, Layers, ArrowRight, ImageOff } from 'lucide-react';

interface SearchSuggestionsDropdownProps {
  suggestions: SearchSuggestions;
  searchQuery: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectBrand: (brand: string) => void;
  onSelectCategory: (category: string) => void;
  onSelectProduct: (productId: string) => void;
  onSubmitSearch: () => void;
  selectedIndex: number;
}

export const SearchSuggestionsDropdown: React.FC<SearchSuggestionsDropdownProps> = ({
  suggestions,
  searchQuery,
  isOpen,
  onClose,
  onSelectBrand,
  onSelectCategory,
  onSelectProduct,
  onSubmitSearch,
  selectedIndex,
}) => {
  const { formatLKR } = useStore();

  if (!isOpen || !searchQuery.trim()) return null;

  const hasAnySuggestions =
    suggestions.matchingBrands.length > 0 ||
    suggestions.matchingCategories.length > 0 ||
    suggestions.matchingProducts.length > 0;

  return (
    <div
      className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-[#DCE7EF] py-2 z-50 text-[#183B57] max-h-[480px] overflow-y-auto animate-fadeIn"
      id="search-suggestions"
      role="listbox"
      aria-label="Search suggestions"
    >
      {!hasAnySuggestions ? (
        <div className="py-4 px-4 text-center text-xs text-[#62798C]">
          <p className="font-semibold text-[#183B57]">No immediate suggestions</p>
          <p className="text-[11px] mt-0.5">Press Enter to run catalog search for "{searchQuery}"</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Matching Brands */}
          {suggestions.matchingBrands.length > 0 && (
            <div className="px-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#62798C] uppercase tracking-wider mb-1.5">
                <Tag className="w-3 h-3 text-[#275B86]" />
                <span>Filter by Brand</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.matchingBrands.map(b => (
                  <button
                    key={b.brand}
                    type="button"
                    onClick={() => onSelectBrand(b.brand)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#EBF3F8] hover:bg-[#d8e8f3] text-[#275B86] text-xs font-medium transition-colors cursor-pointer"
                  >
                    <span>{b.brand}</span>
                    <span className="text-[10px] text-[#62798C] font-mono">({b.count})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matching Categories */}
          {suggestions.matchingCategories.length > 0 && (
            <div className="px-3 pt-1 border-t border-[#F1F5F9]">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#62798C] uppercase tracking-wider mb-1.5">
                <Layers className="w-3 h-3 text-[#275B86]" />
                <span>Filter by Category</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.matchingCategories.map(c => (
                  <button
                    key={c.category}
                    type="button"
                    onClick={() => onSelectCategory(c.category)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[#183B57] text-xs font-medium transition-colors cursor-pointer"
                  >
                    <span>{c.category}</span>
                    <span className="text-[10px] text-[#62798C] font-mono">({c.count})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matching Top Products */}
          {suggestions.matchingProducts.length > 0 && (
            <div className="pt-1 border-t border-[#F1F5F9]">
              <div className="px-3 mb-1.5 flex items-center justify-between text-[11px] font-bold text-[#62798C] uppercase tracking-wider">
                <span>Matching Products</span>
                <span className="font-normal lowercase font-mono">
                  {suggestions.totalMatches} match{suggestions.totalMatches === 1 ? '' : 'es'}
                </span>
              </div>

              <div className="divide-y divide-[#F1F5F9]">
                {suggestions.matchingProducts.map((p, idx) => {
                  const isSelected = selectedIndex === idx;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => onSelectProduct(p.id)}
                      className={`w-full px-3 py-2 flex items-center gap-3 text-left transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#EBF3F8]' : 'hover:bg-[#F7FAFD]'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="w-10 h-10 rounded bg-slate-100 shrink-0 overflow-hidden flex items-center justify-center border border-[#DCE7EF]">
                        {p.images && p.images[0] ? (
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            onError={e => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <ImageOff className="w-4 h-4 text-slate-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px] text-[#62798C]">
                          <span className="font-semibold text-[#275B86]">{p.brand}</span>
                          <span>·</span>
                          <span className="truncate">{p.category}</span>
                        </div>
                        <p className="text-xs font-semibold text-[#10283D] truncate">{p.model}</p>
                        <p className="text-[11px] text-[#62798C] truncate">{p.name}</p>
                      </div>

                      {/* Price / Quote Status */}
                      <div className="text-right shrink-0">
                        {getPublicPrice(p) !== null ? (
                          <span className="text-xs font-bold text-[#10283D] font-mono">
                            {formatLKR(getPublicPrice(p))}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-[#275B86] bg-[#EBF3F8] px-1.5 py-0.5 rounded">
                            Price on Request
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Enter prompt */}
          <div className="px-3 pt-2 border-t border-[#DCE7EF] bg-[#F7FAFD] -mb-2 py-2 rounded-b-lg flex items-center justify-between text-[11px] text-[#62798C]">
            <span className="flex items-center gap-1">
              <span>Press</span>
              <kbd className="px-1.5 py-0.5 bg-white border border-[#CBD5E1] rounded text-[10px] font-mono font-bold text-[#183B57] shadow-2xs">
                Enter ↵
              </kbd>
              <span>to see all {suggestions.totalMatches} results in grid</span>
            </span>

            <button
              type="button"
              onClick={onSubmitSearch}
              className="text-[#275B86] hover:underline font-semibold flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
