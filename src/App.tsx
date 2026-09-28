import React, { useEffect } from 'react';
import { StoreProvider, useStore } from './store/StoreContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { Breadcrumbs } from './components/common/Breadcrumbs';
import { FeatureBanner } from './components/storefront/FeatureBanner';
import { CatalogLayout } from './components/storefront/CatalogLayout';
import { ProductDetailModal } from './components/storefront/ProductDetailModal';
import { QuickViewModal } from './components/storefront/QuickViewModal';
import { QuotationDrawer } from './components/storefront/QuotationDrawer';
import { SavedForLaterDrawer } from './components/storefront/SavedForLaterDrawer';
import { ProductCompareModal } from './components/storefront/ProductCompareModal';
import { CompareBar } from './components/storefront/CompareBar';
import { ServerConfiguratorModal } from './components/storefront/ServerConfiguratorModal';
import { WarrantyLookupModal } from './components/storefront/WarrantyLookupModal';
import { LiveSupportWidget } from './components/storefront/LiveSupportWidget';
import { StaffWorkspace } from './components/admin/StaffWorkspace';
import { Check } from 'lucide-react';

const MainApp: React.FC = () => {
  const { currentView, setCurrentView, toastMessage } = useStore();

  // Listen to browser path changes or initialize /admin route if accessed directly
  useEffect(() => {
    if (window.location.pathname === '/admin') {
      setCurrentView('admin');
    }
    const handlePopState = () => {
      if (window.location.pathname === '/admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('store');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setCurrentView]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7FAFD] text-[#183B57]">
      {/* Top Strip and Main Sticky Header */}
      <Header />

      {/* Main View Router */}
      <div className="flex-1">
        {currentView === 'store' ? (
          <>
            {/* Dynamic Breadcrumbs Navigation Trail below the Header */}
            <Breadcrumbs />

            {/* Compact Feature Banner (250-280px tall) */}
            <FeatureBanner />

            {/* Catalog Layout (Category Sidebar + Products Area) */}
            <CatalogLayout />

            {/* Scripted demo assistant (not a live chat) */}
            <LiveSupportWidget />
          </>
        ) : (
          /* Staff Workspace at /admin */
          <StaffWorkspace />
        )}
      </div>

      {/* Product Details Modal / Drawer */}
      <ProductDetailModal />

      {/* Lightweight Quick View Pop-up Preview */}
      <QuickViewModal />

      {/* Product Compare Matrix Modal */}
      <ProductCompareModal />

      {/* Server & workstation configuration request (not validated, no prices) */}
      <ServerConfiguratorModal />

      {/* Warranty lookup (demo records only) */}
      <WarrantyLookupModal />

      {/* Floating Compare Tray Bar */}
      <CompareBar />

      {/* Quotation List Slide-over Drawer */}
      <QuotationDrawer />

      {/* Saved for Later Slide-over Drawer */}
      <SavedForLaterDrawer />

      {/* Global Toast Notification */}
      <div aria-live="polite" className="sr-only">
        {toastMessage ?? ''}
      </div>
      {toastMessage && (
        <div
          className="fixed bottom-20 right-6 z-60 flex items-center gap-2.5 bg-[#10283D] text-white px-4 py-3 rounded-lg shadow-2xl border border-[#489DCA]/40 text-xs font-medium max-w-sm transition-all animate-bounce-subtle"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span className="flex-1 leading-snug">{toastMessage}</span>
        </div>
      )}

      {/* Compact Footer */}
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainApp />
    </StoreProvider>
  );
}
