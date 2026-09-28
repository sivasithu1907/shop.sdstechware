import React, { useState } from 'react';
import type { QuoteItem } from '../../types';
import { computeQuoteTotals } from '../../features/quotation/quoteItems';
import { createQuoteReference } from '../../features/quotation/quotationText';
import { getPublicPrice } from '../../features/catalog/pricing';
import { BUSINESS, QUOTATION_ENQUIRY_TERMS } from '../../config/business';
import { formatLKR } from '../../lib/format';
import { useDialog } from '../../hooks/useDialog';
import { X, Printer, Download, Check, FileText, Building2, Phone, Mail, User, ShieldCheck } from 'lucide-react';

interface QuotationPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteItems: QuoteItem[];
  customerInfo: {
    name: string;
    company: string;
    phone: string;
    email: string;
    notes: string;
  };
}

export const QuotationPrintModal: React.FC<QuotationPrintModalProps> = ({
  isOpen,
  onClose,
  quoteItems,
  customerInfo,
}) => {
  const totals = computeQuoteTotals(quoteItems);
  const allItemsHavePublicPrice = totals.allLinesPriced;
  const indicativeSubtotal = totals.pricedSubtotal;
  const [pdfError, setPdfError] = useState<string | null>(null);
  const dialogRef = useDialog<HTMLDivElement>(isOpen, onClose);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [quoteReference] = useState(() => createQuoteReference());

  const currentDateStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  if (!isOpen) return null;

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      // jsPDF is loaded on demand to keep the main bundle small.
      const { generateQuotationPDF } = await import('../../features/quotation/generateQuotationPdf');
      const doc = generateQuotationPDF({
        quoteItems,
        customerInfo,
        quoteReference,
      });

      const fileName = `SDS-Techware-Enquiry-${quoteReference}.pdf`;
      doc.save(fileName);
      setPdfError(null);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setPdfError('The PDF could not be generated. Please use Print instead.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const totalQuantity = quoteItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="fixed inset-0 z-70 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#10283D]/70 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-6 text-center">
        {/* Modal Card */}
        <div
          ref={dialogRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Quotation enquiry preview"
          className="focus:outline-none relative w-full max-w-4xl transform rounded-xl bg-white text-left shadow-2xl border border-[#DCE7EF] my-4 overflow-hidden flex flex-col max-h-[92vh]"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Header / Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[#10283D] text-white border-b border-[#275B86]/40 shrink-0">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-[#489DCA]" />
              <div>
                <h3 className="text-sm font-bold tracking-wide">
                  Printable Quotation Document
                </h3>
                <span className="text-[11px] text-[#DCE7EF] font-mono">
                  {quoteReference}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Direct PDF Download Button */}
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={downloading}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold shadow-xs transition-all ${
                  downloadSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#489DCA] hover:bg-[#3b8db8] text-white'
                }`}
                title="Download formatted PDF document"
              >
                {downloadSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>PDF Downloaded!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloading ? 'Generating...' : 'Download PDF (.pdf)'}</span>
                  </>
                )}
              </button>

              {/* Print Document Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
                title="Print or Save via system dialog"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors ml-1"
                aria-label="Close Preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Printable Document Body (A4 sheet preview) */}
          <div className="overflow-y-auto p-4 sm:p-8 bg-[#F1F5F9] flex-1">
            <div
              id="printable-quotation-sheet"
              className="max-w-[780px] mx-auto bg-white p-6 sm:p-10 rounded-lg shadow-sm border border-[#DCE7EF] space-y-6 text-[#183B57]"
            >
              {/* Document Letterhead */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#DCE7EF]">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#10283D]">
                    {BUSINESS.brandName}
                  </h1>
                  <span className="text-[11px] font-bold text-[#275B86] tracking-wider block">
                    {BUSINESS.tagline}
                  </span>
                  <p className="text-xs text-[#62798C] mt-1">
                    {BUSINESS.legalName.value}
                  </p>
                </div>

                <div className="text-left sm:text-right text-xs text-[#62798C] space-y-0.5">
                  <p className="font-semibold text-[#183B57]">{BUSINESS.location.value}</p>
                  <p>Email: {BUSINESS.salesEmail.value}</p>
                  <p>Phone: {BUSINESS.phone.value.display}</p>
                  {BUSINESS.companyRegistrationNo.confirmed && BUSINESS.companyRegistrationNo.value && (
                    <p className="text-[10px] text-slate-400">Co. Reg: {BUSINESS.companyRegistrationNo.value}</p>
                  )}
                </div>
              </div>

              {/* Quotation Reference & Customer Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F7FAFD] p-4 rounded-lg border border-[#DCE7EF]">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#275B86] uppercase tracking-wider block">
                    Document Metadata
                  </span>
                  <h2 className="text-sm font-bold text-[#10283D]">
                    QUOTATION ENQUIRY (NOT A QUOTATION)
                  </h2>
                  <p className="text-xs text-[#183B57]">
                    <span className="font-semibold text-[#62798C]">Reference:</span>{' '}
                    <span className="font-mono">{quoteReference}</span>
                  </p>
                  <p className="text-xs text-[#183B57]">
                    <span className="font-semibold text-[#62798C]">Prepared on:</span> {currentDateStr}
                  </p>
                  <p className="text-xs text-[#183B57]">
                    <span className="font-semibold text-[#62798C]">Status:</span> Awaiting formal quotation from SDS Techware
                  </p>
                </div>

                <div className="space-y-1 sm:border-l sm:border-[#DCE7EF] sm:pl-4">
                  <span className="text-[10px] font-bold text-[#275B86] uppercase tracking-wider block">
                    Prepared For (Client)
                  </span>
                  <div className="text-xs space-y-0.5">
                    <p className="font-semibold text-[#10283D] flex items-center gap-1.5">
                      <User className="w-3 h-3 text-[#275B86]" />
                      <span>{customerInfo.name || 'Name not provided'}</span>
                    </p>
                    {customerInfo.company && (
                      <p className="text-[#183B57] flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-[#62798C]" />
                        <span>{customerInfo.company}</span>
                      </p>
                    )}
                    {customerInfo.phone && (
                      <p className="text-[#183B57] flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-[#62798C]" />
                        <span>{customerInfo.phone}</span>
                      </p>
                    )}
                    {customerInfo.email && (
                      <p className="text-[#183B57] flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-[#62798C]" />
                        <span>{customerInfo.email}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto border border-[#DCE7EF] rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#275B86] text-white">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold text-center w-8">#</th>
                      <th className="py-2.5 px-3 font-semibold">Item &amp; Description</th>
                      <th className="py-2.5 px-3 font-semibold">SKU</th>
                      <th className="py-2.5 px-3 font-semibold text-center w-14">Qty</th>
                      <th className="py-2.5 px-3 font-semibold text-right w-28">Unit Price</th>
                      <th className="py-2.5 px-3 font-semibold text-right w-32">Total (LKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE7EF]">
                    {quoteItems.map((item, index) => {
                      const publicPrice = getPublicPrice(item.product);
                      return (
                        <tr key={item.productId} className={index % 2 === 0 ? 'bg-white' : 'bg-[#F7FAFD]'}>
                          <td className="py-2.5 px-3 text-center text-[#62798C] font-medium">{index + 1}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-[#10283D] block">{item.product.model}</span>
                            <span className="text-[11px] text-[#62798C] block">
                              {item.product.brand} · {item.product.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-[#183B57]">{item.product.sku}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-[#10283D]">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right tabular-nums">
                            {publicPrice !== null ? (
                              formatLKR(publicPrice)
                            ) : (
                              <span className="text-[11px] text-[#275B86] italic">On request</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#10283D] tabular-nums">
                            {publicPrice !== null ? (
                              formatLKR(publicPrice * item.quantity)
                            ) : (
                              <span className="text-[11px] text-[#275B86] italic font-normal">Price on Request</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals & Breakdown */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="space-y-1 text-xs text-[#62798C] max-w-sm">
                  <div className="flex items-center gap-1.5 text-[#183B57] font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#275B86]" />
                    <span>Warranty &amp; availability</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Warranty coverage, availability and delivery are confirmed by SDS Techware in the formal quotation.
                  </p>
                </div>

                <div className="w-full sm:w-72 bg-[#F7FAFD] border border-[#DCE7EF] rounded-lg p-3.5 space-y-2">
                  <div className="flex justify-between text-xs text-[#62798C]">
                    <span>Total Items:</span>
                    <span className="font-semibold text-[#183B57]">{totalQuantity} units</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#62798C]">
                    <span>Line Items:</span>
                    <span className="font-semibold text-[#183B57]">{quoteItems.length} items</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#62798C] pt-1 border-t border-[#DCE7EF]">
                    <span>Indicative Subtotal:</span>
                    <span className="font-bold text-[#10283D]">
                      {allItemsHavePublicPrice ? formatLKR(indicativeSubtotal) : 'Not available'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-[#10283D] pt-1.5 border-t border-[#DCE7EF]">
                    <span>Estimated Total:</span>
                    <span className="text-[#275B86]">
                      {allItemsHavePublicPrice ? formatLKR(indicativeSubtotal) : 'In formal quotation'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 text-right">
                    Indicative; taxes confirmed in the formal quotation
                  </p>
                </div>
              </div>

              {/* Customer Notes (if entered) */}
              {customerInfo.notes && customerInfo.notes.trim() && (
                <div className="bg-white border border-[#DCE7EF] rounded-lg p-3.5 space-y-1">
                  <span className="text-[10px] font-bold text-[#275B86] uppercase tracking-wider block">
                    Customer Project Requirements / Specifications:
                  </span>
                  <p className="text-xs text-[#183B57] whitespace-pre-wrap leading-relaxed">
                    {customerInfo.notes.trim()}
                  </p>
                </div>
              )}

              {/* Enquiry notes (src/config/business.ts) */}
              <div className="border-t border-[#DCE7EF] pt-4 space-y-1.5 text-[11px] text-[#62798C]">
                <span className="font-bold text-[#183B57] block text-xs">Important notes:</span>
                {QUOTATION_ENQUIRY_TERMS.map((t, i) => (
                  <p key={i}>
                    {i + 1}. {t}
                  </p>
                ))}
              </div>

              {/* Sign-off Strip */}
              <div className="border-t border-[#DCE7EF] pt-4 flex flex-col sm:flex-row justify-between items-center text-xs text-[#62798C] gap-2">
                <span>{BUSINESS.legalName.value} · {BUSINESS.country}</span>
                <span className="text-[10px] text-slate-400">Customer-prepared enquiry (website prototype)</span>
              </div>
            </div>
          </div>

          {/* Footer toolbar */}
          <div className="px-5 py-3 bg-[#F7FAFD] border-t border-[#DCE7EF] flex items-center justify-between shrink-0">
            <span className="text-xs text-[#62798C]">
              {pdfError ? <span className="text-red-600">{pdfError}</span> : <>Questions? Call <strong>{BUSINESS.phone.value.display}</strong></>}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-md text-xs font-semibold text-[#183B57] hover:bg-slate-200/70 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
