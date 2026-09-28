import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../../store/StoreContext';
import { ProductCard } from './ProductCard';
import { PriceRangeCalculator } from './PriceRangeCalculator';
import { BrandFilter } from './BrandFilter';
import { MobileFilterDrawer } from './MobileFilterDrawer';
import { SearchSuggestionsDropdown } from './SearchSuggestionsDropdown';
import { getSearchSuggestions } from '../../features/catalog/search';
import { countByCategory, filterAndSortCatalog, type CatalogSort } from '../../features/catalog/catalogFilters';
import {
  Search,
  SlidersHorizontal,
  X,
  AlertCircle,
  Clock,
  Scale,
  Server,
  ShieldCheck,
  Calculator,
  ChevronDown,
  ChevronUp,
  Tag,
  Package,
  Layers,
  RotateCcw,
} from 'lucide-react';

export const CatalogLayout: React.FC = () => {
  const {
    publishedProducts,
    categories,
    brands,
    selectedCategory,
    setSelectedCategory,
    selectedBrand,
    setSelectedBrand,
    selectedBrands,
    toggleBrandFilter,
    inStockOnly,
    setInStockOnly,
    searchQuery,
    setSearchQuery,
    resetFilters: storeResetFilters,
    budgetFilter,
    resetBudgetFilter,
    isBudgetFilterActive,
    formatLKR,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    compareProductIds,
    isCompareMode,
    setIsCompareMode,
    setIsCompareModalOpen,
    setIsConfiguratorOpen,
    setIsWarrantyModalOpen,
    setSelectedProductId,
  } = useStore();

  const [sortBy, setSortBy] = useState<CatalogSort>('featured');
  const [isMobileBudgetOpen, setIsMobileBudgetOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchSelectedIndex, setSearchSelectedIndex] = useState(-1);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-switch to relevance sorting when typing a search query if currently on featured
  useEffect(() => {
    if (searchQuery.trim().length > 0 && sortBy === 'featured') {
      setSortBy('relevance');
    } else if (searchQuery.trim().length === 0 && sortBy === 'relevance') {
      setSortBy('featured');
    }
  }, [searchQuery, sortBy]);

  // Global keyboard shortcut: Press '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        (activeElement as HTMLElement)?.isContentEditable;

      if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener to dismiss search suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate autocomplete suggestions based on current query
  const suggestions = useMemo(() => {
    return getSearchSuggestions(searchQuery, publishedProducts, categories, brands);
  }, [searchQuery, publishedProducts, categories, brands]);

  // Filtered and sorted products (shared rules in features/catalog/catalogFilters.ts).
  // publishedProducts is storefront-safe: hidden prices are already removed.
  const filteredProducts = useMemo(
    () =>
      filterAndSortCatalog(publishedProducts, {
        category: selectedCategory,
        brands: selectedBrands,
        inStockOnly,
        search: searchQuery,
        budget: budgetFilter,
        sort: sortBy,
      }),
    [publishedProducts, selectedCategory, selectedBrands, inStockOnly, searchQuery, sortBy, budgetFilter],
  );

  const categoryCounts = useMemo(() => countByCategory(publishedProducts), [publishedProducts]);

  // Active filter status flags
  const hasCategoryFilter = selectedCategory !== 'all';
  const hasBrandFilter = selectedBrand !== 'all' || (selectedBrands && selectedBrands.length > 0);
  const hasSearchFilter = searchQuery.trim().length > 0;
  const hasActiveFilters =
    hasCategoryFilter ||
    hasBrandFilter ||
    hasSearchFilter ||
    inStockOnly ||
    isBudgetFilterActive;

  const totalActiveFilterCount =
    (hasCategoryFilter ? 1 : 0) +
    (selectedBrands.length > 0 ? selectedBrands.length : hasBrandFilter ? 1 : 0) +
    (hasSearchFilter ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (isBudgetFilterActive ? 1 : 0);

  const resetFilters = () => {
    storeResetFilters();
    setSortBy('featured');
    setIsMobileBudgetOpen(false);
    setIsMobileDrawerOpen(false);
  };

  // Keyboard navigation inside search dropdown
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.matchingProducts.length && !suggestions.matchingBrands.length) {
      if (e.key === 'Enter' && searchQuery.trim()) {
        addRecentSearch(searchQuery);
        setIsSearchFocused(false);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchSelectedIndex(prev =>
        prev < suggestions.matchingProducts.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSearchSelectedIndex(prev =>
        prev > 0 ? prev - 1 : suggestions.matchingProducts.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (
        searchSelectedIndex >= 0 &&
        searchSelectedIndex < suggestions.matchingProducts.length
      ) {
        const item = suggestions.matchingProducts[searchSelectedIndex];
        setSelectedProductId(item.id);
        addRecentSearch(searchQuery);
        setIsSearchFocused(false);
      } else if (searchQuery.trim()) {
        addRecentSearch(searchQuery);
        setIsSearchFocused(false);
      }
    } else if (e.key === 'Escape') {
      setIsSearchFocused(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Sample Catalog Disclaimer Bar */}
      <div className="mb-6 p-2.5 px-3.5 bg-[#EBF3F8] border border-[#DCE7EF] rounded-md text-xs text-[#275B86] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#275B86]" />
          <span>
            <strong>Sample catalogue (prototype):</strong> Items and details are illustrative. Prices marked "Price on Request" are quoted by SDS Techware on enquiry.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setIsConfiguratorOpen(true)}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-[#10283D] font-bold border border-[#DCE7EF] rounded text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
          >
            <Server className="w-3 h-3 text-[#275B86]" /> Server Config Request
          </button>
          <button
            type="button"
            onClick={() => setIsWarrantyModalOpen(true)}
            className="px-2.5 py-1 bg-[#10283D] hover:bg-[#183B57] text-white font-bold rounded text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Warranty Lookup (demo)
          </button>
        </div>
      </div>

      {/* Mobile Horizontally Scrollable Category Filter */}
      <div className="lg:hidden mb-2 overflow-x-auto pb-1 -mx-4 px-4 flex gap-1.5 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            selectedCategory === 'all'
              ? 'bg-[#10283D] text-white font-medium shadow-2xs'
              : 'bg-white text-[#183B57] border border-[#DCE7EF] hover:bg-slate-50'
          }`}
        >
          <span>All Categories</span>
          <span
            className={`text-[10px] font-mono px-1 rounded ${
              selectedCategory === 'all' ? 'bg-white/20 text-white' : 'text-[#62798C]'
            }`}
          >
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
              className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                selectedCategory === cat.name
                  ? 'bg-[#10283D] text-white font-medium shadow-2xs'
                  : 'bg-white text-[#183B57] border border-[#DCE7EF] hover:bg-slate-50'
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`text-[10px] font-mono px-1 rounded ${
                  selectedCategory === cat.name ? 'bg-white/20 text-white' : 'text-[#62798C]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile Horizontally Scrollable Brand Filter */}
      <div className="lg:hidden mb-3 overflow-x-auto pb-1 -mx-4 px-4 flex gap-1.5 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedBrand('all')}
          className={`px-2.5 py-1 text-[11px] rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${
            !hasBrandFilter
              ? 'bg-[#275B86] text-white font-medium'
              : 'bg-slate-100 text-[#183B57] border border-[#DCE7EF] hover:bg-slate-200'
          }`}
        >
          <span>All Brands</span>
        </button>
        {brands.map(b => {
          const isSelected =
            selectedBrands.length > 0 ? selectedBrands.includes(b.name) : selectedBrand === b.name;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => toggleBrandFilter(b.name)}
              className={`px-2.5 py-1 text-[11px] rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${
                isSelected
                  ? 'bg-[#275B86] text-white font-medium'
                  : 'bg-white text-[#183B57] border border-[#DCE7EF] hover:bg-slate-50'
              }`}
            >
              <span>{b.name}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile Quick Action Buttons: "Filter & Refine" Drawer + Budget Range Slider */}
      <div className="lg:hidden mb-4 flex items-center gap-2">
        {/* Full Filter Drawer Trigger */}
        <button
          type="button"
          onClick={() => setIsMobileDrawerOpen(true)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
            hasActiveFilters
              ? 'bg-[#10283D] text-white border-[#10283D] shadow-xs'
              : 'bg-white text-[#183B57] border-[#DCE7EF] hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters &amp; Refine</span>
          {totalActiveFilterCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#275B86] text-white font-mono">
              {totalActiveFilterCount}
            </span>
          )}
        </button>

        {/* Budget Slider Quick Trigger */}
        <button
          type="button"
          onClick={() => setIsMobileBudgetOpen(prev => !prev)}
          className={`flex items-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
            isBudgetFilterActive
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
              : 'bg-white text-[#183B57] border-[#DCE7EF] hover:bg-slate-50'
          }`}
          title="Toggle Price Range Slider"
        >
          <Calculator className={`w-3.5 h-3.5 ${isBudgetFilterActive ? 'text-emerald-600' : 'text-[#275B86]'}`} />
          <span className="hidden sm:inline">Price Slider</span>
          {isMobileBudgetOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Collapsible Mobile Budget Range Calculator */}
      {isMobileBudgetOpen && (
        <div className="lg:hidden mb-4 animate-fadeIn">
          <PriceRangeCalculator onFilterApplied={() => {}} />
        </div>
      )}

      {/* Mobile Filter Slide-over Drawer */}
      <MobileFilterDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        filteredCount={filteredProducts.length}
      />

      {/* Main Grid: Sidebar + Product Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Desktop Narrow Category & Filter Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 space-y-5 sticky top-24">
          <div className="bg-white rounded-lg border border-[#DCE7EF] p-4 shadow-sm space-y-4">
            {/* Category Filter Section */}
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-[#DCE7EF]">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#275B86]" />
                  <h2 className="text-xs font-bold text-[#10283D] uppercase tracking-wider">
                    Categories
                  </h2>
                </div>
                {selectedCategory !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className="text-[11px] text-[#275B86] hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>

              <ul className="space-y-1 text-xs mt-2.5">
                <li>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-colors text-left ${
                      selectedCategory === 'all'
                        ? 'bg-[#EBF3F8] text-[#275B86] font-semibold'
                        : 'text-[#183B57] hover:bg-[#F7FAFD]'
                    }`}
                  >
                    <span>All Products</span>
                    <span className="text-[11px] text-[#62798C] font-mono">
                      {publishedProducts.length}
                    </span>
                  </button>
                </li>

                {categories.map(cat => {
                  const count = categoryCounts[cat.name] || 0;
                  return (
                    <li key={cat.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedCategory(cat.name)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-colors text-left ${
                          selectedCategory === cat.name
                            ? 'bg-[#EBF3F8] text-[#275B86] font-semibold'
                            : 'text-[#183B57] hover:bg-[#F7FAFD]'
                        }`}
                      >
                        <span className="truncate pr-1">{cat.name}</span>
                        <span className="text-[11px] text-[#62798C] font-mono">
                          {count}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Dedicated Brand Filter Section with Search & Product Counts */}
            <div className="pt-3 border-t border-[#DCE7EF]">
              <BrandFilter />
            </div>

            {/* Quick Availability Filter */}
            <div className="pt-3 border-t border-[#DCE7EF]">
              <label className="flex items-center justify-between text-xs text-[#183B57] cursor-pointer group">
                <div className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-[#275B86]" />
                  <span className="font-semibold group-hover:text-[#275B86] transition-colors">
                    In-Stock Only
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={e => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-[#275B86] border-[#CBD5E1] focus:ring-[#275B86] cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Dynamic Price Range & Budget Calculator */}
          <PriceRangeCalculator />
        </aside>

        {/* Wider Product Area */}
        <main className="lg:col-span-9 space-y-5">
          {/* Search, Sort, Compare, and Recent Searches Bar */}
          <div className="bg-white rounded-lg border border-[#DCE7EF] p-3 sm:p-4 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Robust Search Input with Autocomplete & Keyboard Shortcuts */}
              <div ref={searchContainerRef} className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#62798C]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setSearchSelectedIndex(-1);
                    setIsSearchFocused(true);
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search by product name, model, brand, or SKU... (Press '/' to focus)"
                  aria-label="Search products"
                  role="combobox"
                  aria-expanded={isSearchFocused && searchQuery.trim().length >= 1}
                  aria-controls="search-suggestions"
                  aria-autocomplete="list"
                  className="w-full pl-9 pr-16 py-2 text-xs sm:text-sm bg-[#F7FAFD] border border-[#DCE7EF] rounded-md text-[#183B57] placeholder:text-[#62798C]/70 focus:outline-none focus:border-[#275B86] focus:bg-white transition-colors"
                />

                {/* Right controls inside input: Clear button and keyboard shortcut indicator */}
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        searchInputRef.current?.focus();
                      }}
                      className="text-[#62798C] hover:text-[#183B57] p-0.5 rounded cursor-pointer"
                      title="Clear current search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <kbd className="hidden sm:inline-block text-[10px] text-[#62798C]/70 font-mono bg-white border border-[#DCE7EF] rounded px-1.5 py-0.5 shadow-2xs">
                      /
                    </kbd>
                  )}
                </div>

                {/* Instant Search Suggestions Dropdown */}
                <SearchSuggestionsDropdown
                  suggestions={suggestions}
                  searchQuery={searchQuery}
                  isOpen={isSearchFocused && searchQuery.trim().length >= 1}
                  onClose={() => setIsSearchFocused(false)}
                  onSelectBrand={b => {
                    toggleBrandFilter(b);
                    setIsSearchFocused(false);
                  }}
                  onSelectCategory={c => {
                    setSelectedCategory(c);
                    setIsSearchFocused(false);
                  }}
                  onSelectProduct={id => {
                    setSelectedProductId(id);
                    addRecentSearch(searchQuery);
                    setIsSearchFocused(false);
                  }}
                  onSubmitSearch={() => {
                    if (searchQuery.trim()) {
                      addRecentSearch(searchQuery);
                    }
                    setIsSearchFocused(false);
                  }}
                  selectedIndex={searchSelectedIndex}
                />
              </div>

              {/* Header Action Controls: Compare Toggle & Dynamic Sorting */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {/* Compare Products Toggle */}
                <button
                  type="button"
                  onClick={() => setIsCompareMode(prev => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border transition-all ${
                    isCompareMode
                      ? 'bg-[#10283D] text-white border-[#10283D] shadow-xs ring-1 ring-[#489DCA]'
                      : compareProductIds.length > 0
                      ? 'bg-[#EBF3F8] text-[#275B86] border-[#275B86]/40 hover:bg-[#dce9f2]'
                      : 'bg-[#F7FAFD] text-[#183B57] border-[#DCE7EF] hover:bg-[#EBF3F8]'
                  }`}
                  title={
                    isCompareMode
                      ? 'Compare Mode active. Click to disable.'
                      : 'Enable Compare Mode to pick items for side-by-side technical evaluation.'
                  }
                >
                  <Scale className={`w-3.5 h-3.5 ${isCompareMode ? 'text-[#489DCA]' : 'text-[#275B86]'}`} />
                  <span>Compare</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      isCompareMode
                        ? 'bg-[#275B86] text-white'
                        : compareProductIds.length > 0
                        ? 'bg-[#275B86] text-white font-bold'
                        : 'bg-[#DCE7EF] text-[#62798C]'
                    }`}
                  >
                    {compareProductIds.length}/4
                  </span>
                </button>

                {/* Direct Compare Matrix Modal Trigger (visible when 2+ items selected) */}
                {compareProductIds.length >= 2 && (
                  <button
                    type="button"
                    onClick={() => setIsCompareModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-md bg-[#275B86] hover:bg-[#10283D] text-white shadow-xs transition-colors"
                    title="View side-by-side comparison table"
                  >
                    <span>View Matrix ({compareProductIds.length})</span>
                  </button>
                )}

                {/* Sorting Dropdown */}
                <div className="flex items-center gap-1.5 text-xs bg-[#F7FAFD] border border-[#DCE7EF] rounded-md px-2.5 py-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#275B86]" />
                  <span className="hidden sm:inline text-[#62798C]">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as CatalogSort)}
                    aria-label="Sort products"
                    className="bg-transparent text-xs text-[#183B57] focus:outline-none font-medium cursor-pointer"
                  >
                    <option value="featured">Featured Collection</option>
                    <option value="relevance">Relevance (Best Match)</option>
                    <option value="name">Product Name (A-Z)</option>
                    <option value="brand">Brand (A-Z)</option>
                    <option value="price_asc">Published price: Low to High</option>
                    <option value="price_desc">Published price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Recent Searches Section */}
            {recentSearches.length > 0 && (
              <div className="pt-2.5 border-t border-[#DCE7EF] flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-[#62798C] font-medium shrink-0">
                  <Clock className="w-3.5 h-3.5 text-[#275B86]" />
                  <span className="font-semibold text-[#183B57]">Recent Searches:</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                  {recentSearches.map(term => {
                    const isActive = searchQuery.toLowerCase().trim() === term.toLowerCase().trim();
                    return (
                      <span
                        key={term}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] transition-all ${
                          isActive
                            ? 'bg-[#275B86] text-white font-medium shadow-xs'
                            : 'bg-[#F1F5F9] hover:bg-[#EBF3F8] text-[#183B57] border border-[#DCE7EF]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery(term);
                            addRecentSearch(term);
                          }}
                          className="hover:underline text-left cursor-pointer"
                          title={`Search for "${term}"`}
                        >
                          {term}
                        </button>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            removeRecentSearch(term);
                          }}
                          className={`p-0.5 rounded-full hover:bg-black/10 transition-colors ${
                            isActive ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-red-600'
                          }`}
                          title={`Remove "${term}" from recent searches`}
                          aria-label={`Remove ${term}`}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    );
                  })}

                  <button
                    type="button"
                    onClick={clearRecentSearches}
                    className="text-[11px] text-[#62798C] hover:text-red-600 transition-colors ml-1 font-medium"
                    title="Clear recent searches history"
                  >
                    Clear history
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active Filters / Dynamic Result Counter */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#62798C] px-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span>
                Showing <span className="font-semibold text-[#183B57]">{filteredProducts.length}</span> of {publishedProducts.length} items
              </span>

              {/* Active Search Term Badge */}
              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#10283D] text-white font-medium text-[11px] shadow-2xs">
                  <Search className="w-2.5 h-2.5 text-slate-300" />
                  <span>"{searchQuery.trim()}"</span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="hover:text-red-300 cursor-pointer ml-0.5"
                    title="Clear search query"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}

              {/* Active Category Badge */}
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EBF3F8] text-[#275B86] font-medium text-[11px]">
                  <span>Category: {selectedCategory}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className="hover:text-red-600 cursor-pointer ml-0.5"
                    title="Remove category filter"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}

              {/* Active Brand Badges */}
              {selectedBrands.length > 0 ? (
                selectedBrands.map(b => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EBF3F8] text-[#275B86] font-medium text-[11px]"
                  >
                    <Tag className="w-2.5 h-2.5 text-[#275B86]" />
                    <span>Brand: {b}</span>
                    <button
                      type="button"
                      onClick={() => toggleBrandFilter(b)}
                      className="hover:text-red-600 cursor-pointer ml-0.5"
                      title={`Remove brand filter ${b}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))
              ) : selectedBrand !== 'all' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EBF3F8] text-[#275B86] font-medium text-[11px]">
                  <Tag className="w-2.5 h-2.5 text-[#275B86]" />
                  <span>Brand: {selectedBrand}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedBrand('all')}
                    className="hover:text-red-600 cursor-pointer ml-0.5"
                    title="Remove brand filter"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ) : null}

              {/* Active In-Stock Only Badge */}
              {inStockOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-medium text-[11px]">
                  <Package className="w-2.5 h-2.5 text-blue-600" />
                  <span>In-Stock Only</span>
                  <button
                    type="button"
                    onClick={() => setInStockOnly(false)}
                    className="hover:text-red-600 cursor-pointer ml-0.5"
                    title="Remove stock filter"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}

              {/* Active Budget Range Badge */}
              {isBudgetFilterActive && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium text-[11px]">
                  <Calculator className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                  <span>
                    Budget: {formatLKR(budgetFilter.min)} – {formatLKR(budgetFilter.max)}
                  </span>
                  <button
                    type="button"
                    onClick={resetBudgetFilter}
                    className="hover:text-red-600 cursor-pointer ml-0.5"
                    title="Reset budget filter"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
            </div>

            {/* Clear All Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-[#275B86] hover:underline cursor-pointer flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear all filters</span>
              </button>
            )}
          </div>

          {/* Product Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            /* Smart Empty State with Direct Suggestions */
            <div className="bg-white rounded-lg border border-dashed border-[#DCE7EF] p-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#EBF3F8] text-[#275B86] flex items-center justify-center mx-auto">
                <Search className="w-7 h-7 text-[#275B86]" />
              </div>

              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-[#10283D]">
                  No matching products found
                </h3>
                <p className="text-xs text-[#62798C] leading-relaxed">
                  We couldn't find any products matching{' '}
                  {searchQuery ? (
                    <strong className="text-[#10283D]">"{searchQuery}"</strong>
                  ) : (
                    'your current criteria'
                  )}
                  {selectedCategory !== 'all' ? (
                    <span> in category <strong>{selectedCategory}</strong></span>
                  ) : null}
                  {hasBrandFilter ? (
                    <span> for selected brand(s)</span>
                  ) : null}
                  .
                </p>
              </div>

              {/* Suggestions Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-[#183B57] font-medium rounded-md transition-colors"
                  >
                    Clear search term
                  </button>
                )}

                {hasBrandFilter && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBrand('all');
                    }}
                    className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-[#183B57] font-medium rounded-md transition-colors"
                  >
                    Clear brand filter
                  </button>
                )}

                {hasCategoryFilter && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-[#183B57] font-medium rounded-md transition-colors"
                  >
                    Show all categories
                  </button>
                )}

                {inStockOnly && (
                  <button
                    type="button"
                    onClick={() => setInStockOnly(false)}
                    className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-[#183B57] font-medium rounded-md transition-colors"
                  >
                    Include out-of-stock items
                  </button>
                )}

                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#275B86] hover:bg-[#10283D] rounded-md transition-colors shadow-2xs"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
