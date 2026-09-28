import React from 'react';
import { useStore } from '../../store/StoreContext';
import { ChevronRight, Home, X, RotateCcw, Tag, Search as SearchIcon } from 'lucide-react';
import { filterAndSortCatalog } from '../../features/catalog/catalogFilters';

export const Breadcrumbs: React.FC = () => {
  const {
    selectedCategory,
    setSelectedCategory,
    selectedBrand,
    setSelectedBrand,
    selectedBrands,
    searchQuery,
    setSearchQuery,
    resetFilters,
    publishedProducts,
    selectedProductId,
    setSelectedProductId,
    getStorefrontProduct,
    inStockOnly,
    budgetFilter,
  } = useStore();

  const selectedProduct = getStorefrontProduct(selectedProductId) ?? null;

  // Same filter rules as the catalogue grid, so the counts always agree.
  const currentFilteredCount = filterAndSortCatalog(publishedProducts, {
    category: selectedCategory,
    brands: selectedBrands,
    inStockOnly,
    search: searchQuery,
    budget: budgetFilter,
    sort: 'featured',
  }).length;

  const hasActiveFilters = selectedCategory !== 'all' || selectedBrand !== 'all' || searchQuery.trim() !== '' || selectedProduct !== null;

  const handleGoHome = (e: React.MouseEvent) => {
    e.preventDefault();
    resetFilters();
    setSelectedProductId(null);
  };

  const handleGoToCatalog = (e: React.MouseEvent) => {
    e.preventDefault();
    resetFilters();
    setSelectedProductId(null);
  };

  const handleClearCategory = (e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedCategory('all');
    setSelectedProductId(null);
  };

  const handleClearBrand = (e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedBrand('all');
  };

  const handleClearSearch = (e: React.MouseEvent) => {
    e.preventDefault();
    setSearchQuery('');
  };

  const handleClearProduct = (e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedProductId(null);
  };

  return (
    <div className="bg-white border-b border-[#DCE7EF] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Semantic Breadcrumbs Navigation */}
        <nav aria-label="Breadcrumb" className="overflow-x-auto scrollbar-none py-0.5">
          <ol className="flex items-center gap-1.5 whitespace-nowrap text-[#62798C]">
            {/* Crumb 1: Home */}
            <li className="flex items-center gap-1.5">
              <button
                onClick={handleGoHome}
                className="flex items-center gap-1 text-[#62798C] hover:text-[#275B86] transition-colors font-medium"
                title="Return to SDS Techware Storefront"
              >
                <Home className="w-3.5 h-3.5 text-[#275B86]" />
                <span>Home</span>
              </button>
            </li>

            {/* Separator */}
            <li aria-hidden="true" className="text-[#DCE7EF]">
              <ChevronRight className="w-3.5 h-3.5" />
            </li>

            {/* Crumb 2: Catalog / All Products */}
            <li className="flex items-center gap-1.5">
              {selectedCategory === 'all' && selectedBrand === 'all' && !searchQuery.trim() && !selectedProduct ? (
                <span
                  aria-current="page"
                  className="font-semibold text-[#10283D] flex items-center gap-1.5"
                >
                  <span>All Products</span>
                  <span className="text-[10px] bg-[#EBF3F8] text-[#275B86] px-1.5 py-0.2 rounded-full font-mono font-medium">
                    {publishedProducts.length}
                  </span>
                </span>
              ) : (
                <button
                  onClick={handleGoToCatalog}
                  className="text-[#62798C] hover:text-[#275B86] transition-colors"
                >
                  Catalog
                </button>
              )}
            </li>

            {/* Crumb 3: Selected Category (if applicable) */}
            {selectedCategory !== 'all' && (
              <>
                <li aria-hidden="true" className="text-[#DCE7EF]">
                  <ChevronRight className="w-3.5 h-3.5" />
                </li>
                <li className="flex items-center gap-1">
                  {selectedBrand === 'all' && !searchQuery.trim() && !selectedProduct ? (
                    <span
                      aria-current="page"
                      className="font-semibold text-[#10283D] flex items-center gap-1.5"
                    >
                      <span>{selectedCategory}</span>
                      <span className="text-[10px] bg-[#EBF3F8] text-[#275B86] px-1.5 py-0.2 rounded-full font-mono font-medium">
                        {currentFilteredCount}
                      </span>
                    </span>
                  ) : (
                    <button
                      onClick={handleClearCategory}
                      className="text-[#62798C] hover:text-[#275B86] transition-colors font-medium"
                      title="Clear category filter"
                    >
                      {selectedCategory}
                    </button>
                  )}
                </li>
              </>
            )}

            {/* Crumb 4: Brand Filter (if applicable) */}
            {selectedBrand !== 'all' && (
              <>
                <li aria-hidden="true" className="text-[#DCE7EF]">
                  <ChevronRight className="w-3.5 h-3.5" />
                </li>
                <li className="flex items-center">
                  <span className="inline-flex items-center gap-1 bg-[#F1F5F9] border border-[#DCE7EF] px-2 py-0.5 rounded text-[#183B57] font-medium">
                    <Tag className="w-3 h-3 text-[#275B86]" />
                    <span>Brand: {selectedBrand}</span>
                    <button
                      onClick={handleClearBrand}
                      className="ml-1 text-slate-400 hover:text-red-600 transition-colors"
                      title="Clear brand filter"
                      aria-label="Remove brand filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                </li>
              </>
            )}

            {/* Crumb 5: Search Query (if applicable) */}
            {searchQuery.trim() !== '' && (
              <>
                <li aria-hidden="true" className="text-[#DCE7EF]">
                  <ChevronRight className="w-3.5 h-3.5" />
                </li>
                <li className="flex items-center">
                  <span className="inline-flex items-center gap-1 bg-[#F1F5F9] border border-[#DCE7EF] px-2 py-0.5 rounded text-[#183B57] font-medium">
                    <SearchIcon className="w-3 h-3 text-[#275B86]" />
                    <span>Search: &ldquo;{searchQuery.trim()}&rdquo;</span>
                    <button
                      onClick={handleClearSearch}
                      className="ml-1 text-slate-400 hover:text-red-600 transition-colors"
                      title="Clear search query"
                      aria-label="Clear search query"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                </li>
              </>
            )}

            {/* Crumb 6: Active Product (if product detail modal or selection is active) */}
            {selectedProduct && (
              <>
                <li aria-hidden="true" className="text-[#DCE7EF]">
                  <ChevronRight className="w-3.5 h-3.5" />
                </li>
                <li className="flex items-center">
                  <span
                    aria-current="page"
                    className="font-semibold text-[#10283D] truncate max-w-[200px] sm:max-w-xs flex items-center gap-1"
                  >
                    <span>{selectedProduct.model}</span>
                    <button
                      onClick={handleClearProduct}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                      title="Close product view"
                      aria-label="Close product view"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                </li>
              </>
            )}
          </ol>
        </nav>

        {/* Right side: Quick reset button when any filter is active */}
        {hasActiveFilters && (
          <div className="shrink-0 flex items-center gap-3">
            <span className="hidden md:inline text-[11px] text-[#62798C]">
              {currentFilteredCount} {currentFilteredCount === 1 ? 'item' : 'items'} found
            </span>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-[11px] text-[#275B86] hover:text-[#10283D] font-medium transition-colors"
              title="Reset all search queries and active filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset filters</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
