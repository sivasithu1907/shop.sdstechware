import React, { useCallback, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  History,
  Minus,
  Plus,
  Search,
  Settings2,
  SlidersHorizontal,
  TrendingDown,
  X,
} from 'lucide-react';
import { LOW_STOCK } from '../../config/settings';
import { canEditStock } from '../../features/staff/actor';
import type { GoodsReceiptResult } from '../../features/inventory/restock';
import {
  clampThreshold,
  effectiveThreshold,
  isCriticalStock,
  isLowStock,
  suggestedReorderQty,
} from '../../features/inventory/thresholds';
import { useStore } from '../../store/StoreContext';
import type { Product } from '../../types';
import { GoodsReceiptModal, type ReceiptDraftLine } from './restock/GoodsReceiptModal';
import { LowStockTable } from './restock/LowStockTable';
import { ReorderDraftModal } from './restock/ReorderDraftModal';
import { StockHistoryModal } from './restock/StockHistoryModal';
import { ThresholdConfigPanel, ThresholdInput } from './restock/ThresholdControls';
import { WaitlistFollowUpModal, type WaitlistGroup } from './restock/WaitlistFollowUpModal';

interface LowStockReorderWidgetProps {
  onNavigateToInventory?: () => void;
  onNavigateToRequests?: () => void;
}

type FilterTab = 'all' | 'out_of_stock' | 'critical' | 'with_alerts';

/**
 * Low stock monitoring and restocking.
 * Flow: flag low stock → (optional) reorder DRAFT → confirmed GOODS RECEIPT →
 * follow up with waiting customers manually. Only the receipt changes stock.
 */
