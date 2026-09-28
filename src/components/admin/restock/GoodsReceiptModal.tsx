import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, PackageCheck, Trash2 } from 'lucide-react';
import { formatCost } from '../../../lib/format';
import {
  parseCostInput,
  validateMovementQuantity,
  type GoodsReceiptInput,
  type GoodsReceiptResult,
} from '../../../features/inventory/restock';
import type { Product } from '../../../types';
import { DemoNotice, Modal } from '../../common/Modal';

export interface ReceiptDraftLine {
  product: Product;
  quantity: number;
}

interface LineState {
  productId: string;
  qtyText: string;
  costText: string;
  confirmUnknownStart: boolean;
}

interface GoodsReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  lines: ReceiptDraftLine[];
  /** Pre-filled reference (e.g. the reorder draft reference). */
  defaultReference?: string;
  actorLabel: string;
  canEdit: boolean;
  onSubmit: (input: GoodsReceiptInput) => GoodsReceiptResult;
  onReceived: (result: GoodsReceiptResult) => void;
}

/**
 * Explicit goods-receipt confirmation. Stock changes only when the user
 * confirms physical receipt here; the whole receipt is applied atomically.
 */
export const GoodsReceiptModal: React.FC<GoodsReceiptModalProps> = ({
  isOpen,
  onClose,
  lines: initialLines,
  defaultReference,
  actorLabel,
  canEdit,
  onSubmit,
  onReceived,
}) => {
  const [lines, setLines] = useState<LineState[]>([]);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setLines(initialLines.map(l => ({ productId: l.product.id, qtyText: String(l.quantity), costText: '', confirmUnknownStart: false })));
    setReference(defaultReference ?? '');
    setNotes('');
    setConfirmed(false);
    setErrors([]);
    // Initialise only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const productById = useMemo(() => new Map(initialLines.map(l => [l.product.id, l.product])), [initialLines]);

  const parsed = lines.map(l => {
    const product = productById.get(l.productId);
    const qty = l.qtyText.trim() === '' ? NaN : Number(l.qtyText);
    const qtyError = validateMovementQuantity(qty);
    const cost = parseCostInput(l.costText);
    return { l, product, qty, qtyError, cost, costError: cost === undefined ? 'Enter a valid cost or leave blank.' : null };
  });

  const hasFieldErrors = parsed.some(p => p.qtyError || p.costError || (p.product?.stock === null && !p.l.confirmUnknownStart));
  const totalUnits = parsed.reduce((s, p) => s + (p.qtyError ? 0 : p.qty), 0);

  const update = (productId: string, patch: Partial<LineState>) =>
    setLines(prev => prev.map(l => (l.productId === productId ? { ...l, ...patch } : l)));

  const handleConfirm = () => {
    if (!canEdit || !confirmed || hasFieldErrors || lines.length === 0) return;
    const input: GoodsReceiptInput = {
      reference,
      notes,
      lines: parsed.map(p => ({
        productId: p.l.productId,
        quantity: p.qty,
        unitCost: p.cost ?? null,
        confirmUnknownStartingStock: p.l.confirmUnknownStart,
      })),
    };
    const result = onSubmit(input);
    if (!result.ok) {
      setErrors(result.errors.map(e => (e.model ? `${e.model}: ${e.message}` : e.message)));
      return;
    }
    onReceived(result);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      zIndexClass="z-[60]"
      maxWidth="max-w-4xl"
      icon={<PackageCheck className="w-4 h-4" />}
      title="Record goods receipt"
      description="Increase stock only for goods that have physically arrived and been checked."
      footer={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="flex items-start gap-2 text-xs text-[#183B57] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="mt-0.5 rounded border-[#DCE7EF] text-[#275B86]"
            />
            <span>
              I confirm these quantities were <strong>physically received</strong>. Recorded as: <em>{actorLabel}</em>.
            </span>
          </label>
          <div className="flex items-center gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-3.5 py-1.5 text-xs text-[#183B57] hover:bg-slate-100 rounded font-medium">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canEdit || !confirmed || hasFieldErrors || lines.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#275B86] hover:bg-[#10283D] text-white rounded text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirm receipt (+{totalUnits} units)</span>
            </button>
          </div>
        </div>
      }
    >
      <DemoNotice tone="blue">
        Prototype note: this updates stock in this browser only and adds a record to the local stock history. It does not
        notify suppliers or customers.
      </DemoNotice>

      {!canEdit && <DemoNotice>The Viewer role cannot record goods receipts.</DemoNotice>}

      {errors.length > 0 && (
        <div role="alert" className="p-3 rounded-md border border-red-200 bg-red-50 text-xs text-red-800 space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Nothing was changed. Fix these issues and try again:
          </div>
          <ul className="list-disc pl-5">
            {errors.map(e => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="border border-[#DCE7EF] rounded-lg overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[640px]">
          <thead className="bg-[#F7FAFD] text-[#62798C] uppercase font-semibold text-[10px] tracking-wider border-b border-[#DCE7EF]">
            <tr>
              <th className="py-2 px-3">Product</th>
              <th className="py-2 px-3">Stock now → after</th>
              <th className="py-2 px-3">Qty received</th>
              <th className="py-2 px-3">Unit purchase cost (LKR)</th>
              <th className="py-2 px-3 sr-only">Remove</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCE7EF]">
            {parsed.map(({ l, product, qty, qtyError, costError }) => {
              if (!product) return null;
              const unknownStart = product.stock === null;
              const after = qtyError ? '—' : unknownStart ? (l.confirmUnknownStart ? qty : '?') : (product.stock ?? 0) + qty;
              return (
                <tr key={l.productId} className="align-top">
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-[#10283D]">{product.model}</div>
                    <div className="text-[10px] font-mono text-[#62798C]">
                      {product.sku} · {product.brand}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <div>
                      {unknownStart ? <span className="text-amber-700 font-sans">Unconfirmed</span> : product.stock} → <strong>{after}</strong>
                    </div>
                    {unknownStart && (
                      <label className="mt-1.5 flex items-start gap-1.5 font-sans text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded p-1.5 max-w-[240px]">
                        <input
                          type="checkbox"
                          checked={l.confirmUnknownStart}
                          onChange={e => update(l.productId, { confirmUnknownStart: e.target.checked })}
                          className="mt-0.5"
                        />
                        <span>Current stock is unknown. Set on-hand stock to exactly the received quantity.</span>
                      </label>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      value={l.qtyText}
                      onChange={e => update(l.productId, { qtyText: e.target.value })}
                      aria-label={`Quantity received for ${product.model}`}
                      aria-invalid={Boolean(qtyError)}
                      className={`w-24 px-2 py-1 text-xs font-mono font-bold border rounded bg-white text-[#10283D] focus:outline-none ${
                        qtyError ? 'border-red-400' : 'border-[#DCE7EF] focus:border-[#275B86]'
                      }`}
                    />
                    {qtyError && <div className="text-[10px] text-red-600 mt-1">{qtyError}</div>}
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={l.costText}
                      placeholder="Unknown"
                      onChange={e => update(l.productId, { costText: e.target.value })}
                      aria-label={`Unit purchase cost for ${product.model}`}
                      aria-invalid={Boolean(costError)}
                      className={`w-32 px-2 py-1 text-xs font-mono border rounded bg-white text-[#10283D] focus:outline-none ${
                        costError ? 'border-red-400' : 'border-[#DCE7EF] focus:border-[#275B86]'
                      }`}
                    />
                    <div className="text-[10px] text-[#62798C] mt-1">
                      {costError ?? `Last known: ${formatCost(product.purchaseCost ?? null)}. Blank = unknown.`}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setLines(prev => prev.filter(x => x.productId !== l.productId))}
                        className="p-1 text-slate-400 hover:text-red-600"
                        aria-label={`Remove ${product.model} from receipt`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <label className="space-y-1">
          <span className="font-semibold text-[#10283D]">Supplier / delivery reference (optional)</span>
          <input
            type="text"
            value={reference}
            onChange={e => setReference(e.target.value)}
            placeholder="e.g. supplier invoice or delivery note no."
            className="w-full px-2.5 py-1.5 border border-[#DCE7EF] rounded bg-[#F7FAFD] focus:outline-none focus:border-[#275B86]"
          />
        </label>
        <label className="space-y-1">
          <span className="font-semibold text-[#10283D]">Notes (optional)</span>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. 2 boxes damaged, returned"
            className="w-full px-2.5 py-1.5 border border-[#DCE7EF] rounded bg-[#F7FAFD] focus:outline-none focus:border-[#275B86]"
          />
        </label>
      </div>
    </Modal>
  );
};
