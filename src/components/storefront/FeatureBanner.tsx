import React from 'react';
import { useStore } from '../../store/StoreContext';
import { ArrowRight, Server, ShieldCheck } from 'lucide-react';

export const FeatureBanner: React.FC = () => {
  const { setSelectedProductId, publishedProducts, setIsConfiguratorOpen, setIsWarrantyModalOpen } = useStore();

  // First published featured product that has an image (falls back to any published product with an image).
  const featuredProduct =
    publishedProducts.find(p => p.isFeatured && p.images.length > 0) ?? publishedProducts.find(p => p.images.length > 0);
  const caption = featuredProduct ? featuredProduct.featuredCaption || featuredProduct.name || featuredProduct.model : '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#10283D] via-[#163854] to-[#275B86] text-white border border-[#10283D] min-h-[250px] md:h-[270px] flex items-center shadow-sm">
        {/* Subtle geometric background line decoration */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-12 -right-12 w-96 h-96 rounded-full border border-white/40" />
          <div className="absolute top-1/2 right-1/4 w-64 h-64 rounded-full border border-white/20" />
        </div>

        <div className="relative z-10 w-full grid grid-cols-1 md:grid-cols-12 gap-6 p-6 sm:p-8 items-center">
          {/* Left Side: Editorial Typography */}
          <div className="md:col-span-7 space-y-3">
            <span className="inline-block text-[11px] font-bold tracking-[0.25em] text-[#489DCA] uppercase">
              THE SDS COLLECTION
            </span>

            <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold tracking-tight text-white leading-tight text-balance">
              Good tech. A better everyday.
            </h1>

            <p className="text-sm text-slate-300 max-w-md leading-relaxed font-normal">
              Considered essentials for the way you work. Business-ready hardware, genuine supplies, and dependable infrastructure for modern teams.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => featuredProduct && setSelectedProductId(featuredProduct.id)}
                className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/20 px-3.5 py-2 rounded-md transition-all group cursor-pointer"
              >
                <span>Explore Featured Product</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => setIsConfiguratorOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#10283D] bg-white hover:bg-slate-100 px-3.5 py-2 rounded-md transition-all shadow-xs cursor-pointer"
              >
                <Server className="w-3.5 h-3.5 text-[#275B86]" />
                <span>Server config request</span>
              </button>

              <button
                type="button"
                onClick={() => setIsWarrantyModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-black/25 hover:bg-black/35 border border-white/15 px-3 py-2 rounded-md transition-all cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Warranty lookup (demo)</span>
              </button>
            </div>
          </div>

          {/* Right Side: Product Image & Caption */}
          {featuredProduct && (
            <div className="md:col-span-5 flex flex-col items-center md:items-end justify-center relative">
              <button
                type="button"
                onClick={() => setSelectedProductId(featuredProduct.id)}
                className="group cursor-pointer relative max-w-[340px] w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#489DCA] rounded-lg"
                aria-label={`View details: ${caption}`}
              >
                <div className="relative overflow-hidden rounded-lg bg-black/20 p-1 border border-white/10 shadow-lg group-hover:border-white/30 transition-all">
                  <img
                    src={featuredProduct.images[0]}
                    alt={caption}
                    className="w-full h-36 sm:h-40 object-cover rounded transform group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-300 px-1">
                  <span className="font-medium text-white/90">{caption}</span>
                  <span className="text-[10px] text-[#489DCA] group-hover:underline">View specs</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
