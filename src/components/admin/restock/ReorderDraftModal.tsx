import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, FileSpreadsheet, FileText, PackageCheck, Printer } from 'lucide-react';
import { reorderDraftCsv, reorderDraftText } from '../../../features/inventory/exports';
import { buildReorderDraft, validateMovementQuantity } from '../../../features/inventory/restock';
import { copyText, downloadTextFile } from '../../../lib/download';
import { createReference } from '../../../lib/ids';
import { formatCost } from '../../../lib/format';
import type { DemoActor, Product } from '../../../types';
import { DemoNotice, Modal } from '../../common/Modal';

interface ReorderDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  quantities: Record<string, number>;
  setQuantities: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  thresholdOf: (p: Product) => number;
  actor: DemoActor;
  canEdit: boolean;
  showToast: (msg: string) => void;
  /** Open the goods-receipt dialog for these lines (stock changes only after confirmation there). */
  onRecordReceipt: (lines: Array<{ product: Product; quantity: number }>, reference: string) => void;
}

/**
 * Reorder DRAFT: a planning document only. Copying, printing or exporting it
 * never changes stock. Costs shown are purchase costs (unknown when not
 * recorded) — never selling prices.
 */
export const ReorderDraftModal: React.FC<ReorderDraftModalProps> = ({
  isOpen,
  onClose,
  products,
  quantities,
  setQuantities,
  thresholdOf,
  actor,
  canEdit,
  showToast,
  onRecordReceipt,
}) => {
  const [copied, setCopied] = useState(false);
  // One reference per opened draft (kept stable while quantities are edited).
  const [reference, setReference] = useState(() => createReference('DRAFT'));
  useEffect(() => {
    if (isOpen) setReference(createReference('DRAFT'));
  }, [isOpen]);
  const items = useMemo(() => products.filter(p => quantities[p.id] !== undefined), [products, quantities]);
  const invalid = items.filter(p => validateMovementQuantity(quantities[p.id]) !== null);
  const draftOutcome = useMemo(
    () => (isOpen ? buildReorderDraft(items, quantities, thresholdOf, actor, new Date(), reference) : null),
    [isOpen, items, quantities, thresholdOf, actor, reference],
  );
  const draft = draftOutcome && draftOutcome.ok ? draftOutcome.value : null;

  const handleCopy = async () => {
    if (!draft) return;
    if (await copyText(reorderDraftText(draft))) {
      setCopied(true);
      showToast('Reorder draft copied. Stock was not changed.');
      setTimeout(() => setCopied(false), 2500);
    } else {
      showToast('Unable to copy to clipboard. Please use Print or CSV instead.');
    }
  };

  const handleCsv = () => {
    if (!draft) return;
    const ok = downloadTextFile(`SDS_Reorder_Draft_${draft.reference}.csv`, reorderDraftCsv(draft), 'text/csv;charset=utf-8');
    showToast(ok ? 'Reorder draft CSV downloaded. Stock was not changed.' : 'The browser blocked the download.');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-4xl"
      icon={<FileText className="w-4 h-4" />}
      title="Reorder draft"
      description="Plan quantities to order. Drafts never change stock — record a goods receipt when items arrive."
      footer={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!draft}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#183B57] bg-[#F7FAFD] hover:bg-slate-200/60 border border-[#DCE7EF] rounded disabled:opacity-40"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy draft text'}</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!draft}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#183B57] bg-[#F7FAFD] hover:bg-slate-200/60 border border-[#DCE7EF] rounded disabled:opacity-40"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print draft</span>
            </button>
            <button
              type="button"
              onClick={handleCsv}
              disabled={!draft}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#183B57] bg-[#F7FAFD] hover:bg-slate-200/60 border border-[#DCE7EF] rounded disabled:opacity-40"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Draft CSV (receiving checklist)</span>
            </button>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-3.5 py-1.5 text-xs text-[#183B57] hover:bg-slate-100 rounded font-medium">
              Close
            </button>
            <button
              type="button"
              disabled={!canEdit || !draft}
              onClick={() => draft && onRecordReceipt(items.map(p => ({ product: p, quantity: quantities[p.id] })), draft.reference)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#275B86] hover:bg-[#10283D] text-white rounded text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              title="Opens a confirmation step — stock changes only after you confirm the goods were received"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Record goods receipt…</span>
            </button>
          </div>
        </div>
      }
    >
      <DemoNotice tone="blue">
        <strong>Draft only.</strong> Copying, printing or downloading this draft does not change stock. Purchase costs come from
        recorded receipts; where none is recorded the cost is shown as <em>Unknown</em> (selling prices are never used).
      </DemoNotice>

      <div id="printable-reorder-draft" className="print-area space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#F7FAFD] p-3 rounded-lg border border-[#DCE7EF]">
            <div className="text-[10px] font-semibold text-[#62798C] uppercase">Draft ref.</div>
            <div className="text-sm font-bold font-mono text-[#10283D] mt-0.5">{draft?.reference ?? '—'}</div>
          </div>
          <div className="bg-[#F7FAFD] p-3 rounded-lg border border-[#DCE7EF]">
            <div className="text-[10px] font-semibold text-[#62798C] uppercase">Units to order</div>
            <div className="text-xl font-bold font-mono text-[#275B86] mt-0.5">{draft?.totalUnits ?? 0}</div>
          </div>
          <div className="bg-[#F7FAFD] p-3 rounded-lg border border-[#DCE7EF] col-span-2">
            <div className="text-[10px] font-semibold text-[#62798C] uppercase">Known purchase cost</div>
            <div className="text-lg font-bold font-mono text-[#10283D] mt-0.5">{formatCost(draft?.knownCostTotal ?? null)}</div>
            {draft && draft.linesWithUnknownCost > 0 && (
              <div className="text-[10px] text-amber-700">
                Incomplete — {draft.linesWithUnknownCost} of {draft.lines.length} line(s) have unknown cost.
              </div>
            )}
          </div>
        </div>

        <div className="border border-[#DCE7EF] rounded-lg overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[600px]">
            <thead className="bg-[#F7FAFD] text-[#62798C] uppercase font-semibold text-[10px] tracking-wider border-b border-[#DCE7EF]">
              <tr>
                <th className="py-2.5 px-3">Item / Model</th>
                <th className="py-2.5 px-3">Brand</th>
                <th className="py-2.5 px-3">Current stock</th>
                <th className="py-2.5 px-3">Order qty</th>
                <th className="py-2.5 px-3 text-right">Unit purchase cost</th>
                <th className="py-2.5 px-3 text-right">Line cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE7EF]">
              {items.map(p => {
                const qty = quantities[p.id];
                const err = validateMovementQuantity(qty);
                const cost = typeof p.purchaseCost === 'number' ? p.purchaseCost : null;
                return (
                  <tr key={p.id}>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-[#10283D]">{p.model}</div>
                      <div className="text-[10px] font-mono text-[#62798C]">{p.sku}</div>
                    </td>
                    <td className="py-2.5 px-3">{p.brand}</td>
                    <td className="py-2.5 px-3 font-mono">{p.stock === null ? 'Unconfirmed' : `${p.stock} units`}</td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={Number.isFinite(qty) ? qty : ''}
                        onChange={e => {
                          const v = e.target.value === '' ? NaN : Number(e.target.value);
                          setQuantities(prev => ({ ...prev, [p.id]: v }));
                        }}
                        aria-label={`Order quantity for ${p.model}`}
                        aria-invalid={Boolean(err)}
                        className={`w-20 px-2 py-1 text-xs font-mono font-bold border rounded bg-white text-[#10283D] focus:outline-none ${
                          err ? 'border-red-400' : 'border-[#DCE7EF] focus:border-[#275B86]'
                        }`}
                      />
                      {err && <div className="text-[10px] text-red-600 mt-0.5">{err}</div>}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right">{formatCost(cost)}</td>
                    <td className="py-2.5 px-3 font-mono text-right font-semibold">
                      {cost === null || err ? 'Unknown' : formatCost(cost * qty)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {invalid.length > 0 && <p className="text-[11px] text-red-600">Fix the highlighted quantities to export or record a receipt.</p>}
      </div>
    </Modal>
  );
};
