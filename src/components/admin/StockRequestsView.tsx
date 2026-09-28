import React, { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { StockAlertRequest } from '../../types';
import {
  Bell,
  Mail,
  CheckCircle2,
  Clock,
  Trash2,
  Search,
  PackageCheck,
  Download,
  Check,
  Boxes,
} from 'lucide-react';
import { canEditStock } from '../../features/staff/actor';
import { toCsv } from '../../lib/csv';
import { downloadTextFile } from '../../lib/download';
import { formatDateTime } from '../../lib/format';
import { Modal } from '../common/Modal';

interface StockRequestsViewProps {
  onNavigateToInventory?: () => void;
}

export const StockRequestsView: React.FC<StockRequestsViewProps> = ({ onNavigateToInventory }) => {
  const {
    stockAlerts,
    activeProducts,
    markStockAlertManuallyNotified,
    dismissStockAlert,
    updateStock,
    currentRole,
  } = useStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'ready' | 'notified' | 'dismissed'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedQuickStockProduct, setSelectedQuickStockProduct] = useState<{ id: string; model: string; currentStock: number | null } | null>(null);
  const [quickStockValue, setQuickStockValue] = useState<string>('5');
  const [quickStockError, setQuickStockError] = useState<string | null>(null);

  const canEdit = canEditStock(currentRole);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Helper to get real-time product stock for an alert
  const getProductForAlert = (alert: StockAlertRequest) => {
    return activeProducts.find(p => p.id === alert.productId);
  };

  // Metrics
  const totalRequests = stockAlerts.length;
  const pendingRequests = stockAlerts.filter(a => a.status === 'pending').length;
  const notifiedRequests = stockAlerts.filter(a => a.status === 'notified').length;
  const dismissedRequests = stockAlerts.filter(a => a.status === 'dismissed').length;

  // Ready to notify: status === 'pending' and product is now in stock (>0)
  const readyRequests = stockAlerts.filter(a => {
    if (a.status !== 'pending') return false;
    const prod = getProductForAlert(a);
    return prod && prod.stock !== null && prod.stock > 0;
  });

  const readyToNotifyCount = readyRequests.length;

  // Filtered requests list
  const filteredAlerts = stockAlerts.filter(alert => {
    const prod = getProductForAlert(alert);
    const isNowInStock = prod && prod.stock !== null && prod.stock > 0;

    // Filter by tab
    if (statusFilter === 'pending' && alert.status !== 'pending') return false;
    if (statusFilter === 'ready' && !(alert.status === 'pending' && isNowInStock)) return false;
    if (statusFilter === 'notified' && alert.status !== 'notified') return false;
    if (statusFilter === 'dismissed' && alert.status !== 'dismissed') return false;

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchEmail = alert.email.toLowerCase().includes(q);
      const matchModel = alert.productModel.toLowerCase().includes(q);
      const matchBrand = alert.productBrand.toLowerCase().includes(q);
      const matchSku = alert.productSku.toLowerCase().includes(q);
      return matchEmail || matchModel || matchBrand || matchSku;
    }

    return true;
  });

  const handleNotifySingle = (alert: StockAlertRequest) => {
    const res = markStockAlertManuallyNotified(alert.id);
    showToast(res.success ? `Recorded: ${alert.email} was contacted manually.` : res.error ?? 'Could not update the request.');
  };

  const handleNotifyAllReady = () => {
    if (readyRequests.length === 0) return;
    const done = readyRequests.filter(a => markStockAlertManuallyNotified(a.id).success).length;
    showToast(
      done === readyRequests.length
        ? `Recorded ${done} request(s) as manually notified.`
        : `Recorded ${done} of ${readyRequests.length}; some requests could not be updated.`,
    );
  };

  /** Direct stock count (recorded in stock history). For deliveries use Low Stock → Receive. */
  const handleQuickRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuickStockProduct) return;
    const value = Number(quickStockValue);
    if (quickStockValue.trim() === '' || !Number.isInteger(value) || value < 0) {
      setQuickStockError('Enter a whole number of 0 or more.');
      return;
    }
    const res = updateStock(selectedQuickStockProduct.id, value, 'Stock count from Stock Requests view');
    if (!res.success) {
      setQuickStockError(res.error ?? 'Could not update stock.');
      return;
    }
    showToast(
      res.unchanged
        ? `Stock for ${selectedQuickStockProduct.model} is already ${value}.`
        : `Stock count for ${selectedQuickStockProduct.model} set to ${value} units (recorded in stock history).`,
    );
    setSelectedQuickStockProduct(null);
    setQuickStockError(null);
  };

  const handleExportCSV = () => {
    const headers = ['Request ID', 'Customer Email', 'Product Brand', 'Product Model', 'SKU', 'Date Requested', 'Status', 'Current Stock', 'Status changed', 'Changed by'];
    const rows = filteredAlerts.map(a => {
      const prod = getProductForAlert(a);
      const stockStr = prod ? (prod.stock === null ? 'Unconfirmed' : prod.stock.toString()) : 'Archived';
      return [
        a.id,
        a.email,
        a.productBrand,
        a.productModel,
        a.productSku,
        new Date(a.createdAt).toLocaleDateString(),
        a.status === 'notified' ? 'manually notified' : a.status,
        stockStr,
        a.statusChangedAt ? formatDateTime(a.statusChangedAt) : '',
        a.statusChangedBy?.label ?? '',
      ];
    });

    const ok = downloadTextFile(`SDS-Techware-Stock-Requests-${Date.now()}.csv`, toCsv([headers, ...rows]), 'text/csv;charset=utf-8');
    showToast(ok ? 'Exported stock requests CSV.' : 'The browser blocked the download.');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 flex items-center gap-2 bg-[#10283D] text-white px-4 py-2.5 rounded-lg shadow-xl border border-[#489DCA]/40 animate-slideDown text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#DCE7EF] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#EBF3F8] text-[#275B86]">
              <Bell className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#10283D]">
                Customer Stock Requests &amp; Restock Alerts
              </h2>
              <p className="text-xs text-[#62798C]">
                Back-in-stock requests saved in this browser. The app never sends messages — contact customers yourself, then record it.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {readyToNotifyCount > 0 && canEdit && (
            <button
              onClick={handleNotifyAllReady}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
              title="Use only after you have contacted each of these customers yourself"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark {readyToNotifyCount} in-stock as manually notified</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#183B57] bg-[#F7FAFD] border border-[#DCE7EF] hover:bg-[#EBF3F8] rounded-lg transition-colors"
            title="Download CSV export"
          >
            <Download className="w-3.5 h-3.5 text-[#275B86]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#DCE7EF] shadow-xs">
          <span className="text-[11px] font-bold text-[#62798C] uppercase tracking-wider block">
            Total Requests
          </span>
          <span className="text-2xl font-bold text-[#10283D] font-mono mt-1 block">
            {totalRequests}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            All registered alert emails
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#DCE7EF] shadow-xs">
          <span className="text-[11px] font-bold text-[#275B86] uppercase tracking-wider block">
            Pending Alerts
          </span>
          <span className="text-2xl font-bold text-[#275B86] font-mono mt-1 block">
            {pendingRequests}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Awaiting stock replenishment
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/20 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
            Ready to Notify
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-700 font-mono">
              {readyToNotifyCount}
            </span>
            {readyToNotifyCount > 0 && (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded animate-pulse">
                Action required
              </span>
            )}
          </div>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">
            Items now back in stock (&gt;0 units)
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#DCE7EF] shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Manually Notified
          </span>
          <span className="text-2xl font-bold text-slate-700 font-mono mt-1 block">
            {notifiedRequests}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Recorded by staff (no emails sent by the app)
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#DCE7EF] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-medium">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-[#10283D] text-white font-semibold'
                  : 'text-[#62798C] hover:bg-[#EBF3F8] hover:text-[#183B57]'
              }`}
            >
              All Requests ({totalRequests})
            </button>

            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-[#275B86] text-white font-semibold'
                  : 'text-[#62798C] hover:bg-[#EBF3F8] hover:text-[#183B57]'
              }`}
            >
              <span>Pending</span>
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-white/20 font-bold">
                {pendingRequests}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('ready')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'ready'
                  ? 'bg-emerald-700 text-white font-semibold'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <span>Ready in Stock</span>
              {readyToNotifyCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-emerald-200 text-emerald-800 font-bold">
                  {readyToNotifyCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setStatusFilter('notified')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === 'notified'
                  ? 'bg-[#10283D] text-white font-semibold'
                  : 'text-[#62798C] hover:bg-[#EBF3F8] hover:text-[#183B57]'
              }`}
            >
              Notified ({notifiedRequests})
            </button>

            <button
              onClick={() => setStatusFilter('dismissed')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === 'dismissed'
                  ? 'bg-[#10283D] text-white font-semibold'
                  : 'text-[#62798C] hover:bg-[#EBF3F8] hover:text-[#183B57]'
              }`}
            >
              Dismissed ({dismissedRequests})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search email, model, SKU..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F7FAFD] border border-[#DCE7EF] rounded-lg text-[#183B57] placeholder:text-slate-400 focus:outline-none focus:border-[#275B86]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-[#DCE7EF] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7FAFD] text-[#62798C] uppercase text-[10px] font-bold tracking-wider border-b border-[#DCE7EF]">
              <tr>
                <th className="py-3 px-4">Customer Contact</th>
                <th className="py-3 px-4">Requested Item</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4 text-center">Live Stock Status</th>
                <th className="py-3 px-4 text-center">Date Logged</th>
                <th className="py-3 px-4 text-center">Request Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE7EF]">
              {filteredAlerts.map(alert => {
                const prod = getProductForAlert(alert);
                const isNowInStock = prod && prod.stock !== null && prod.stock > 0;
                const isStillOutOfStock = prod && prod.stock === 0;
                const isUnconfirmed = prod && prod.stock === null;

                return (
                  <tr
                    key={alert.id}
                    className={`hover:bg-[#F7FAFD]/70 transition-colors ${
                      isNowInStock && alert.status === 'pending' ? 'bg-emerald-50/30' : ''
                    }`}
                  >
                    {/* Customer Contact */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#EBF3F8] text-[#275B86] flex items-center justify-center shrink-0">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <a
                            href={`mailto:${alert.email}?subject=SDS%20Techware%20Restock%20Notice%20-%20${encodeURIComponent(alert.productModel)}`}
                            className="font-semibold text-[#183B57] hover:text-[#275B86] hover:underline flex items-center gap-1"
                          >
                            <span>{alert.email}</span>
                          </a>
                          <span className="text-[10px] text-slate-400 block">Customer enquiry</span>
                        </div>
                      </div>
                    </td>

                    {/* Requested Item */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#10283D] block">{alert.productModel}</span>
                      <span className="text-[11px] text-[#62798C] block">
                        {alert.productBrand}
                      </span>
                    </td>

                    {/* SKU */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#183B57]">
                      {alert.productSku}
                    </td>

                    {/* Live Stock Status */}
                    <td className="py-3.5 px-4 text-center">
                      {isNowInStock ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>In Stock ({prod.stock} units)</span>
                        </div>
                      ) : isStillOutOfStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Out of stock (0)
                        </span>
                      ) : isUnconfirmed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Unconfirmed
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Item unlisted</span>
                      )}
                    </td>

                    {/* Date Logged */}
                    <td className="py-3.5 px-4 text-center text-[#62798C] text-[11px]">
                      {new Date(alert.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Request Status */}
                    <td className="py-3.5 px-4 text-center">
                      {alert.status === 'notified' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <CheckCircle2 className="w-3 h-3 text-blue-600" />
                          Manually notified
                        </span>
                      ) : alert.status === 'dismissed' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                          Dismissed
                        </span>
                      ) : isNowInStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white animate-pulse">
                          In stock — contact customer
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Awaiting Restock
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick stock update helper */}
                        {prod && canEdit && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedQuickStockProduct({
                                id: prod.id,
                                model: prod.model,
                                currentStock: prod.stock,
                              });
                              setQuickStockValue(prod.stock !== null ? String(prod.stock) : '');
                              setQuickStockError(null);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-[#275B86] hover:bg-[#EBF3F8] transition-colors"
                            title="Record a stock count for this item"
                            aria-label={`Record a stock count for ${prod.model}`}
                          >
                            <Boxes className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Dispatch Notification button */}
                        {alert.status === 'pending' && canEdit && (
                          <button
                            type="button"
                            onClick={() => handleNotifySingle(alert)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold shadow-xs transition-all ${
                              isNowInStock
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-[#275B86] hover:bg-[#10283D] text-white'
                            }`}
                            title="Record that you contacted this customer yourself (no message is sent by the app)"
                          >
                            <Check className="w-3 h-3" />
                            <span>Mark notified</span>
                          </button>
                        )}

                        {/* Dismiss Request */}
                        {alert.status !== 'dismissed' && canEdit && (
                          <button
                            type="button"
                            onClick={() => {
                              const res = dismissStockAlert(alert.id);
                              showToast(res.success ? `Stock request for ${alert.email} dismissed.` : res.error ?? 'Could not dismiss.');
                            }}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Dismiss request"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredAlerts.length === 0 && (
            <div className="p-12 text-center space-y-2">
              <PackageCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-[#10283D]">No stock requests found</h3>
              <p className="text-xs text-[#62798C] max-w-sm mx-auto">
                {search
                  ? `No requests match "${search}". Try clearing your search query.`
                  : 'There are currently no customer stock requests under this filter category.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stock count dialog */}
      <Modal
        isOpen={selectedQuickStockProduct !== null}
        onClose={() => setSelectedQuickStockProduct(null)}
        maxWidth="max-w-sm"
        zIndexClass="z-[60]"
        title={selectedQuickStockProduct ? `Record stock count — ${selectedQuickStockProduct.model}` : 'Record stock count'}
        description={
          selectedQuickStockProduct
            ? `Current: ${selectedQuickStockProduct.currentStock === null ? 'Unconfirmed' : `${selectedQuickStockProduct.currentStock} units`}`
            : undefined
        }
      >
        {selectedQuickStockProduct && (
          <>
            <form onSubmit={handleQuickRestockSubmit} className="space-y-3">
              <div>
                <label htmlFor="quick-stock-count" className="text-xs font-semibold text-[#183B57] block mb-1">
                  Counted on-hand quantity:
                </label>
                <p className="text-[11px] text-[#62798C] mb-1.5">
                  Sets the exact stock count and records it in stock history. For deliveries, use Low Stock → Receive instead.
                </p>
                <input
                  id="quick-stock-count"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={quickStockValue}
                  onChange={e => {
                    setQuickStockValue(e.target.value);
                    setQuickStockError(null);
                  }}
                  className="w-full px-3 py-1.5 text-sm font-bold font-mono border border-[#DCE7EF] rounded-lg text-[#10283D] focus:outline-none focus:border-[#275B86]"
                />
                {quickStockError && <p role="alert" className="text-[11px] text-red-600 mt-1">{quickStockError}</p>}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedQuickStockProduct(null)}
                  className="px-3 py-1.5 text-xs text-[#183B57] hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#275B86] hover:bg-[#10283D] rounded-md transition-colors shadow-xs"
                >
                  Save stock count
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </div>
  );
};
