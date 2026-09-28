import React, { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { X, Trash2, Plus, Minus, Copy, Check, MessageSquare, AlertCircle, ShoppingBag, Download, Printer } from 'lucide-react';
import { buildEnquiryText, buildWhatsAppText, createQuoteReference } from '../../features/quotation/quotationText';
import { getPublicPrice } from '../../features/catalog/pricing';
import { copyText } from '../../lib/download';
import { LIMITS } from '../../config/settings';
import { useDialog } from '../../hooks/useDialog';
import { QuotationPrintModal } from './QuotationPrintModal';

export const QuotationDrawer: React.FC = () => {
  const {
    quoteItems,
    updateQuoteQty,
    removeFromQuote,
    clearQuote,
    isQuoteDrawerOpen,
    setIsQuoteDrawerOpen,
    formatLKR,
    quoteTotals,
    showToast,
  } = useStore();

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    notes: '',
  });

  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [whatsAppPreviewOpen, setWhatsAppPreviewOpen] = useState(false);
  const [whatsAppCopied, setWhatsAppCopied] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [pdfDownloadSuccess, setPdfDownloadSuccess] = useState(false);

  const dialogRef = useDialog<HTMLDivElement>(isQuoteDrawerOpen && !isPrintModalOpen, () => setIsQuoteDrawerOpen(false));

  if (!isQuoteDrawerOpen) return null;

  // Totals use public prices only; a total is shown only when every line is priced.
  const allItemsHavePublicPrice = quoteTotals.allLinesPriced;
  const indicativeSubtotal = quoteTotals.pricedSubtotal;

  const handleDirectDownloadPDF = async () => {
    setPdfDownloading(true);
    try {
      // jsPDF is loaded on demand to keep the main bundle small.
      const { generateQuotationPDF } = await import('../../features/quotation/generateQuotationPdf');
      const quoteRef = createQuoteReference();
      const doc = generateQuotationPDF({ quoteItems, customerInfo, quoteReference: quoteRef });
      doc.save(`SDS-Techware-Enquiry-${quoteRef}.pdf`);
      setPdfDownloadSuccess(true);
      setTimeout(() => setPdfDownloadSuccess(false), 2200);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      showToast('The PDF could not be generated. Please try Print / Preview instead.');
    } finally {
      setPdfDownloading(false);
    }
  };

  const generateFormattedEnquiry = () => buildEnquiryText(quoteItems, customerInfo);
  const generateWhatsAppMessage = () => buildWhatsAppText(quoteItems, customerInfo);

  const handleCopyEnquiry = async () => {
    if (await copyText(generateFormattedEnquiry())) {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2000);
    } else {
      showToast('Could not copy to the clipboard. Please use Print / Preview instead.');
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 overflow-hidden bg-[#10283D]/50 backdrop-blur-xs flex justify-end"
        onClick={() => setIsQuoteDrawerOpen(false)}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="quote-drawer-title"
          tabIndex={-1}
          onClick={e => e.stopPropagation()}
          className="focus:outline-none w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between text-[#183B57] animate-slideInRight"
        >
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-[#DCE7EF] flex items-center justify-between bg-[#F7FAFD]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#275B86]" />
              <h2 id="quote-drawer-title" className="text-base font-bold text-[#10283D]">
                Quotation Request List
              </h2>
              <span className="text-xs bg-[#275B86] text-white px-2 py-0.5 rounded-full font-bold">
                {quoteItems.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
            </div>

            <button
              onClick={() => setIsQuoteDrawerOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-[#183B57] hover:bg-slate-200/60 transition-colors"
              aria-label="Close quotation drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
            {quoteItems.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[#10283D]">Your quotation list is empty</h3>
                <p className="text-xs text-[#62798C] max-w-xs mx-auto">
                  Browse products in the catalog and click "Add to Quote" to build your requirement enquiry.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setIsQuoteDrawerOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#275B86] hover:bg-[#10283D] rounded-md transition-colors"
                  >
                    Continue Browsing
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Items List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#62798C] pb-1 border-b border-[#DCE7EF]">
                    <span>Product &amp; Specifications</span>
                    <button
                      onClick={clearQuote}
                      className="text-red-600 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear list
                    </button>
                  </div>

                  {quoteItems.map(item => {
                    const publicPrice = getPublicPrice(item.product);
                    const hasPrice = publicPrice !== null;
                    return (
                      <div
                        key={item.productId}
                        className="p-3 bg-[#F7FAFD] rounded-lg border border-[#DCE7EF] flex gap-3 items-center justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] text-[#62798C] font-medium uppercase tracking-wider">
                            {item.product.brand} · {item.product.category}
                          </div>
                          <h4 className="text-xs font-bold text-[#10283D] truncate">
                            {item.product.model}
                          </h4>
                          {!item.isListed && (
                            <div className="text-[10px] text-amber-700">No longer listed in the catalogue — kept from your saved list.</div>
                          )}
                          {item.source === 'custom' && (
                            <div className="text-[10px] text-[#62798C]">Custom request — subject to technical and commercial confirmation.</div>
                          )}
                          <div className="text-[11px] text-[#275B86] mt-0.5">
                            {hasPrice ? (
                              <span className="font-mono font-semibold">
                                {formatLKR((publicPrice ?? 0) * item.quantity)}
                              </span>
                            ) : (
                              <span className="italic text-slate-500">Price on Request</span>
                            )}
                          </div>
                        </div>

                        {/* Quantity Stepper & Remove */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center border border-[#DCE7EF] rounded bg-white">
                            <button
                              onClick={() => updateQuoteQty(item.productId, item.quantity - 1)}
                              className="p-1 text-slate-600 hover:text-[#183B57]"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min={LIMITS.quoteQtyMin}
                              max={LIMITS.quoteQtyMax}
                              step={1}
                              value={item.quantity}
                              onChange={e => {
                                const v = parseInt(e.target.value, 10);
                                if (Number.isFinite(v) && v >= 1) updateQuoteQty(item.productId, v);
                              }}
                              aria-label={`Quantity for ${item.product.model}`}
                              className="w-12 text-xs font-mono font-bold text-[#10283D] text-center bg-transparent focus:outline-none [appearance:textfield]"
                            />
                            <button
                              onClick={() => updateQuoteQty(item.productId, item.quantity + 1)}
                              disabled={item.quantity >= LIMITS.quoteQtyMax}
                              className="p-1 text-slate-600 hover:text-[#183B57]"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromQuote(item.productId)}
                            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                            aria-label="Remove item"
                            title="Remove from quote"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pricing Explanation & Subtotal Notice */}
                <div className="p-3.5 bg-slate-50 rounded-lg border border-[#DCE7EF] space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-[#275B86] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#10283D]">
                        Quotation-Based Process:
                      </span>{' '}
                      <span className="text-[#62798C]">
                        Prices shown are indicative and only appear where SDS Techware has published them. Final pricing, availability and warranty are confirmed by SDS Techware in a formal quotation. This app does not send your enquiry — use Download, Print or Copy and send it yourself.
                      </span>
                    </div>
                  </div>

                  {allItemsHavePublicPrice ? (
                    <div className="pt-2 border-t border-[#DCE7EF] flex items-center justify-between text-xs">
                      <span className="font-medium text-[#183B57]">Indicative Total:</span>
                      <span className="font-bold font-mono text-sm text-[#10283D]">
                        {formatLKR(indicativeSubtotal)}
                      </span>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-[#DCE7EF] text-[11px] text-[#62798C] italic">
                      * One or more items are Price on Request, so no total is shown. Pricing will be itemised in the formal quotation.
                    </div>
                  )}
                </div>

                {/* Customer Details Form */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-[#10283D] uppercase tracking-wider">
                    Customer &amp; Organization Details (Optional)
                  </h3>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] text-[#62798C] mb-1">Your Name</label>
                      <input
                        type="text"
                        value={customerInfo.name}
                        onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                        placeholder="e.g. Ruwan Silva"
                        className="w-full px-2.5 py-1.5 border border-[#DCE7EF] rounded bg-[#F7FAFD] text-[#183B57] focus:outline-none focus:border-[#275B86]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#62798C] mb-1">Company / Organization</label>
                      <input
                        type="text"
                        value={customerInfo.company}
                        onChange={e => setCustomerInfo({ ...customerInfo, company: e.target.value })}
                        placeholder="e.g. Lanka Tech Ltd"
                        className="w-full px-2.5 py-1.5 border border-[#DCE7EF] rounded bg-[#F7FAFD] text-[#183B57] focus:outline-none focus:border-[#275B86]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#62798C] mb-1">Phone / Mobile</label>
                      <input
                        type="text"
                        value={customerInfo.phone}
                        onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                        placeholder="+94 7X XXX XXXX"
                        className="w-full px-2.5 py-1.5 border border-[#DCE7EF] rounded bg-[#F7FAFD] text-[#183B57] focus:outline-none focus:border-[#275B86]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#62798C] mb-1">Email Address</label>
                      <input
                        type="email"
                        value={customerInfo.email}
                        onChange={e => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                        placeholder="procurement@company.lk"
                        className="w-full px-2.5 py-1.5 border border-[#DCE7EF] rounded bg-[#F7FAFD] text-[#183B57] focus:outline-none focus:border-[#275B86]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#62798C] mb-1">Project Requirements or Delivery Timeline</label>
                    <textarea
                      rows={2}
                      value={customerInfo.notes}
                      onChange={e => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                      placeholder="Specify delivery location, warranty period required, or bulk purchase details..."
                      className="w-full px-2.5 py-1.5 border border-[#DCE7EF] rounded bg-[#F7FAFD] text-[#183B57] text-xs focus:outline-none focus:border-[#275B86]"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Drawer Actions Footer */}
          {quoteItems.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-[#DCE7EF] bg-[#F7FAFD] space-y-2.5">
              {/* Primary PDF Generation & Print Bar */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDirectDownloadPDF}
                  disabled={pdfDownloading}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-xs font-semibold shadow-xs transition-all ${
                    pdfDownloadSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#10283D] hover:bg-[#183B57] text-white'
                  }`}
                  title="Generate and download official PDF quotation enquiry"
                >
                  {pdfDownloadSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>PDF Downloaded!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-[#489DCA]" />
                      <span>{pdfDownloading ? 'Generating PDF...' : 'Download PDF Quotation'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md text-xs font-semibold bg-white border border-[#DCE7EF] hover:border-[#275B86] text-[#183B57] hover:bg-slate-50 transition-colors shadow-xs"
                  title="Open printable quotation document preview"
                >
                  <Printer className="w-4 h-4 text-[#275B86]" />
                  <span className="hidden sm:inline">Print / Preview</span>
                </button>
              </div>

              {/* Secondary Actions: Copy Enquiry & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Copy Formatted Enquiry Button */}
                <button
                  onClick={handleCopyEnquiry}
                  className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-all shadow-xs ${
                    copiedSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#275B86] hover:bg-[#10283D] text-white'
                  }`}
                >
                  {copiedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Text Enquiry</span>
                    </>
                  )}
                </button>

                {/* Preview WhatsApp Enquiry Button */}
                <button
                  onClick={() => setWhatsAppPreviewOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-white border border-[#DCE7EF] hover:border-[#275B86] text-[#183B57] hover:bg-slate-50 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#275B86]" />
                  <span>Preview WhatsApp</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-[#62798C]">
                <button
                  onClick={() => setIsQuoteDrawerOpen(false)}
                  className="hover:underline text-[#275B86]"
                >
                  Continue browsing catalog
                </button>
                <span>SDS Techware (Pvt) Ltd.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Printable Quotation Document & Download Modal */}
      <QuotationPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        quoteItems={quoteItems}
        customerInfo={customerInfo}
        />

      {/* WhatsApp Message Preview Modal */}
      {whatsAppPreviewOpen && (
        <div className="fixed inset-0 z-60 bg-[#10283D]/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-[#DCE7EF] overflow-hidden">
            <div className="px-5 py-3.5 bg-[#10283D] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#489DCA]" />
                <span className="text-xs font-bold tracking-wide uppercase">
                  Prepared WhatsApp Enquiry Preview
                </span>
              </div>
              <button
                onClick={() => setWhatsAppPreviewOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-[#62798C] leading-relaxed">
                This is a preview of the formatted text message prepared for WhatsApp. In this prototype, no messages are transmitted and no external numbers are assumed:
              </p>

              <div className="bg-[#F7FAFD] border border-[#DCE7EF] p-3.5 rounded-md font-mono text-[11px] text-[#183B57] whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
                {generateWhatsAppMessage()}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(generateWhatsAppMessage());
                    setWhatsAppCopied(true);
                    setTimeout(() => setWhatsAppCopied(false), 2000);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded font-medium transition-colors ${
                    whatsAppCopied ? 'bg-emerald-600 text-white' : 'bg-[#275B86] hover:bg-[#10283D] text-white'
                  }`}
                >
                  {whatsAppCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Message Text</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setWhatsAppPreviewOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#62798C] hover:text-[#183B57]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
