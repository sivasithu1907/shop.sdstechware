import React, { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { BUSINESS } from '../../config/business';
import { ResetDemoDialog } from './ResetDemoDialog';
import { Mail, Phone, MapPin, ShieldCheck, RotateCcw } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setCurrentView, currentRole, setDemoRole } = useStore();
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <footer className="bg-white border-t border-[#DCE7EF] mt-16 text-[#183B57]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div>
              <span className="text-lg font-bold tracking-tight text-[#10283D]">
                SDS TECHWARE
              </span>
              <span className="block text-[10px] tracking-[0.2em] font-semibold text-[#62798C] -mt-0.5">
                IT SOLUTIONS &amp; SUPPLIES
              </span>
            </div>
            <p className="text-xs text-[#62798C] max-w-md leading-relaxed">
              {BUSINESS.summary}
            </p>
            <div className="pt-2 text-[11px] text-slate-400">
              {BUSINESS.legalName.value} · Website prototype
            </div>
          </div>

          {/* Contact Col */}
          <div className="space-y-2 text-xs">
            <h4 className="text-xs font-semibold text-[#10283D] uppercase tracking-wider">
              Direct Contact
            </h4>
            <div className="space-y-1.5 pt-1 text-[#62798C]">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#275B86]" />
                <a href={`mailto:${BUSINESS.salesEmail.value}`} className="hover:text-[#275B86] transition-colors">
                  {BUSINESS.salesEmail.value}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#275B86]" />
                <a href={`tel:${BUSINESS.phone.value.tel}`} className="hover:text-[#275B86] transition-colors">
                  {BUSINESS.phone.value.display}
                </a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#275B86] shrink-0 mt-0.5" />
                <span>{BUSINESS.location.value}</span>
              </div>
            </div>
          </div>

          {/* Prototype Management & Staff */}
          <div className="space-y-2 text-xs">
            <h4 className="text-xs font-semibold text-[#10283D] uppercase tracking-wider">
              Staff &amp; Governance
            </h4>
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  if (currentRole === 'viewer') {
                    setDemoRole('owner');
                  }
                  setCurrentView('admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-1.5 text-xs text-[#275B86] hover:text-[#10283D] font-medium"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Staff Workspace (/admin)</span>
              </button>

              <button
                onClick={() => setResetOpen(true)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Demo Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-[#DCE7EF] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#62798C]">
          <div>
            © {new Date().getFullYear()} {BUSINESS.legalName.value} All rights reserved.
          </div>
          <div className="text-[11px] text-slate-400 text-center sm:text-right">
            Prototype with sample catalogue data stored in your browser. Not confirmed SDS inventory, pricing or services.
          </div>
        </div>
      </div>
      <ResetDemoDialog isOpen={resetOpen} onClose={() => setResetOpen(false)} />
    </footer>
  );
};
