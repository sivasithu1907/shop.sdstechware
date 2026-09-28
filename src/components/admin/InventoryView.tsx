import React, { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { Search, Check, Bell, Mail, Clock, CheckCircle2, Trash2 } from 'lucide-react';
import { canEditStock } from '../../features/staff/actor';
import { statusLabel } from '../../features/alerts/notifications';
import { DemoNotice } from '../common/Modal';
import { StockAlertRequest } from '../../types';

export const InventoryView: React.FC = () => {
  const {
    activeProducts,
    updateStock,
    currentRole,
    stockAlerts,
    markStockAlertManuallyNotified,
    dismissStockAlert,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'inventory' | 'alerts'>('inventory');
  const [search, setSearch] = useState('');
  const [filterStock, setFilterStock] = useState<'all' | 'in_stock' | 'out_of_stock' | 'unconfirmed' | 'has_alerts'>('all');

  // Customer alerts filter
  const [alertFilterStatus, setAlertFilterStatus] = useState<'all' | 'pending' | 'notified' | 'dismissed'>('all');
  const [alertSearch, setAlertSearch] = useState('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Local draft states for row editing: productId -> { stock: string, isUnconfirmed: boolean }
  const [drafts, setDrafts] = useState<Record<string, { stock: string; isUnconfirmed: boolean }>>({});
  const [savingRows, setSavingRows] = useState<Record<string, boolean>>({});
  const [feedbackRows, setFeedbackRows] = useState<Record<string, { success: boolean; msg: string }>>({});

  const canEdit = canEditStock(currentRole);

  // Count alerts per product
  const getProductAlertCount = (productId: string) => {
    return stockAlerts.filter(a => a.productId === productId && a.status === 'pending').length;
  };

  const pendingAlertsCount = stockAlerts.filter(a => a.status === 'pending').length;

  // Alerts where product is now back in stock (>0)
  const readyToNotifyCount = stockAlerts.filter(a => {
    if (a.status !== 'pending') return false;
    const prod = activeProducts.find(p => p.id === a.productId);
    return prod && prod.stock !== null && prod.stock > 0;
  }).length;

  const showNotificationToast = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => {
      setActionFeedback(null);
    }, 2800);
  };

  const handleNotifyCustomer = (alert: StockAlertRequest) => {
    const res = markStockAlertManuallyNotified(alert.id);
    showNotificationToast(res.success ? `Recorded: ${alert.email} was contacted manually.` : res.error ?? 'Could not update the request.');
  };

  const handleNotifyAllInStock = () => {
    const readyAlerts = stockAlerts.filter(a => {
      if (a.status !== 'pending') return false;
      const prod = activeProducts.find(p => p.id === a.productId);
      return prod && prod.stock !== null && prod.stock > 0;
    });

    const done = readyAlerts.filter(a => markStockAlertManuallyNotified(a.id).success).length;
    showNotificationToast(
      done === readyAlerts.length
        ? `Recorded ${done} request(s) as manually notified.`
        : `Recorded ${done} of ${readyAlerts.length}; some requests could not be updated.`,
    );
  };

  // Initialize draft when editing
  const getDraft = (pId: string, currentStock: number | null) => {
    if (drafts[pId] !== undefined) return drafts[pId];
    return {
      stock: currentStock === null ? '' : currentStock.toString(),
      isUnconfirmed: currentStock === null,
    };
  };

  const handleStockChange = (pId: string, val: string) => {
    setDrafts(prev => ({
      ...prev,
      [pId]: {
        stock: val,
        isUnconfirmed: false,
      },
    }));
  };

  const handleToggleUnconfirmed = (pId: string, isUnconfirmed: boolean) => {
    setDrafts(prev => ({
      ...prev,
      [pId]: {
        stock: isUnconfirmed ? '' : '0',
        isUnconfirmed,
      },
    }));
  };

  const handleSaveRow = (pId: string) => {
    const draft = drafts[pId];
    if (!draft) return;

    setSavingRows(prev => ({ ...prev, [pId]: true }));
    setFeedbackRows(prev => {
      const copy = { ...prev };
      delete copy[pId];
      return copy;
    });

    let newStock: number | null = null;
    if (!draft.isUnconfirmed) {
      if (draft.stock.trim() === '') {
        setFeedbackRows(prev => ({
          ...prev,
          [pId]: { success: false, msg: 'Enter a valid stock number or mark as unconfirmed.' },
        }));
        setSavingRows(prev => ({ ...prev, [pId]: false }));
        return;
      }
      const num = Number(draft.stock);
      if (!Number.isInteger(num) || num < 0) {
        setFeedbackRows(prev => ({
          ...prev,
          [pId]: { success: false, msg: 'Stock must be a non-negative whole integer.' },
        }));
        setSavingRows(prev => ({ ...prev, [pId]: false }));
        return;
      }
      newStock = num;
    }

    const res = updateStock(pId, newStock, 'Inventory sheet stock count');
    setSavingRows(prev => ({ ...prev, [pId]: false }));

    if (res.success) {
      setFeedbackRows(prev => ({
        ...prev,
        [pId]: { success: true, msg: res.unchanged ? 'No change.' : 'Stock count saved to history.' },
      }));
      setTimeout(() => {
        setFeedbackRows(prev => {
          const copy = { ...prev };
          delete copy[pId];
          return copy;
        });
      }, 2000);
    } else {
      setFeedbackRows(prev => ({
        ...prev,
        [pId]: { success: false, msg: res.error || 'Failed to update stock.' },
      }));
    }
  };

  // Filter products
  const filtered = activeProducts.filter(p => {
    if (filterStock === 'in_stock' && (p.stock === null || p.stock === 0)) return false;
    if (filterStock === 'out_of_stock' && p.stock !== 0) return false;
    if (filterStock === 'unconfirmed' && p.stock !== null) return false;
    if (filterStock === 'has_alerts' && getProductAlertCount(p.id) === 0) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.model.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filter alerts
  const filteredAlerts = stockAlerts.filter(a => {
    if (alertFilterStatus !== 'all' && a.status !== alertFilterStatus) return false;
    if (alertSearch.trim()) {
      const q = alertSearch.toLowerCase();
      return (
        a.email.toLowerCase().includes(q) ||
        a.productModel.toLowerCase().includes(q) ||
        a.productBrand.toLowerCase().includes(q) ||
        a.productSku.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Navigation */}
      <div className="bg-white p-5 rounded-lg border border-[#DCE7EF] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-[#10283D] uppercase tracking-wider flex items-center gap-2">
              <span>Inventory &amp; Stock Operations</span>
              {pendingAlertsCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  <Bell className="w-3 h-3 text-amber-600" />
                  {pendingAlertsCount} Restock Alert{pendingAlertsCount > 1 ? 's' : ''}
                </span>
              )}
            </h2>
            <p className="text-xs text-[#62798C] mt-0.5">
              Record physical stock counts (saved to stock history) and track customer back-in-stock requests. The app does not send emails.
              {currentRole === 'stock_editor' && ' (Stock Editor mode: Stock update access enabled).'}
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1 bg-[#F7FAFD] p-1 border border-[#DCE7EF] rounded-lg">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                activeTab === 'inventory'
                  ? 'bg-white text-[#10283D] shadow-xs border border-[#DCE7EF]'
                  : 'text-[#62798C] hover:text-[#10283D]'
              }`}
            >
              Physical Stock ({activeProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                activeTab === 'alerts'
                  ? 'bg-[#275B86] text-white shadow-xs'
                  : 'text-[#62798C] hover:text-[#10283D]'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Restock Requests</span>
              {pendingAlertsCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    activeTab === 'alerts' ? 'bg-white text-[#275B86]' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {pendingAlertsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Global Action Feedback Toast */}
        {actionFeedback && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}
      </div>

      {/* TAB 1: PHYSICAL INVENTORY VIEW */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#62798C]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter inventory by model, brand, or SKU..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-[#DCE7EF] rounded-md text-[#183B57] focus:outline-none focus:border-[#275B86]"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={filterStock}
                onChange={e => setFilterStock(e.target.value as any)}
                className="text-xs bg-white border border-[#DCE7EF] rounded px-3 py-2 text-[#183B57] focus:outline-none focus:border-[#275B86] font-medium"
              >
                <option value="all">All Inventory ({activeProducts.length})</option>
                <option value="in_stock">In Stock (&gt;0)</option>
                <option value="out_of_stock">Out of Stock (0)</option>
                <option value="unconfirmed">Unconfirmed (Blank)</option>
                <option value="has_alerts">Has Restock Requests ({stockAlerts.filter(a => a.status === 'pending').length})</option>
              </select>
            </div>
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-lg border border-[#DCE7EF] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#183B57]">
                <thead className="bg-[#F7FAFD] border-b border-[#DCE7EF] text-[11px] font-bold text-[#62798C] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Item Identification</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-4">Restock Requests</th>
                    <th className="py-3 px-4 text-center">Physical Count</th>
                    <th className="py-3 px-4 text-right">Update Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE7EF]">
                  {filtered.map(product => {
                    const draft = getDraft(product.id, product.stock);
                    const isSaving = savingRows[product.id];
                    const feedback = feedbackRows[product.id];
                    const pendingAlerts = getProductAlertCount(product.id);

                    // Check if changed
                    const originalStr = product.stock === null ? '' : product.stock.toString();
                    const isChanged =
                      draft.isUnconfirmed !== (product.stock === null) ||
                      (!draft.isUnconfirmed && draft.stock !== originalStr);

                    return (
                      <tr key={product.id} className="hover:bg-[#F7FAFD]/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#10283D]">{product.model}</div>
                          <div className="text-[11px] text-[#62798C]">
                            {product.brand} · <span className="font-mono">{product.sku}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-[#62798C]">
                          {product.category}
                        </td>

                        <td className="py-3 px-4">
                          {product.stock === null ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Unconfirmed
                            </span>
                          ) : product.stock === 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-red-600 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              Out of stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              In stock ({product.stock} units)
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {pendingAlerts > 0 ? (
                            <button
                              onClick={() => {
                                setActiveTab('alerts');
                                setAlertSearch(product.model);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
                              title="Click to view awaiting customer emails"
                            >
                              <Bell className="w-3 h-3 text-amber-600" />
                              <span>{pendingAlerts} waiting</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">0 requests</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                            <input
                              type="number"
                              disabled={!canEdit || draft.isUnconfirmed}
                              min="0"
                              step="1"
                              value={draft.isUnconfirmed ? '' : draft.stock}
                              onChange={e => handleStockChange(product.id, e.target.value)}
                              placeholder="Qty"
                              className="w-20 px-2 py-1 text-center font-mono font-bold text-xs border border-[#DCE7EF] rounded bg-[#F7FAFD] disabled:bg-slate-100 disabled:opacity-60 text-[#10283D] focus:outline-none focus:border-[#275B86]"
                            />

                            <label className="flex items-center gap-1 text-[11px] text-[#62798C] cursor-pointer whitespace-nowrap">
                              <input
                                type="checkbox"
                                disabled={!canEdit}
                                checked={draft.isUnconfirmed}
                                onChange={e => handleToggleUnconfirmed(product.id, e.target.checked)}
                                className="rounded border-slate-300 text-[#275B86]"
                              />
                              <span>Unconfirmed</span>
                            </label>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {feedback && (
                              <span
                                className={`text-[11px] font-medium ${
                                  feedback.success ? 'text-emerald-700' : 'text-red-600'
                                }`}
                              >
                                {feedback.msg}
                              </span>
                            )}

                            <button
                              disabled={!canEdit || isSaving || !isChanged}
                              onClick={() => handleSaveRow(product.id)}
                              className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                                isChanged
                                  ? 'bg-[#275B86] hover:bg-[#10283D] text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-400 cursor-default'
                              }`}
                            >
                              {isSaving ? 'Saving...' : 'Save Stock'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <div className="p-8 text-center text-xs text-[#62798C]">
                  No inventory records matching your query.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMER RESTOCK REQUESTS MANAGEMENT VIEW */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <DemoNotice>
            Customers who asked to be told about restocks are listed here. <strong>This prototype never sends emails.</strong> Contact
            customers yourself (the email address opens your mail app), then use <em>Mark as manually notified</em> to record it.
          </DemoNotice>
          {/* Quick Metrics Bar & Batch Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-lg border border-[#DCE7EF] shadow-xs">
              <span className="text-[11px] font-semibold text-[#62798C] block uppercase tracking-wider">
                Total Requests
              </span>
              <span className="text-xl font-bold text-[#10283D] font-mono mt-0.5 block">
                {stockAlerts.length}
              </span>
              <span className="text-[10px] text-slate-400">All back-in-stock requests saved in this browser</span>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-[#DCE7EF] shadow-xs">
              <span className="text-[11px] font-semibold text-amber-700 block uppercase tracking-wider">
                Pending Restock
              </span>
              <span className="text-xl font-bold text-amber-700 font-mono mt-0.5 block">
                {pendingAlertsCount}
              </span>
              <span className="text-[10px] text-slate-400">Customers awaiting inventory availability</span>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-[#DCE7EF] shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold text-emerald-700 block uppercase tracking-wider">
                  Ready to contact
                </span>
                <span className="text-xl font-bold text-emerald-700 font-mono mt-0.5 block">
                  {readyToNotifyCount}
                </span>
                <span className="text-[10px] text-slate-400">In stock again — contact these customers yourself</span>
              </div>
              {readyToNotifyCount > 0 && (
                <button
                  onClick={handleNotifyAllInStock}
                  className="mt-2 text-xs font-semibold px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors flex items-center justify-center gap-1 shadow-xs"
                >
                  <Check className="w-3 h-3" />
                  <span>Mark {readyToNotifyCount} as manually notified</span>
                </button>
              )}
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#62798C]" />
              <input
                type="text"
                value={alertSearch}
                onChange={e => setAlertSearch(e.target.value)}
                placeholder="Search by customer email, model, or SKU..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-[#DCE7EF] rounded-md text-[#183B57] focus:outline-none focus:border-[#275B86]"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={alertFilterStatus}
                onChange={e => setAlertFilterStatus(e.target.value as any)}
                className="text-xs bg-white border border-[#DCE7EF] rounded px-3 py-2 text-[#183B57] focus:outline-none focus:border-[#275B86] font-medium"
              >
                <option value="all">All Request Statuses ({stockAlerts.length})</option>
                <option value="pending">Pending ({stockAlerts.filter(a => a.status === 'pending').length})</option>
                <option value="notified">Manually notified ({stockAlerts.filter(a => a.status === 'notified').length})</option>
                <option value="dismissed">Dismissed ({stockAlerts.filter(a => a.status === 'dismissed').length})</option>
              </select>
            </div>
          </div>

          {/* Requests Table */}
          <div className="bg-white rounded-lg border border-[#DCE7EF] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#183B57]">
                <thead className="bg-[#F7FAFD] border-b border-[#DCE7EF] text-[11px] font-bold text-[#62798C] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Customer Email</th>
                    <th className="py-3 px-4">Target Product</th>
                    <th className="py-3 px-4">Current Stock</th>
                    <th className="py-3 px-4">Date Requested</th>
                    <th className="py-3 px-4">Alert Status</th>
                    <th className="py-3 px-4 text-right">Staff Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE7EF]">
                  {filteredAlerts.map(alert => {
                    const product = activeProducts.find(p => p.id === alert.productId);
                    const isInStock = product && product.stock !== null && product.stock > 0;

                    return (
                      <tr key={alert.id} className="hover:bg-[#F7FAFD]/70 transition-colors">
                        {/* Customer Email */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 font-semibold text-[#10283D]">
                            <Mail className="w-3.5 h-3.5 text-[#275B86]" />
                            <a
                              href={`mailto:${alert.email}`}
                              className="hover:underline hover:text-[#275B86]"
                              title={`Direct email to ${alert.email}`}
                            >
                              {alert.email}
                            </a>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {alert.id.slice(0, 14)}
                          </span>
                        </td>

                        {/* Product Model & SKU */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#10283D]">{alert.productModel}</div>
                          <div className="text-[11px] text-[#62798C]">
                            {alert.productBrand} · <span className="font-mono">{alert.productSku}</span>
                          </div>
                        </td>

                        {/* Current Real-time Stock */}
                        <td className="py-3 px-4">
                          {product ? (
                            product.stock === null ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Unconfirmed
                              </span>
                            ) : product.stock === 0 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-red-600 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                Out of stock (0)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Back in stock ({product.stock} units)
                              </span>
                            )
                          ) : (
                            <span className="text-[11px] text-slate-400">Archived</span>
                          )}
                        </td>

                        {/* Date Requested */}
                        <td className="py-3 px-4 text-[#62798C] text-[11px] whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formatDate(alert.createdAt)}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {alert.status === 'pending' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Pending
                            </span>
                          ) : alert.status === 'notified' ? (
                            <>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-600" />
                              {statusLabel('notified')}
                            </span>
                            {alert.statusChangedAt && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {formatDate(alert.statusChangedAt)}
                                {alert.statusChangedBy ? ` · ${alert.statusChangedBy.label}` : ''}
                              </div>
                            )}
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              Dismissed
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {alert.status === 'pending' && (
                              <button
                                onClick={() => handleNotifyCustomer(alert)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                                  isInStock
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                    : 'bg-[#275B86] hover:bg-[#10283D] text-white shadow-xs'
                                }`}
                                title="Use after you have contacted the customer yourself (no message is sent by the app)"
                              >
                                <Check className="w-3 h-3" />
                                <span>Mark as manually notified</span>
                              </button>
                            )}

                            {alert.status === 'pending' && (
                              <button
                                onClick={() => {
                                  const res = dismissStockAlert(alert.id);
                                  showNotificationToast(res.success ? 'Request dismissed.' : res.error ?? 'Could not dismiss the request.');
                                }}
                                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Dismiss request"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {alert.status !== 'pending' && (
                              <span className="text-[11px] text-slate-400 italic">No action needed</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredAlerts.length === 0 && (
                <div className="p-8 text-center text-xs text-[#62798C]">
                  No restock notification requests matching your filters.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
