import React, { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { Product } from '../../types';
import { ProductEditorModal } from './ProductEditorModal';
import { CategoryBrandManager } from './CategoryBrandManager';
import { InventoryView } from './InventoryView';
import { StockRequestsView } from './StockRequestsView';
import { TeamAccessView } from './TeamAccessView';
import { LowStockReorderWidget } from './LowStockReorderWidget';
import { PrototypeNotices } from './PrototypeNotices';
import { hasPublicPrice, isPublishablePrice } from '../../features/catalog/pricing';
import { formatCost } from '../../lib/format';
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  Users,
  Plus,
  Search,
  Eye,
  EyeOff,
  Archive,
  RotateCcw,
  Edit,
  ExternalLink,
  Shield,
  Menu,
  X,
  AlertTriangle,
  Bell,
} from 'lucide-react';

type AdminTab = 'overview' | 'products' | 'categories' | 'inventory' | 'requests' | 'team';

export const StaffWorkspace: React.FC = () => {
  const {
    products,
    activeProducts,
    publishedProducts,
    archivedProducts,
    categories,
    brands,
    currentRole,
    togglePublishProduct,
    togglePriceVisibility,
    archiveProduct,
    restoreProduct,
    setCurrentView,
    formatLKR,
    stockAlerts,
    showToast,
    actor,
  } = useStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Product tab filters
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [productBrandFilter, setProductBrandFilter] = useState<string>('all');
  const [productPriceVisibilityFilter, setProductPriceVisibilityFilter] = useState<'all' | 'public' | 'hidden'>('all');
  const [productStockFilter, setProductStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock' | 'unconfirmed'>('all');

  const resetProductFilters = () => {
    setProductSearch('');
    setProductStatusFilter('all');
    setProductCategoryFilter('all');
    setProductBrandFilter('all');
    setProductPriceVisibilityFilter('all');
    setProductStockFilter('all');
  };

  const isAnyProductFilterActive =
    productSearch.trim() !== '' ||
    productStatusFilter !== 'all' ||
    productCategoryFilter !== 'all' ||
    productBrandFilter !== 'all' ||
    productPriceVisibilityFilter !== 'all' ||
    productStockFilter !== 'all';

  // Product editor modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Archive confirm modal state
  const [archiveTarget, setArchiveTarget] = useState<Product | null>(null);

  // Metrics computation for Overview
  const currentTotal = activeProducts.length;
  const publishedCount = publishedProducts.length;
  const unpublishedCount = activeProducts.filter(p => !p.isPublished).length;
  const outOfStockCount = activeProducts.filter(p => p.stock === 0).length;
  const unconfirmedStockCount = activeProducts.filter(p => p.stock === null).length;
  const pendingAlertsCount = stockAlerts.filter(a => a.status === 'pending').length;
  const readyToNotifyCount = stockAlerts.filter(a => {
    if (a.status !== 'pending') return false;
    const prod = activeProducts.find(p => p.id === a.productId);
    return prod && prod.stock !== null && prod.stock > 0;
  }).length;


  // Viewer mode lock
  if (currentRole === 'viewer') {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-[#DCE7EF] rounded-xl shadow-lg text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#10283D]">Staff Access Restricted</h2>
        <p className="text-xs text-[#62798C] leading-relaxed">
          Your current demo role is <strong>Viewer (Customer)</strong>. The Staff Workspace is only accessible to authorized team roles: Owner, Product Manager, or Stock Editor.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => setCurrentView('store')}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#275B86] hover:bg-[#10283D] rounded-md transition-colors"
          >
            Return to Storefront
          </button>
        </div>
      </div>
    );
  }

  // Filter products for the Products management table
  const displayedProducts = products.filter(p => {
    // Status filter
    if (productStatusFilter === 'published' && (!p.isPublished || p.isArchived)) return false;
    if (productStatusFilter === 'draft' && (p.isPublished || p.isArchived)) return false;
    if (productStatusFilter === 'archived' && !p.isArchived) return false;
    if (productStatusFilter === 'all' && p.isArchived) return false;

    // Category filter
    if (productCategoryFilter !== 'all' && p.category !== productCategoryFilter) return false;

    // Brand filter
    if (productBrandFilter !== 'all' && p.brand !== productBrandFilter) return false;

    // Price visibility filter
    if (productPriceVisibilityFilter === 'public' && (!p.isPricePublic || p.price === null)) return false;
    if (productPriceVisibilityFilter === 'hidden' && (p.isPricePublic && p.price !== null)) return false;

    // Stock filter
    if (productStockFilter === 'in_stock' && (p.stock === null || p.stock === 0)) return false;
    if (productStockFilter === 'out_of_stock' && p.stock !== 0) return false;
    if (productStockFilter === 'unconfirmed' && p.stock !== null) return false;

    // Search query
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase().trim();
      const matchModel = p.model.toLowerCase().includes(q);
      const matchBrand = p.brand.toLowerCase().includes(q);
      const matchCategory = p.category.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      const matchName = p.name ? p.name.toLowerCase().includes(q) : false;
      return matchModel || matchBrand || matchCategory || matchSku || matchName;
    }
    return true;
  });

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsEditorOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setIsEditorOpen(true);
  };

  const handleConfirmArchive = () => {
    if (archiveTarget) {
      const res = archiveProduct(archiveTarget.id);
      showToast(res.success ? `Product "${archiveTarget.model}" moved to archive.` : res.error);
      setArchiveTarget(null);
    }
  };

  const navItems: Array<{ id: AdminTab; label: string; icon: any; restricted?: boolean; badge?: number }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products Catalog', icon: Package, restricted: currentRole === 'stock_editor' },
    { id: 'categories', label: 'Categories & Brands', icon: Layers, restricted: currentRole === 'stock_editor' },
    { id: 'inventory', label: 'Inventory & Stock', icon: Boxes },
    { id: 'requests', label: 'Stock Requests', icon: Bell, badge: pendingAlertsCount },
    { id: 'team', label: 'Team Access', icon: Users, restricted: currentRole !== 'owner' },
  ];

  return (
    <div className="min-h-screen bg-[#F7FAFD] flex flex-col">
      {/* Staff Workspace Top Bar */}
      <div className="bg-[#10283D] text-white px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-[#275B86]/40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="md:hidden p-1.5 text-slate-300 hover:text-white"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight">SDS TECHWARE</span>
            <span className="text-[10px] bg-[#275B86] text-white px-1.5 py-0.2 rounded font-mono">
              STAFF WORKSPACE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-slate-400" title="Authentication is not implemented. Actions are recorded against this demo session and role.">
              No sign-in (prototype):
            </span>
            <span className="font-semibold text-slate-200">Demo session</span>
            <span className="text-[10px] bg-[#489DCA]/20 text-[#489DCA] border border-[#489DCA]/40 px-1.5 py-0.5 rounded uppercase font-bold tracking-wide">
              {currentRole.replace('_', ' ')}
            </span>
          </div>

          <button
            onClick={() => setCurrentView('store')}
            className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition-colors text-xs font-medium"
          >
            <span>Back to Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Desktop Sidebar: White sidebar with Navy selected navigation */}
        <aside className="hidden md:block md:col-span-3 bg-white rounded-lg border border-[#DCE7EF] p-3 shadow-sm sticky top-20">
          <div className="px-3 py-2 border-b border-[#DCE7EF] mb-2">
            <div className="text-[11px] font-bold text-[#62798C] uppercase tracking-wider">
              Management Portal
            </div>
            <div className="text-xs font-semibold text-[#10283D] mt-0.5">
              SDS Techware (Pvt) Ltd.
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.restricted) return;
                    setActiveTab(item.id);
                  }}
                  disabled={item.restricted}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-all text-left ${
                    isActive
                      ? 'bg-[#10283D] text-white shadow-sm'
                      : item.restricted
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'text-[#183B57] hover:bg-[#F7FAFD]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#489DCA]' : 'text-[#62798C]'}`} />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-[#489DCA] text-white' : 'bg-[#EBF3F8] text-[#275B86] border border-[#275B86]/20'
                      }`}>
                        {item.badge}
                      </span>
                    )}

                    {item.restricted && (
                      <span className="text-[9px] bg-slate-100 text-slate-400 px-1 py-0.2 rounded font-mono">
                        Locked
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Role disclaimer reminder */}
          <div className="mt-6 pt-4 border-t border-[#DCE7EF] text-[11px] text-[#62798C] px-2 space-y-1">
            <span className="font-semibold text-[#10283D] block">Current Privileges:</span>
            <p className="text-[10px] leading-relaxed">
              {currentRole === 'owner' && 'Full catalog, pricing, inventory & team management authority.'}
              {currentRole === 'product_manager' && 'Catalog, pricing, specs and stock control enabled.'}
              {currentRole === 'stock_editor' && 'Restricted to physical inventory quantity adjustments.'}
            </p>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 bg-[#10283D]/60 flex md:hidden" onClick={() => setMobileNavOpen(false)}>
            <div
              className="bg-white w-64 h-full p-4 shadow-xl flex flex-col justify-between"
              onClick={e => e.stopPropagation()}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#DCE7EF]">
                  <span className="text-xs font-bold text-[#10283D]">STAFF NAVIGATION</span>
                  <button onClick={() => setMobileNavOpen(false)}>
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                <nav className="mt-4 space-y-1">
                  {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        disabled={item.restricted}
                        onClick={() => {
                          if (item.restricted) return;
                          setActiveTab(item.id);
                          setMobileNavOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-xs font-medium ${
                          isActive
                            ? 'bg-[#10283D] text-white'
                            : item.restricted
                            ? 'text-slate-300'
                            : 'text-[#183B57] hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                              isActive ? 'bg-[#489DCA] text-white' : 'bg-[#EBF3F8] text-[#275B86]'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                          {item.restricted && <span className="text-[9px] text-slate-400">Locked</span>}
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-[#DCE7EF] text-xs text-[#62798C]">
                {actor.label} — no authentication
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="md:col-span-9 space-y-6">
          {/* SECTION 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-base font-bold text-[#10283D]">
                  Operational Catalog Overview
                </h1>
                <p className="text-xs text-[#62798C] mt-0.5">
                  Catalogue and stock figures from the demo data stored in this browser.
                </p>
              </div>

              <PrototypeNotices />

              {/* 5 Compact Summary Cards (No fictional sales charts!) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                <div className="bg-white p-4 rounded-lg border border-[#DCE7EF] shadow-xs">
                  <div className="text-[11px] font-medium text-[#62798C]">Current Active</div>
                  <div className="text-2xl font-bold text-[#10283D] font-mono mt-1">
                    {currentTotal}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Active products</div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-[#DCE7EF] shadow-xs">
                  <div className="text-[11px] font-medium text-[#275B86]">Published</div>
                  <div className="text-2xl font-bold text-[#275B86] font-mono mt-1">
                    {publishedCount}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Live on storefront</div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-[#DCE7EF] shadow-xs">
                  <div className="text-[11px] font-medium text-slate-600">Unpublished</div>
                  <div className="text-2xl font-bold text-[#183B57] font-mono mt-1">
                    {unpublishedCount}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Draft / Hidden</div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-[#DCE7EF] shadow-xs">
                  <div className="text-[11px] font-medium text-red-600">Out of Stock</div>
                  <div className="text-2xl font-bold text-red-600 font-mono mt-1">
                    {outOfStockCount}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Physical count = 0</div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-[#DCE7EF] shadow-xs col-span-2 sm:col-span-1">
                  <div className="text-[11px] font-medium text-amber-600">Unconfirmed Stock</div>
                  <div className="text-2xl font-bold text-amber-700 font-mono mt-1">
                    {unconfirmedStockCount}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Blank count (Inquire)</div>
                </div>
              </div>

              {/* Low Stock Alerts & Quick Reorder Dashboard Widget */}
              <LowStockReorderWidget
                onNavigateToInventory={() => setActiveTab('inventory')}
                onNavigateToRequests={() => setActiveTab('requests')}
              />

              {/* Quick Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-lg border border-[#DCE7EF] shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-[#10283D] uppercase tracking-wider">
                      Catalog Maintenance
                    </h3>
                    <p className="text-xs text-[#62798C] mt-1 leading-relaxed">
                      Maintain models, high-res photography, specifications, and quotation pricing.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {currentRole !== 'stock_editor' && (
                      <button
                        onClick={handleOpenAddProduct}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#275B86] hover:bg-[#10283D] text-white rounded text-xs font-semibold transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Product</span>
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTab('products')}
                      className="px-3 py-1.5 border border-[#DCE7EF] text-[#183B57] hover:bg-slate-50 rounded text-xs font-medium"
                    >
                      View All Products
                    </button>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-lg border border-[#DCE7EF] shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-[#10283D] uppercase tracking-wider">
                      Inventory Verification
                    </h3>
                    <p className="text-xs text-[#62798C] mt-1 leading-relaxed">
                      {outOfStockCount + unconfirmedStockCount} items currently require stock verification or replenishment.
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={() => setActiveTab('inventory')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#10283D] hover:bg-[#275B86] text-white rounded text-xs font-semibold transition-colors"
                    >
                      <Boxes className="w-3.5 h-3.5" />
                      <span>Open Inventory Sheet</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-lg border border-[#DCE7EF] shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-[#10283D] uppercase tracking-wider">
                        Customer Stock Requests
                      </h3>
                      {pendingAlertsCount > 0 && (
                        <span className="text-[10px] bg-[#EBF3F8] text-[#275B86] font-bold px-2 py-0.5 rounded-full border border-[#275B86]/20">
                          {pendingAlertsCount} pending
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#62798C] mt-1 leading-relaxed">
                      {readyToNotifyCount > 0
                        ? `${readyToNotifyCount} customer(s) requested items that are now back in stock!`
                        : `${pendingAlertsCount} active back-in-stock notification alert(s) registered.`}
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={() => setActiveTab('requests')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                        readyToNotifyCount > 0
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-[#275B86] hover:bg-[#10283D] text-white'
                      }`}
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Manage Stock Requests</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-base font-bold text-[#10283D]">Product Catalog</h1>
                  <p className="text-xs text-[#62798C] mt-0.5">
                    Add, edit, adjust prices, manage image assets, and publish products.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenAddProduct}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#275B86] hover:bg-[#10283D] rounded-md transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add IT Product</span>
                  </button>
                </div>
              </div>

              {/* Search & Comprehensive Filters Toolbar */}
              <div className="bg-white p-3.5 rounded-lg border border-[#DCE7EF] shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#62798C]" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      placeholder="Search by model, SKU, brand, category, or name..."
                      className="w-full pl-9 pr-8 py-1.5 text-xs bg-[#F7FAFD] border border-[#DCE7EF] rounded-md text-[#183B57] focus:outline-none focus:border-[#275B86]"
                    />
                    {productSearch && (
                      <button
                        type="button"
                        onClick={() => setProductSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {isAnyProductFilterActive && (
                    <button
                      type="button"
                      onClick={resetProductFilters}
                      className="inline-flex items-center gap-1 text-xs text-[#275B86] hover:text-[#10283D] hover:underline font-medium shrink-0 cursor-pointer self-start sm:self-auto"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Filters</span>
                    </button>
                  )}
                </div>

                {/* Secondary Multi-Filter Bar: Status, Category, Brand, Price Visibility, Stock */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-[#DCE7EF] text-xs">
                  {/* Status */}
                  <div>
                    <label className="text-[10px] text-[#62798C] font-semibold block mb-0.5">Status</label>
                    <select
                      value={productStatusFilter}
                      onChange={e => setProductStatusFilter(e.target.value as any)}
                      className="w-full text-xs bg-[#F7FAFD] border border-[#DCE7EF] rounded px-2 py-1 text-[#183B57] focus:outline-none focus:border-[#275B86]"
                    >
                      <option value="all">Active Catalog ({activeProducts.length})</option>
                      <option value="published">Published Only ({publishedCount})</option>
                      <option value="draft">Drafts / Unpublished ({unpublishedCount})</option>
                      <option value="archived">Archived ({archivedProducts.length})</option>
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="text-[10px] text-[#62798C] font-semibold block mb-0.5">Category</label>
                    <select
                      value={productCategoryFilter}
                      onChange={e => setProductCategoryFilter(e.target.value)}
                      className="w-full text-xs bg-[#F7FAFD] border border-[#DCE7EF] rounded px-2 py-1 text-[#183B57] focus:outline-none focus:border-[#275B86]"
                    >
                      <option value="all">All Categories ({categories.length})</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Brand Filter */}
                  <div>
                    <label className="text-[10px] text-[#62798C] font-semibold block mb-0.5">Brand</label>
                    <select
                      value={productBrandFilter}
                      onChange={e => setProductBrandFilter(e.target.value)}
                      className="w-full text-xs bg-[#F7FAFD] border border-[#DCE7EF] rounded px-2 py-1 text-[#183B57] focus:outline-none focus:border-[#275B86]"
                    >
                      <option value="all">All Brands ({brands.length})</option>
                      {brands.map(b => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Visibility Filter */}
                  <div>
                    <label className="text-[10px] text-[#62798C] font-semibold block mb-0.5">Public Price</label>
                    <select
                      value={productPriceVisibilityFilter}
                      onChange={e => setProductPriceVisibilityFilter(e.target.value as any)}
                      className="w-full text-xs bg-[#F7FAFD] border border-[#DCE7EF] rounded px-2 py-1 text-[#183B57] focus:outline-none focus:border-[#275B86]"
                    >
                      <option value="all">All Visibility</option>
                      <option value="public">Visible Prices Only</option>
                      <option value="hidden">Hidden (Quotation RFQ)</option>
                    </select>
                  </div>

                  {/* Stock Status Filter */}
                  <div>
                    <label className="text-[10px] text-[#62798C] font-semibold block mb-0.5">Stock Level</label>
                    <select
                      value={productStockFilter}
                      onChange={e => setProductStockFilter(e.target.value as any)}
                      className="w-full text-xs bg-[#F7FAFD] border border-[#DCE7EF] rounded px-2 py-1 text-[#183B57] focus:outline-none focus:border-[#275B86]"
                    >
                      <option value="all">All Stock Statuses</option>
                      <option value="in_stock">In Stock (&gt;0)</option>
                      <option value="out_of_stock">Out of Stock (0)</option>
                      <option value="unconfirmed">Unconfirmed (Blank)</option>
                    </select>
                  </div>
                </div>

                {/* Results count pill */}
                <div className="flex items-center justify-between text-[11px] text-[#62798C] pt-1">
                  <span>
                    Showing <strong>{displayedProducts.length}</strong> of {products.length} products
                  </span>
                  {isAnyProductFilterActive && (
                    <span className="text-[#275B86] font-medium bg-[#EBF3F8] px-2 py-0.5 rounded">
                      Filtered results
                    </span>
                  )}
                </div>
              </div>

              {/* Product Table */}
              <div className="bg-white rounded-lg border border-[#DCE7EF] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#183B57]">
                    <thead className="bg-[#F7FAFD] border-b border-[#DCE7EF] text-[11px] font-bold text-[#62798C] uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Product</th>
                        <th className="py-3 px-4">Brand / Category</th>
                        <th className="py-3 px-4">Internal Price</th>
                        <th className="py-3 px-4">Public Visibility</th>
                        <th className="py-3 px-4">Stock</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE7EF]">
                      {displayedProducts.map(prod => {
                        const hasImage = prod.images && prod.images.length > 0 && prod.images[0];
                        return (
                          <tr key={prod.id} className="hover:bg-[#F7FAFD]/70 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded border border-[#DCE7EF] bg-[#F1F5F9] shrink-0 flex items-center justify-center overflow-hidden">
                                  {hasImage ? (
                                    <img
                                      src={prod.images[0]}
                                      alt=""
                                      className="w-full h-full object-contain mix-blend-multiply"
                                    />
                                  ) : (
                                    <span className="text-[9px] text-slate-400 font-medium">Pending</span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-[#10283D] truncate max-w-[200px]" title={prod.model}>
                                    {prod.model}
                                  </div>
                                  <div className="text-[10px] text-[#62798C] font-mono">
                                    {prod.sku}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-medium text-[#10283D]">{prod.brand}</div>
                              <div className="text-[11px] text-[#62798C]">{prod.category}</div>
                            </td>

                            <td className="py-3 px-4 font-mono font-medium">
                              {prod.price === null ? (
                                <span className="text-slate-400 italic">Blank</span>
                              ) : (
                                <span>{formatLKR(prod.price)}</span>
                              )}
                              <div className="text-[10px] text-slate-400 font-sans font-normal" title="Internal purchase cost (never shown to customers)">
                                Cost: {formatCost(prod.purchaseCost ?? null)}
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <button
                                type="button"
                                disabled={(!prod.isPricePublic && !isPublishablePrice(prod.price)) || currentRole === 'stock_editor'}
                                onClick={() => {
                                  const res = togglePriceVisibility(prod.id);
                                  showToast(
                                    !res.success
                                      ? res.error
                                      : prod.isPricePublic
                                        ? `Price for "${prod.model}" hidden from storefront (Price on Request).`
                                        : `Price for "${prod.model}" is now publicly visible.`,
                                  );
                                }}
                                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                                  !prod.isPricePublic && !isPublishablePrice(prod.price)
                                    ? 'text-slate-400 cursor-not-allowed opacity-60'
                                    : hasPublicPrice(prod)
                                    ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
                                }`}
                                title={
                                  !prod.isPricePublic && !isPublishablePrice(prod.price)
                                    ? 'Enter a price greater than LKR 0 to enable public visibility'
                                    : prod.isPricePublic
                                    ? 'Click to hide price (Quotation only)'
                                    : 'Click to make price publicly visible'
                                }
                              >
                                {hasPublicPrice(prod) ? (
                                  <>
                                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Visible</span>
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Hidden</span>
                                  </>
                                )}
                              </button>
                            </td>

                            <td className="py-3 px-4 font-mono">
                              {prod.stock === null ? (
                                <span className="text-amber-700 text-[11px] font-sans font-medium">Unconfirmed</span>
                              ) : prod.stock === 0 ? (
                                <span className="text-red-600 text-[11px] font-sans font-medium">0 (Out of stock)</span>
                              ) : (
                                <span className="text-emerald-700 font-semibold">{prod.stock} units</span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <button
                                type="button"
                                disabled={prod.isArchived || currentRole === 'stock_editor'}
                                onClick={() => {
                                  const res = togglePublishProduct(prod.id);
                                  showToast(
                                    !res.success
                                      ? res.error
                                      : prod.isPublished
                                        ? `Product "${prod.model}" unpublished to Draft.`
                                        : `Product "${prod.model}" published to storefront.`,
                                  );
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                                  prod.isArchived
                                    ? 'bg-slate-200 text-slate-700 cursor-not-allowed'
                                    : prod.isPublished
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                }`}
                                title={prod.isArchived ? 'Archived product' : prod.isPublished ? 'Click to unpublish to Draft' : 'Click to publish to Storefront'}
                              >
                                {prod.isArchived ? 'Archived' : prod.isPublished ? 'Published' : 'Draft'}
                              </button>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {!prod.isArchived ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditProduct(prod)}
                                      className="p-1.5 text-[#275B86] hover:bg-[#EBF3F8] rounded transition-colors cursor-pointer"
                                      title="Edit product specifications, pricing and photos"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const res = togglePublishProduct(prod.id);
                                        showToast(
                                          !res.success
                                            ? res.error
                                            : prod.isPublished
                                              ? `Product "${prod.model}" unpublished to Draft.`
                                              : `Product "${prod.model}" published to storefront.`,
                                        );
                                      }}
                                      className="p-1.5 text-slate-500 hover:text-[#183B57] hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                      title={prod.isPublished ? 'Unpublish to draft' : 'Publish to storefront'}
                                    >
                                      {prod.isPublished ? (
                                        <EyeOff className="w-3.5 h-3.5" />
                                      ) : (
                                        <Eye className="w-3.5 h-3.5" />
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setArchiveTarget(prod)}
                                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                      title="Archive product (recoverable)"
                                    >
                                      <Archive className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const res = restoreProduct(prod.id);
                                      showToast(res.success ? `Product "${prod.model}" restored to catalog.` : res.error);
                                    }}
                                    className="inline-flex items-center gap-1 text-xs text-[#275B86] hover:text-[#10283D] font-semibold hover:underline cursor-pointer"
                                    title="Restore product to active catalog"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Restore</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {displayedProducts.length === 0 && (
                    <div className="p-12 text-center text-xs text-[#62798C] space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Search className="w-5 h-5" />
                      </div>
                      <div className="font-semibold text-sm text-[#10283D]">No products found</div>
                      <p>No products match the selected filters or search keyword.</p>
                      {isAnyProductFilterActive && (
                        <button
                          type="button"
                          onClick={resetProductFilters}
                          className="px-3 py-1.5 bg-[#275B86] hover:bg-[#10283D] text-white rounded text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Clear Product Filters
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: CATEGORIES & BRANDS */}
          {activeTab === 'categories' && <CategoryBrandManager />}

          {/* SECTION 4: INVENTORY */}
          {activeTab === 'inventory' && <InventoryView />}

          {/* SECTION 5: STOCK REQUESTS */}
          {activeTab === 'requests' && (
            <StockRequestsView onNavigateToInventory={() => setActiveTab('inventory')} />
          )}

          {/* SECTION 6: TEAM ACCESS */}
          {activeTab === 'team' && <TeamAccessView />}
        </main>
      </div>

      {/* Product Editor Modal */}
      <ProductEditorModal
        product={editingProduct}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
      />

      {/* Archive Confirmation Dialog */}
      {archiveTarget && (
        <div className="fixed inset-0 z-50 bg-[#10283D]/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-[#DCE7EF] space-y-4">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-sm text-[#10283D]">Archive IT Product?</h3>
            </div>
            <p className="text-xs text-[#62798C] leading-relaxed">
              Are you sure you want to archive <strong>{archiveTarget.model}</strong>? It will be removed from customer view but can be restored at any time from the archived filter.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setArchiveTarget(null)}
                className="px-3 py-1.5 text-xs text-[#183B57] hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmArchive}
                className="px-4 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors"
              >
                Archive Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
