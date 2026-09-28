import React from 'react';
import { Bell, Minus, PackageCheck, Plus } from 'lucide-react';
import { formatCost } from '../../../lib/format';
import type { Product } from '../../../types';

interface LowStockTableProps {
  products: Product[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  thresholdOf: (p: Product) => number;
  hasOverride: (category: string) => boolean;
  pendingRequestCount: (productId: string) => number;
  onOpenRequests: (product: Product) => void;
  rowQty: (p: Product) => number;
  onSetRowQty: (productId: string, qty: number) => void;
  canEdit: boolean;
  onReceive: (product: Product, qty: number) => void;
}

export const LowStockTable: React.FC<LowStockTableProps> = ({
  products,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  thresholdOf,
  hasOverride,
  pendingRequestCount,
  onOpenRequests,
  rowQty,
  onSetRowQty,
  canEdit,
  onReceive,
}) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left text-xs min-w-[900px]">
      <thead className="bg-[#F7FAFD] text-[#62798C] uppercase font-semibold text-[10px] tracking-wider border-b border-[#DCE7EF]">
        <tr>
          <th className="py-2.5 px-4 w-10 text-center">
            <input
              type="checkbox"
              checked={products.length > 0 && selectedIds.length === products.length}
              onChange={onToggleSelectAll}
              aria-label="Select all listed products"
              className="rounded border-[#DCE7EF] text-[#275B86] focus:ring-0 cursor-pointer"
            />
          </th>
          <th className="py-2.5 px-4">Product &amp; SKU</th>
          <th className="py-2.5 px-4">Brand / Category</th>
          <th className="py-2.5 px-4">Current stock</th>
          <th className="py-2.5 px-4">Purchase cost (last known)</th>
          <th className="py-2.5 px-4">Waiting customers</th>
          <th className="py-2.5 px-4 text-right">Receive stock</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#DCE7EF]">
        {products.map(prod => {
          const selected = selectedIds.includes(prod.id);
          const threshold = thresholdOf(prod);
          const requests = pendingRequestCount(prod.id);
          const qty = rowQty(prod);
          return (
            <tr key={prod.id} className={`transition-colors hover:bg-[#F7FAFD]/70 ${selected ? 'bg-[#EBF3F8]/40' : ''}`}>
              <td className="py-3 px-4 text-center">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onToggleSelect(prod.id)}
                  aria-label={`Select ${prod.model}`}
                  className="rounded border-[#DCE7EF] text-[#275B86] focus:ring-0 cursor-pointer"
                />
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  {prod.images[0] ? (
                    <img src={prod.images[0]} alt="" className="w-10 h-10 object-contain rounded bg-[#F7FAFD] border border-[#DCE7EF] p-0.5 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-[#F7FAFD] border border-[#DCE7EF] flex items-center justify-center text-[#275B86] font-bold text-xs shrink-0">
                      {prod.brand.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-[#10283D] truncate max-w-[220px]" title={prod.name || prod.model}>
                      {prod.model}
                    </div>
                    <div className="text-[11px] text-[#62798C] font-mono mt-0.5">{prod.sku}</div>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 text-[#183B57]">
                <div className="font-medium">{prod.brand}</div>
                <div className="text-[11px] text-[#62798C] flex items-center gap-1.5 mt-0.5">
                  <span>{prod.category}</span>
                  <span
                    className={`text-[9px] font-mono font-semibold px-1 rounded ${
                      hasOverride(prod.category) ? 'bg-[#EBF3F8] text-[#275B86] border border-[#275B86]/20' : 'bg-slate-100 text-slate-500'
                    }`}
                    title={`Low-stock threshold for ${prod.category}: ≤ ${threshold}`}
                  >
                    ≤{threshold}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4 font-mono">
                {prod.stock === null ? (
                  <div className="text-amber-700 font-sans font-medium text-xs">Unconfirmed</div>
                ) : prod.stock === 0 ? (
                  <div>
                    <span className="font-bold text-red-600 text-xs">0 units</span>
                    <span className="block text-[10px] text-red-500 font-sans font-medium mt-0.5">Out of stock</span>
                  </div>
                ) : (
                  <div>
                    <span className={`font-bold text-xs ${prod.stock <= 2 ? 'text-amber-800' : 'text-[#10283D]'}`}>
                      {prod.stock} {prod.stock === 1 ? 'unit' : 'units'}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-sans mt-0.5">Threshold ≤{threshold}</span>
                  </div>
                )}
              </td>
              <td className="py-3 px-4 font-mono text-[#10283D]">{formatCost(prod.purchaseCost ?? null)}</td>
              <td className="py-3 px-4">
                {requests > 0 ? (
                  <button
                    type="button"
                    onClick={() => onOpenRequests(prod)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#275B86] hover:text-[#10283D] font-semibold hover:underline cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5 text-amber-600" />
                    <span>{requests} waiting</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400">None</span>
                )}
              </td>
              <td className="py-3 px-4 text-right">
                <div className="inline-flex items-center gap-2 justify-end">
                  <div className="flex items-center bg-[#F7FAFD] border border-[#DCE7EF] rounded overflow-hidden">
                    <button
                      type="button"
                      disabled={!canEdit || qty <= 1}
                      onClick={() => onSetRowQty(prod.id, qty - 1)}
                      className="p-1 text-slate-500 hover:text-[#10283D] hover:bg-slate-200/60 disabled:opacity-40 cursor-pointer"
                      aria-label={`Decrease quantity for ${prod.model}`}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      disabled={!canEdit}
                      value={qty}
                      onChange={e => onSetRowQty(prod.id, parseInt(e.target.value, 10) || 1)}
                      aria-label={`Quantity for ${prod.model}`}
                      className="w-12 text-center text-xs font-mono font-bold text-[#10283D] bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={!canEdit || qty >= 999}
                      onClick={() => onSetRowQty(prod.id, qty + 1)}
                      className="p-1 text-slate-500 hover:text-[#10283D] hover:bg-slate-200/60 disabled:opacity-40 cursor-pointer"
                      aria-label={`Increase quantity for ${prod.model}`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => onReceive(prod, qty)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold transition-colors shadow-xs ${
                      canEdit ? 'bg-[#10283D] hover:bg-[#275B86] text-white cursor-pointer' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                    title={canEdit ? 'Open the goods-receipt confirmation (stock changes only after you confirm)' : 'Viewer role cannot modify stock'}
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>Receive…</span>
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
