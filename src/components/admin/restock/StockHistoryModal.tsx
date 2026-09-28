import React, { useMemo, useState } from 'react';
import { Clock, Download, History, Search, Trash2, User, X } from 'lucide-react';
import { historyCsv } from '../../../features/inventory/exports';
import { movementKindLabel } from '../../../features/inventory/history';
import { downloadTextFile } from '../../../lib/download';
import { formatCost } from '../../../lib/format';
import type { StockMovement, StockMovementKind } from '../../../types';
import { DemoNotice, Modal } from '../../common/Modal';

interface StockHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  movements: StockMovement[];
  actorLabel: string;
  canClear: boolean;
  onClear: () => void;
  showToast: (msg: string) => void;
}

/** Browser-local stock movement history (not a secure audit log). */
export const StockHistoryModal: React.FC<StockHistoryModalProps> = ({
  isOpen,
  onClose,
  movements,
  actorLabel,
  canClear,
  onClear,
  showToast,
}) => {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | StockMovementKind>('all');
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return movements.filter(m => {
      if (kind !== 'all' && m.kind !== kind) return false;
      if (!q) return true;
      return [m.productSku, m.productModel, m.actorLabel, m.reference ?? ''].some(v => v.toLowerCase().includes(q));
    });
  }, [movements, query, kind]);

  const receipts = movements.filter(m => m.kind === 'goods_receipt');
  const unitsReceived = receipts.reduce((s, m) => s + (m.quantityDelta ?? 0), 0);
  const knownCost = receipts.reduce((s, m) => s + (m.totalCost ?? 0), 0);
  const unknownCostCount = receipts.filter(m => m.totalCost === null).length;

  const tabs: Array<{ id: 'all' | StockMovementKind; label: string }> = [
    { id: 'all', label: `All (${movements.length})` },
    { id: 'goods_receipt', label: 'Goods receipts' },
    { id: 'stock_count', label: 'Stock counts' },
    { id: 'legacy', label: 'Legacy' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setConfirmClear(false);
        onClose();
      }}
      maxWidth="max-w-5xl"
      icon={<History className="w-4 h-4" />}
      title="Stock history"
      description="Confirmed goods receipts and stock counts recorded in this browser."
      footer={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={movements.length === 0}
              onClick={() => {
                const ok = downloadTextFile(
                  `SDS_Stock_History_${new Date().toISOString().split('T')[0]}.csv`,
                  historyCsv(movements, actorLabel),
                  'text/csv;charset=utf-8',
                );
                showToast(ok ? `Stock history CSV exported (${movements.length} records).` : 'The browser blocked the download.');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#183B57] bg-[#F7FAFD] hover:bg-slate-200/60 border border-[#DCE7EF] rounded disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            {canClear && movements.length > 0 && !confirmClear && (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear history…
              </button>
            )}
            {confirmClear && (
              <span className="inline-flex flex-wrap items-center gap-2 text-xs bg-red-50 border border-red-200 rounded px-2 py-1">
                <span className="text-red-800">Delete all {movements.length} records from this browser? Export first if needed.</span>
                <button
                  type="button"
                  onClick={() => {
                    onClear();
                    setConfirmClear(false);
                    showToast('Stock history cleared from this browser.');
                  }}
                  className="px-2 py-0.5 bg-red-600 text-white rounded font-semibold"
                >
                  Delete
                </button>
                <button type="button" onClick={() => setConfirmClear(false)} className="px-2 py-0.5 text-[#183B57]">
                  Cancel
                </button>
              </span>
            )}
          </div>
          <button type="button" onClick={onClose} className="px-4 py-1.5 text-xs font-semibold text-white bg-[#10283D] hover:bg-[#275B86] rounded self-end">
            Close
          </button>
        </div>
      }
    >
      <DemoNotice>
        This history is stored in this browser only. It is <strong>not a secure audit log</strong>: it can be edited or cleared by
        anyone using this browser, and actions are attributed to the demo session role because sign-in does not exist yet.
      </DemoNotice>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#F7FAFD] p-3 rounded-lg border border-[#DCE7EF]">
          <div className="text-[10px] font-semibold text-[#62798C] uppercase">Records</div>
          <div className="text-xl font-bold font-mono text-[#10283D] mt-0.5">{movements.length}</div>
        </div>
        <div className="bg-[#F7FAFD] p-3 rounded-lg border border-[#DCE7EF]">
          <div className="text-[10px] font-semibold text-[#62798C] uppercase">Units received</div>
          <div className="text-xl font-bold font-mono text-[#275B86] mt-0.5">+{unitsReceived}</div>
        </div>
        <div className="bg-[#F7FAFD] p-3 rounded-lg border border-[#DCE7EF] col-span-2">
          <div className="text-[10px] font-semibold text-[#62798C] uppercase">Known purchase cost of receipts</div>
          <div className="text-lg font-bold font-mono text-[#10283D] mt-0.5">{receipts.length ? formatCost(knownCost) : 'Unknown'}</div>
          {unknownCostCount > 0 && <div className="text-[10px] text-amber-700">{unknownCostCount} receipt line(s) with unknown cost not included.</div>}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1 bg-[#F7FAFD] p-1 rounded-md border border-[#DCE7EF]" role="tablist" aria-label="Filter by type">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={kind === t.id}
              onClick={() => setKind(t.id)}
              className={`px-2.5 py-1 text-xs font-semibold rounded ${kind === t.id ? 'bg-white text-[#10283D] shadow-xs' : 'text-[#62798C] hover:text-[#10283D]'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search SKU, model, reference, recorded by…"
            aria-label="Search stock history"
            className="w-full pl-8 pr-7 py-1 text-xs bg-[#F7FAFD] border border-[#DCE7EF] rounded focus:outline-none focus:border-[#275B86]"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="border border-[#DCE7EF] rounded-lg overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="bg-[#F7FAFD] text-[#62798C] uppercase font-semibold text-[10px] tracking-wider border-b border-[#DCE7EF]">
              <tr>
                <th className="py-2.5 px-3">Date &amp; time</th>
                <th className="py-2.5 px-3">Product / SKU</th>
                <th className="py-2.5 px-3">Stock change</th>
                <th className="py-2.5 px-3">Type &amp; reference</th>
                <th className="py-2.5 px-3">Recorded by</th>
                <th className="py-2.5 px-3 text-right">Purchase cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE7EF]">
              {filtered.map(m => (
                <tr key={m.id} className="align-top">
                  <td className="py-2.5 px-3 font-mono text-[11px] text-[#62798C] whitespace-nowrap">
                    <Clock className="w-3 h-3 inline mr-1 text-slate-400" />
                    {new Date(m.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-[#10283D] truncate max-w-[200px]" title={m.productModel}>
                      {m.productModel}
                    </div>
                    <div className="text-[10px] font-mono text-[#62798C]">
                      {m.productSku} · {m.productBrand}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                    <span className="text-slate-400">{m.previousStock ?? '?'} →</span>{' '}
                    <strong className="text-[#10283D]">{m.newStock ?? '?'}</strong>
                    {m.quantityDelta !== null && (
                      <span
                        className={`ml-1.5 px-1.5 rounded font-bold text-[10px] border ${
                          m.quantityDelta >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {m.quantityDelta >= 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-[#183B57]">{movementKindLabel(m)}</div>
                    {m.reference && <div className="text-[10px] font-mono text-[#275B86]">{m.reference}</div>}
                    {m.notes && <div className="text-[10px] text-[#62798C] max-w-[240px]">{m.notes}</div>}
                  </td>
                  <td className="py-2.5 px-3 text-[#183B57] max-w-[220px]">
                    <User className="w-3 h-3 inline mr-1 text-slate-400" />
                    <span className="text-[11px]">{m.actorLabel}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-right text-[#10283D] whitespace-nowrap">
                    {m.kind === 'goods_receipt' ? formatCost(m.totalCost) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center text-xs text-[#62798C] bg-[#F7FAFD] rounded-lg border border-[#DCE7EF]">
          {movements.length === 0 ? 'No stock changes recorded in this browser yet.' : 'No records match your filters.'}
        </div>
      )}
    </Modal>
  );
};
