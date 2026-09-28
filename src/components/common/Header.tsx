import React, { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { StaffRole } from '../../types';
import { FileText, Shield, ChevronDown, RotateCcw, ExternalLink, Bookmark, Server, ShieldCheck, Scale } from 'lucide-react';
import { BUSINESS } from '../../config/business';
import { ResetDemoDialog } from './ResetDemoDialog';

export const Header: React.FC = () => {
  const {
    quoteItems,
    setIsQuoteDrawerOpen,
    currentRole,
    setDemoRole,
    currentView,
    setCurrentView,
    savedProductIds,
    setIsSavedDrawerOpen,
    setIsConfiguratorOpen,
    setIsWarrantyModalOpen,
    setIsCompareModalOpen,
    compareProductIds,
  } = useStore();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const totalQuoteCount = quoteItems.reduce((acc, item) => acc + item.quantity, 0);
  const roleMenuRef = React.useRef<HTMLDivElement>(null);

  // Close the role menu on Escape or outside click.
  React.useEffect(() => {
    if (!roleMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRoleMenuOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) setRoleMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [roleMenuOpen]);

  const roleLabels: Record<StaffRole, { title: string; badgeColor: string; desc: string }> = {
    owner: {
      title: 'Owner',
      badgeColor: 'bg-[#10283D] text-white',
      desc: 'Full catalog, pricing, inventory & team management',
    },
    product_manager: {
      title: 'Product Manager',
      badgeColor: 'bg-[#275B86] text-white',
      desc: 'Catalog, pricing & stock (no user admin)',
    },
    stock_editor: {
      title: 'Stock Editor',
      badgeColor: 'bg-[#489DCA] text-white',
      desc: 'Stock counts only (no pricing or user controls)',
    },
    viewer: {
      title: 'Viewer (Customer)',
      badgeColor: 'bg-slate-100 text-slate-700 border border-slate-300',
      desc: 'Storefront only (no staff workspace access)',
    },
  };

  const handleRoleSelect = (role: StaffRole) => {
    setDemoRole(role);
    setRoleMenuOpen(false);
  };

  return (
    <>
      {/* 1. Top Strip */}
      <div className="bg-[#10283D] text-slate-300 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-normal text-slate-200">IT solutions &amp; supplies since {BUSINESS.establishedYear.value}.</span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline text-slate-400">{BUSINESS.legalName.value}</span>
            <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-wide bg-amber-400/20 text-amber-200 px-1.5 py-0.5 rounded">
              Prototype
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Demo role preview indicator */}
            <div className="relative" ref={roleMenuRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={roleMenuOpen}
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 px-2 py-0.5 rounded transition-colors"
                title="Toggle prototype staff role"
              >
                <Shield className="w-3 h-3 text-[#489DCA]" />
                <span className="font-medium">Role: {roleLabels[currentRole].title}</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-[#DCE7EF] py-2 z-50 text-[#183B57]">
                  <div className="px-3 py-1.5 border-b border-[#DCE7EF] text-[11px] text-[#62798C] font-semibold uppercase tracking-wider">
                    Demo Role Switcher
                    <p className="text-[10px] font-normal normal-case text-amber-700 bg-amber-50 p-1 rounded mt-1">
                      Prototype preview only. There is no sign-in; anyone can switch roles.
                    </p>
                  </div>
                  {(['owner', 'product_manager', 'stock_editor', 'viewer'] as StaffRole[]).map(role => (
                    <button
                      key={role}
                      onClick={() => handleRoleSelect(role)}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-[#F7FAFD] flex flex-col transition-colors ${
                        currentRole === role ? 'bg-[#F7FAFD] font-semibold text-[#275B86]' : 'text-[#183B57]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{roleLabels[role].title}</span>
                        {currentRole === role && (
                          <span className="text-[10px] bg-[#275B86] text-white px-1.5 py-0.2 rounded font-normal">Active</span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#62798C] font-normal mt-0.5">{roleLabels[role].desc}</span>
                    </button>
                  ))}

                  <div className="border-t border-[#DCE7EF] mt-1 pt-1 px-2">
                    <button
                      onClick={() => {
                        setRoleMenuOpen(false);
                        setResetConfirmOpen(true);
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Demo Data</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <span className="text-slate-300 font-medium">{BUSINESS.country}</span>
          </div>
        </div>
      </div>

      {/* 2. Main Header (Sticky) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#DCE7EF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          {/* Brand Wordmark (no invented emblem, easy to replace with logo image later) */}
          <button
            onClick={() => setCurrentView('store')}
            className="text-left group focus:outline-none"
          >
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#10283D] group-hover:text-[#275B86] transition-colors">
              SDS TECHWARE
            </div>
            <div className="text-[10px] tracking-[0.2em] font-semibold text-[#62798C] -mt-0.5">
              IT SOLUTIONS &amp; SUPPLIES
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-[#183B57]">
            <button
              onClick={() => setCurrentView('store')}
              className={`hover:text-[#275B86] transition-colors py-1 relative ${
                currentView === 'store' ? 'text-[#275B86] font-semibold' : ''
              }`}
            >
              Shop Catalog
              {currentView === 'store' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#275B86] rounded-full" />
              )}
            </button>

            {/* Server & Workstation Configurator */}
            <button
              type="button"
              onClick={() => {
                setCurrentView('store');
                setIsConfiguratorOpen(true);
              }}
              className="flex items-center gap-1.5 hover:text-[#275B86] transition-colors py-1 cursor-pointer"
              title="Build a server / workstation configuration request (subject to confirmation)"
            >
              <Server className="w-3.5 h-3.5 text-[#275B86]" />
              <span>Server Config</span>
              <span className="text-[10px] bg-amber-500/15 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                Request
              </span>
            </button>

            {/* Warranty SLA Lookup */}
            <button
              type="button"
              onClick={() => setIsWarrantyModalOpen(true)}
              className="flex items-center gap-1.5 hover:text-[#275B86] transition-colors py-1 cursor-pointer"
              title="Warranty lookup demo (sample records only)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Warranty (demo)</span>
            </button>

            {currentRole !== 'viewer' ? (
              <button
                onClick={() => setCurrentView('admin')}
                className={`flex items-center gap-1.5 hover:text-[#275B86] transition-colors py-1 relative ${
                  currentView === 'admin' ? 'text-[#275B86] font-semibold' : ''
                }`}
              >
                <span>Staff Workspace</span>
                <span className="text-[10px] bg-[#10283D] text-white px-1.5 py-0.5 rounded font-mono font-normal">
                  /admin
                </span>
                {currentView === 'admin' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#275B86] rounded-full" />
                )}
              </button>
            ) : (
              <span
                className="text-xs text-slate-400 cursor-not-allowed"
                title="Switch demo role to Owner, PM or Stock Editor to access staff workspace"
              >
                Staff (Viewer Mode)
              </span>
            )}
          </nav>

          {/* Right Action: Saved for Later & Quotation Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentView === 'admin' && (
              <button
                onClick={() => setCurrentView('store')}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-[#275B86] hover:bg-[#F7FAFD] border border-[#DCE7EF] px-3 py-2 rounded-md transition-colors"
              >
                <span>View Storefront</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Compare Matrix Button */}
            <button
              type="button"
              onClick={() => setIsCompareModalOpen(true)}
              className={`relative inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-semibold rounded-md transition-all shadow-2xs border focus:outline-none focus:ring-2 focus:ring-[#489DCA] cursor-pointer ${
                compareProductIds.length > 0
                  ? 'bg-[#EBF3F8] text-[#275B86] border-[#275B86]/40 hover:bg-[#DCE7EF]'
                  : 'bg-white text-[#183B57] border-[#DCE7EF] hover:bg-[#F7FAFD] hover:text-[#275B86]'
              }`}
              title="Open Side-by-Side Product Comparison Matrix"
              aria-label={`Compare Products (${compareProductIds.length} items)`}
            >
              <Scale className="w-4 h-4 text-[#275B86]" />
              <span className="hidden sm:inline">Compare</span>
              {compareProductIds.length > 0 && (
                <span className="inline-flex items-center justify-center text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#275B86] text-white font-mono">
                  {compareProductIds.length}
                </span>
              )}
            </button>

            {/* Saved for Later Bookmark Button */}
            <button
              type="button"
              onClick={() => setIsSavedDrawerOpen(true)}
              className={`relative inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-md transition-all shadow-2xs border focus:outline-none focus:ring-2 focus:ring-[#489DCA] ${
                savedProductIds.length > 0
                  ? 'bg-[#EBF3F8] text-[#275B86] border-[#275B86]/30 hover:bg-[#DCE7EF] hover:border-[#275B86]'
                  : 'bg-white text-[#183B57] border-[#DCE7EF] hover:bg-[#F7FAFD] hover:text-[#275B86]'
              }`}
              aria-label={`Saved for Later (${savedProductIds.length} items)`}
              title="View Saved for Later products"
            >
              <Bookmark
                className={`w-4 h-4 transition-colors ${
                  savedProductIds.length > 0 ? 'fill-[#275B86] text-[#275B86]' : 'text-slate-500'
                }`}
              />
              <span className="hidden sm:inline">Saved</span>
              {savedProductIds.length > 0 && (
                <span className="inline-flex items-center justify-center text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#275B86] text-white font-mono">
                  {savedProductIds.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsQuoteDrawerOpen(true)}
              className="relative inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#275B86] hover:bg-[#10283D] rounded-md transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#489DCA] focus:ring-offset-2"
              aria-label={`View quotation list with ${totalQuoteCount} items`}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Quotation List</span>
              <span className="sm:hidden">Quote</span>
              <span
                className={`inline-flex items-center justify-center text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  totalQuoteCount > 0 ? 'bg-[#489DCA] text-white' : 'bg-white/20 text-white'
                }`}
              >
                {totalQuoteCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      <ResetDemoDialog isOpen={resetConfirmOpen} onClose={() => setResetConfirmOpen(false)} />
    </>
  );
};
