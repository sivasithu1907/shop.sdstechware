import React, { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import type { Product } from '../../types';
import { computeWarrantyStatus, DEMO_WARRANTY_RECORDS, warrantyElapsedPercent } from '../../features/warranty/demoWarrantyRecords';
import { useDialog } from '../../hooks/useDialog';
import {
  ShieldCheck,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  Printer,
  Layers,
  Wrench,
  X,
  Plus,
  Building,
} from 'lucide-react';

export const WarrantyLookupModal: React.FC = () => {
  const {
    isWarrantyModalOpen,
    setIsWarrantyModalOpen,
    addToQuote,
    setIsQuoteDrawerOpen,
    showToast,
  } = useStore();

  const [inputSerial, setInputSerial] = useState('DELL-8X92KF3');
  const [searchedTag, setSearchedTag] = useState<string>('DELL-8X92KF3');
  const [searchError, setSearchError] = useState('');

  const dialogRef = useDialog<HTMLDivElement>(isWarrantyModalOpen, () => setIsWarrantyModalOpen(false));

  if (!isWarrantyModalOpen) return null;

  const baseRecord = DEMO_WARRANTY_RECORDS[searchedTag.toUpperCase().trim()] || null;
  // Status is computed from today's date so sample records never show stale "active" states.
  const currentRecord = baseRecord ? { ...baseRecord, ...computeWarrantyStatus(baseRecord.warrantyEnd) } : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = inputSerial.trim().toUpperCase();
    if (!tag) {
      setSearchError('Please enter a valid serial number or Service Tag.');
      return;
    }
    setSearchError('');
    setSearchedTag(tag);
  };

  const handleSelectSample = (sampleKey: string) => {
    setInputSerial(sampleKey);
    setSearchedTag(sampleKey);
    setSearchError('');
  };

  const handleAddRenewalToQuote = () => {
    if (!currentRecord) return;
    // Enquiry only: no price, no stock and no availability are implied.
    const renewalProduct: Product = {
      id: `prod-renewal-${Date.now()}`,
      model: `${currentRecord.brand} warranty / support extension enquiry`,
      name: `${currentRecord.brand} warranty extension enquiry for ${currentRecord.serial}`,
      brand: currentRecord.brand,
      category: 'Warranty & Support Enquiry',
      sku: `ENQ-${currentRecord.serial}`,
      shortDescription: `Enquiry about extending support for ${currentRecord.model} (serial ${currentRecord.serial}). Eligibility, terms and price to be confirmed.`,
      description: 'Warranty extension enquiry created from the demo warranty lookup. Eligibility, coverage and pricing must be confirmed with SDS Techware and the manufacturer.',
      price: null,
      isPricePublic: false,
      stock: null,
      isPublished: true,
      isArchived: false,
      images: [],
      specifications: [
        { key: 'Asset serial / tag', value: currentRecord.serial },
        { key: 'Hardware model', value: currentRecord.model },
        { key: 'Request', value: 'Warranty / support extension — subject to eligibility and confirmation' },
        { key: 'Source', value: 'Demo warranty lookup (sample record)' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addToQuote(renewalProduct, 1);
    showToast(`Added a warranty extension enquiry for ${currentRecord.serial} to your quotation list.`);
    setIsWarrantyModalOpen(false);
    setIsQuoteDrawerOpen(true);
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-[#10283D]/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn"
      onClick={() => setIsWarrantyModalOpen(false)}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Warranty lookup (demo)"
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-2xl border border-[#DCE7EF] w-full max-w-4xl max-h-[92vh] flex flex-col text-[#183B57] overflow-hidden focus:outline-none"
      >
        {/* Header */}
        <div className="bg-[#10283D] text-white px-5 py-4 flex items-center justify-between border-b border-[#275B86]/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#275B86] to-[#489DCA] flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Warranty Lookup
                </h2>
                <span className="bg-amber-400/20 text-amber-200 text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-300/40 font-semibold">
                  Demo — sample records only
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Preview of a future warranty lookup. Only the fictional sample tags below exist; no manufacturer or distributor is contacted.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsWarrantyModalOpen(false)}
            aria-label="Close Warranty Lookup"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Sample Pills */}
        <div className="bg-[#F7FAFD] px-5 py-4 border-b border-[#DCE7EF] shrink-0 space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inputSerial}
                onChange={e => setInputSerial(e.target.value)}
                placeholder="Enter Dell Service Tag, HP Serial, Lenovo Serial (e.g. DELL-8X92KF3)..."
                className="w-full bg-white border border-slate-300 focus:border-[#275B86] focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 font-mono transition-all shadow-2xs"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#275B86] hover:bg-[#10283D] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Look up (demo)</span>
            </button>
          </form>

          {/* Quick Sample Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-semibold text-slate-500 shrink-0">Sample Tags:</span>
            {Object.keys(DEMO_WARRANTY_RECORDS).map(key => {
              const rec = DEMO_WARRANTY_RECORDS[key];
              const isSelected = key === searchedTag;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectSample(key)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-mono transition-all shrink-0 cursor-pointer border ${
                    isSelected
                      ? 'bg-[#275B86] text-white border-[#275B86] font-bold shadow-2xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {rec.brand}: {key}
                </button>
              );
            })}
          </div>

          {searchError && (
            <p className="text-xs text-rose-600 font-medium">{searchError}</p>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {currentRecord ? (
            <div id="printable-warranty-record" className="print-area">
            <div className="space-y-6">
              {/* Top Status Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#275B86] bg-[#EBF3F8] px-2 py-0.5 rounded">
                        {currentRecord.category}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-600">SN: {currentRecord.serial}</span>
                    </div>
                    <h3 className="text-base font-bold text-[#10283D] mt-1">{currentRecord.model}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{currentRecord.distributor}</span>
                    </p>
                  </div>

                  <div className="self-start sm:self-auto flex items-center gap-2">
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-1 rounded-lg text-[10px]">DEMO RECORD</span>
                    {currentRecord.status !== 'expired' ? (
                      <span className="bg-emerald-500/15 text-emerald-700 border border-emerald-300 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        {currentRecord.status === 'expiring' ? 'Sample: expiring soon' : 'Sample: in coverage'}
                      </span>
                    ) : (
                      <span className="bg-rose-500/15 text-rose-700 border border-rose-300 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        Sample: expired
                      </span>
                    )}
                  </div>
                </div>

                {/* Days remaining bar */}
                <div className="bg-[#F7FAFD] rounded-xl p-3.5 border border-[#DCE7EF] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Warranty Horizon:</span>
                    <span className="font-mono font-bold text-[#10283D]">
                      {currentRecord.status !== 'expired' ? `${currentRecord.daysRemaining} days remaining` : 'Expired'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        currentRecord.status === 'active' ? 'bg-[#275B86]' : currentRecord.status === 'expiring' ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${warrantyElapsedPercent(currentRecord.warrantyStart, currentRecord.warrantyEnd)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Started: {currentRecord.warrantyStart}</span>
                    <span>Expires: {currentRecord.warrantyEnd}</span>
                  </div>
                </div>

                {/* Key SLA metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Contracted SLA Response</span>
                    <strong className="text-xs text-[#10283D] block mt-0.5 font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#275B86]" />
                      {currentRecord.slaResponseTime}
                    </strong>
                    <p className="text-[11px] text-slate-500 mt-1">{currentRecord.slaTier}</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Data Protection Entitlement</span>
                    <strong className="text-xs text-[#10283D] block mt-0.5 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {currentRecord.keepYourHardDrive ? 'Keep Your Hard Drive (KYHD) Included' : 'Standard Return Required'}
                    </strong>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {currentRecord.keepYourHardDrive
                        ? 'Customer retains defective storage media for compliance upon replacement dispatch.'
                        : 'Defective parts returned to manufacturer authorized depot.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Covered Components */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-[#10283D] uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#275B86]" />
                  Authorized Hardware Coverage Breakdown
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentRecord.coveredItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 border border-slate-200/80 p-2.5 rounded-lg">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service & Diagnostic History */}
              {currentRecord.serviceHistory.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-[#10283D] uppercase tracking-wider flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-[#275B86]" />
                    Distributor Maintenance &amp; Dispatch History
                  </h4>
                  <div className="space-y-2">
                    {currentRecord.serviceHistory.map((rec, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-lg border border-slate-200/70">
                        <div>
                          <span className="font-semibold text-slate-800">{rec.description}</span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">{rec.date}</span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          {rec.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            </div>
          ) : (
            <div className="py-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#10283D]">No sample record for this serial</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                &quot;{searchedTag}&quot; is not one of the demo records. This prototype cannot check real warranties — please check with
                the manufacturer or contact SDS Techware with your serial number.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleSelectSample('DELL-8X92KF3')}
                  className="px-4 py-2 bg-[#275B86] hover:bg-[#10283D] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Load Sample Dell PowerEdge Server Tag
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#F7FAFD] px-5 py-4 border-t border-[#DCE7EF] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500">
            Demo data only. Real warranty status must be confirmed with the manufacturer or SDS Techware.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrintCertificate}
              className="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print (demo record)</span>
            </button>

            {currentRecord && (
              <button
                type="button"
                onClick={handleAddRenewalToQuote}
                className="flex-1 sm:flex-initial px-4 py-2 bg-[#275B86] hover:bg-[#10283D] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ask about an extension</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