export const LowStockReorderWidget: React.FC<LowStockReorderWidgetProps> = ({ onNavigateToInventory }) => {
  const {
    activeProducts,
    categories,
    currentRole,
    actor,
    stockAlerts,
    markStockAlertManuallyNotified,
    showToast,
    stockMovements,
    receiveGoods,
    clearStockHistory,
    lowStockThreshold: threshold,
    setLowStockThreshold,
    categoryThresholds,
    setCategoryThresholds,
  } = useStore();

  const canEdit = canEditStock(currentRole);

  const [includeUnconfirmed, setIncludeUnconfirmed] = useState(false);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [rowQuantities, setRowQuantities] = useState<Record<string, number>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [isDraftOpen, setIsDraftOpen] = useState(false);
  const [draftQuantities, setDraftQuantities] = useState<Record<string, number>>({});
  const [receipt, setReceipt] = useState<{ lines: ReceiptDraftLine[]; reference?: string } | null>(null);
  const [followUp, setFollowUp] = useState<WaitlistGroup[] | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // ---------------- thresholds ----------------
  const thresholdOf = useCallback(
    (p: Product) => effectiveThreshold(p.category, threshold, categoryThresholds),
    [threshold, categoryThresholds],
  );

  const applyThreshold = (v: number, announce = true) => {
    const clamped = clampThreshold(v);
    setLowStockThreshold(clamped);
    if (announce) showToast(`Global low stock threshold set to ≤ ${clamped} units`);
  };
  const setCategoryThreshold = (category: string, v: number) => {
    const clamped = clampThreshold(v);
    setCategoryThresholds(prev => ({ ...prev, [category]: clamped }));
  };
  const resetCategoryThreshold = (category: string) => {
    setCategoryThresholds(prev => {
      const next = { ...prev };
      const recommended = LOW_STOCK.defaultCategoryThresholds[category];
      if (recommended !== undefined) next[category] = recommended;
      else delete next[category];
      return next;
    });
  };

  // ---------------- derived lists ----------------
  const pendingCount = useCallback(
    (productId: string) => stockAlerts.filter(a => a.productId === productId && a.status === 'pending').length,
    [stockAlerts],
  );

  const lowStock = useMemo(
    () => activeProducts.filter(p => isLowStock(p, thresholdOf(p), includeUnconfirmed)),
    [activeProducts, thresholdOf, includeUnconfirmed],
  );
  const outOfStock = lowStock.filter(p => p.stock === 0);
  const critical = lowStock.filter(p => isCriticalStock(p, thresholdOf(p)));
  const withRequests = lowStock.filter(p => pendingCount(p.id) > 0);

  const displayed = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return lowStock.filter(p => {
      if (filterTab === 'out_of_stock' && p.stock !== 0) return false;
      if (filterTab === 'critical' && !isCriticalStock(p, thresholdOf(p))) return false;
      if (filterTab === 'with_alerts' && pendingCount(p.id) === 0) return false;
      if (!q) return true;
      return [p.model, p.brand, p.category, p.sku, p.name].some(v => (v || '').toLowerCase().includes(q));
    });
  }, [lowStock, filterTab, searchQuery, thresholdOf, pendingCount]);

  const countForThreshold = (v: number) => activeProducts.filter(p => isLowStock(p, v, includeUnconfirmed)).length;
  const categoryNames = categories.length ? categories.map(c => c.name) : Object.keys(LOW_STOCK.defaultCategoryThresholds);
  const countForCategory = (cat: string) =>
    activeProducts.filter(p => p.category === cat && isLowStock(p, effectiveThreshold(cat, threshold, categoryThresholds), includeUnconfirmed)).length;

  // ---------------- quantities & selection ----------------
  const rowQty = (p: Product) => rowQuantities[p.id] ?? suggestedReorderQty(p.stock, thresholdOf(p));
  const setRowQty = (id: string, v: number) =>
    setRowQuantities(prev => ({ ...prev, [id]: Math.max(1, Math.min(999, Math.floor(Number.isFinite(v) ? v : 1))) }));

  const toggleSelect = (id: string) => setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  const toggleSelectAll = () => setSelectedIds(prev => (prev.length === displayed.length ? [] : displayed.map(p => p.id)));

  const openDraft = () => {
    const targets = selectedIds.length > 0 ? activeProducts.filter(p => selectedIds.includes(p.id)) : displayed;
    const qtys: Record<string, number> = {};
    targets.forEach(p => (qtys[p.id] = rowQty(p)));
    setDraftQuantities(qtys);
    setIsDraftOpen(true);
  };

  // ---------------- receipts ----------------
  const handleReceived = (result: GoodsReceiptResult) => {
    const lineCount = result.movements.length;
    setReceipt(null);
    setIsDraftOpen(false);
    setSelectedIds([]);
    const groups: WaitlistGroup[] = result.movements
      .map(m => {
        const product = result.products.find(p => p.id === m.productId);
        const alertIds = stockAlerts.filter(a => a.productId === m.productId && a.status === 'pending').map(a => a.id);
        return product ? { product, receivedQuantity: m.quantityDelta, alertIds } : null;
      })
      .filter((g): g is WaitlistGroup => g !== null && g.alertIds.length > 0);
    const waiting = groups.reduce((s, g) => s + g.alertIds.length, 0);
    showToast(
      `Goods receipt recorded: +${result.totalUnits} units across ${lineCount} product(s).` +
        (waiting ? ` ${waiting} customer request(s) are waiting — contact them manually.` : ''),
    );
    if (groups.length) setFollowUp(groups);
  };

  const tabBtn = (id: FilterTab, label: React.ReactNode, activeCls: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={filterTab === id}
      onClick={() => setFilterTab(id)}
      className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer flex items-center gap-1 ${
        filterTab === id ? `bg-white font-bold shadow-xs ${activeCls}` : 'text-[#62798C] hover:text-[#10283D]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white rounded-lg border border-[#DCE7EF] shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-[#DCE7EF] bg-linear-to-r from-white via-[#F7FAFD] to-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
                <TrendingDown className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-[#10283D] tracking-tight">Low Stock &amp; Restocking</h2>
              {lowStock.length > 0 && (
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                  {lowStock.length} below threshold
                </span>
              )}
            </div>
            <p className="text-xs text-[#62798C] sm:pl-9">
              Plan reorders with a draft, then record a confirmed goods receipt when items arrive. Only receipts change stock.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <div className="flex items-center bg-white p-1 rounded-md border border-[#DCE7EF] shadow-xs">
              <span className="flex items-center gap-1.5 text-[11px] text-[#62798C] px-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#275B86]" />
                <span className="hidden sm:inline">Threshold:</span>
              </span>
              <button
                type="button"
                onClick={() => applyThreshold(threshold - 1)}
                disabled={threshold <= 1}
                className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-[#10283D] hover:bg-slate-100 rounded disabled:opacity-30"
                aria-label="Decrease threshold"
              >
                <Minus className="w-3 h-3" />
              </button>
              <ThresholdInput
                value={threshold}
                onCommit={v => applyThreshold(v)}
                ariaLabel="Global low stock threshold"
                className="w-12 text-center text-xs font-mono font-bold bg-[#F7FAFD] border border-[#DCE7EF] focus:border-[#275B86] rounded py-0.5 text-[#10283D] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => applyThreshold(threshold + 1)}
                disabled={threshold >= LOW_STOCK.maxThreshold}
                className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-[#10283D] hover:bg-slate-100 rounded disabled:opacity-30"
                aria-label="Increase threshold"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1 bg-white p-1 rounded-md border border-[#DCE7EF] shadow-xs">
              {LOW_STOCK.presets.map(v => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={threshold === v}
                  onClick={() => applyThreshold(v)}
                  className={`px-2 py-0.5 text-xs font-semibold rounded transition-colors ${
                    threshold === v ? 'bg-[#10283D] text-white shadow-xs' : 'text-[#183B57] hover:bg-slate-100'
                  }`}
                  title={`${countForThreshold(v)} items would be flagged`}
                >
                  ≤{v}
                </button>
              ))}
            </div>

            <button
              type="button"
              aria-expanded={isConfigPanelOpen}
              onClick={() => setIsConfigPanelOpen(o => !o)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-all shadow-xs ${
                isConfigPanelOpen ? 'bg-[#10283D] text-white border-[#10283D]' : 'bg-white text-[#183B57] border-[#DCE7EF] hover:border-[#275B86] hover:bg-slate-50'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5 text-[#275B86]" />
              <span>Thresholds</span>
              {isConfigPanelOpen ? <ChevronUp className="w-3.5 h-3.5 opacity-70" /> : <ChevronDown className="w-3.5 h-3.5 opacity-70" />}
            </button>

            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-[#183B57] rounded-md text-xs font-semibold border border-[#DCE7EF] shadow-xs"
            >
              <History className="w-3.5 h-3.5 text-[#275B86]" />
              <span>History</span>
              {stockMovements.length > 0 && (
                <span className="text-[10px] font-mono px-1.5 rounded-full bg-[#EBF3F8] text-[#275B86] font-bold">{stockMovements.length}</span>
              )}
            </button>

            {lowStock.length > 0 && (
              <button
                type="button"
                onClick={openDraft}
                disabled={displayed.length === 0 && selectedIds.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#275B86] hover:bg-[#10283D] text-white rounded-md text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{selectedIds.length > 0 ? `Reorder draft (${selectedIds.length})` : `Reorder draft (${displayed.length})`}</span>
              </button>
            )}
          </div>
        </div>

        {isConfigPanelOpen && (
          <ThresholdConfigPanel
            threshold={threshold}
            onApplyThreshold={applyThreshold}
            onResetDefault={() => applyThreshold(LOW_STOCK.defaultThreshold)}
            onClose={() => setIsConfigPanelOpen(false)}
            countForThreshold={countForThreshold}
            categoryNames={categoryNames}
            categoryThresholds={categoryThresholds}
            effectiveThresholdFor={cat => effectiveThreshold(cat, threshold, categoryThresholds)}
            countForCategory={countForCategory}
            onSetCategoryThreshold={setCategoryThreshold}
            onResetCategoryThreshold={resetCategoryThreshold}
            onResetAllCategoryThresholds={() => {
              setCategoryThresholds({ ...LOW_STOCK.defaultCategoryThresholds });
              showToast('Category thresholds reset to the recommended defaults.');
            }}
            includeUnconfirmed={includeUnconfirmed}
            setIncludeUnconfirmed={setIncludeUnconfirmed}
            summary={{ all: lowStock.length, outOfStock: outOfStock.length, critical: critical.length }}
          />
        )}

        <div className="mt-4 pt-3 border-t border-[#DCE7EF] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1 bg-[#F7FAFD] p-1 rounded-md border border-[#DCE7EF]" role="tablist" aria-label="Low stock filter">
            {tabBtn('all', <>All ≤{threshold} ({lowStock.length})</>, 'text-[#10283D]')}
            {tabBtn('out_of_stock', <>Out of stock ({outOfStock.length})</>, 'text-red-700')}
            {tabBtn('critical', <>Critical ({critical.length})</>, 'text-amber-800')}
            {withRequests.length > 0 &&
              tabBtn(
                'with_alerts',
                <>
                  <Bell className="w-3 h-3 text-[#275B86]" /> Customer requests ({withRequests.length})
                </>,
                'text-[#275B86]',
              )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <label className="flex items-center gap-1.5 text-[11px] text-[#62798C] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeUnconfirmed}
                onChange={e => setIncludeUnconfirmed(e.target.checked)}
                className="rounded border-[#DCE7EF] text-[#275B86] focus:ring-0 cursor-pointer"
              />
              <span>Include unconfirmed stock</span>
            </label>
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter by model, SKU, brand..."
                aria-label="Filter low stock products"
                className="w-full pl-8 pr-7 py-1 text-xs bg-[#F7FAFD] border border-[#DCE7EF] rounded text-[#183B57] focus:outline-none focus:border-[#275B86]"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear filter" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {displayed.length > 0 ? (
        <LowStockTable
          products={displayed}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          thresholdOf={thresholdOf}
          hasOverride={cat => categoryThresholds[cat] !== undefined}
          pendingRequestCount={pendingCount}
          onOpenRequests={p =>
            setFollowUp([{ product: p, receivedQuantity: null, alertIds: stockAlerts.filter(a => a.productId === p.id && a.status === 'pending').map(a => a.id) }])
          }
          rowQty={rowQty}
          onSetRowQty={setRowQty}
          canEdit={canEdit}
          onReceive={(product, quantity) => setReceipt({ lines: [{ product, quantity }] })}
        />
      ) : (
        <div className="p-8 sm:p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-sm font-bold text-[#10283D]">{searchQuery ? 'No matching low-stock products' : 'No products below their threshold'}</h3>
            <p className="text-xs text-[#62798C] mt-1 leading-relaxed">
              {searchQuery
                ? `No low-stock products matched "${searchQuery}".`
                : `Every active product has stock above its threshold${includeUnconfirmed ? '' : ' (products with unconfirmed stock are excluded)'}.`}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#183B57] text-xs font-medium rounded">
                Clear search
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsConfigPanelOpen(true)}
              className="px-3 py-1.5 bg-[#275B86] hover:bg-[#10283D] text-white text-xs font-semibold rounded inline-flex items-center gap-1.5 shadow-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Adjust thresholds</span>
            </button>
            {onNavigateToInventory && (
              <button type="button" onClick={onNavigateToInventory} className="px-3 py-1.5 border border-[#DCE7EF] text-[#183B57] hover:bg-slate-50 text-xs font-medium rounded">
                View full inventory sheet
              </button>
            )}
          </div>
        </div>
      )}

      <div className="p-3 sm:px-5 border-t border-[#DCE7EF] bg-[#F7FAFD] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#62798C]">
        <span>
          Showing <strong>{displayed.length}</strong> of <strong>{lowStock.length}</strong> low-stock items · global threshold ≤ {threshold}
        </span>
        {onNavigateToInventory && (
          <button type="button" onClick={onNavigateToInventory} className="inline-flex items-center gap-1 text-[#275B86] hover:text-[#10283D] font-semibold hover:underline">
            <span>Manage all stock in Inventory Sheet</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <ReorderDraftModal
        isOpen={isDraftOpen}
        onClose={() => setIsDraftOpen(false)}
        products={activeProducts}
        quantities={draftQuantities}
        setQuantities={setDraftQuantities}
        thresholdOf={thresholdOf}
        actor={actor}
        canEdit={canEdit}
        showToast={showToast}
        onRecordReceipt={(lines, reference) => setReceipt({ lines, reference })}
      />

      <GoodsReceiptModal
        isOpen={receipt !== null}
        onClose={() => setReceipt(null)}
        lines={receipt?.lines ?? []}
        defaultReference={receipt?.reference}
        actorLabel={actor.label}
        canEdit={canEdit}
        onSubmit={receiveGoods}
        onReceived={handleReceived}
      />

      <WaitlistFollowUpModal
        groups={followUp}
        stockAlerts={stockAlerts}
        onClose={() => setFollowUp(null)}
        canEdit={canEdit}
        onMarkNotified={markStockAlertManuallyNotified}
        showToast={showToast}
      />

      <StockHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        movements={stockMovements}
        actorLabel={actor.label}
        canClear={currentRole === 'owner'}
        onClear={clearStockHistory}
        showToast={showToast}
      />
    </div>
  );
};
