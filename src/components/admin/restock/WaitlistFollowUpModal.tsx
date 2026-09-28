import React from 'react';
import { Bell, Check, CheckCheck, Copy, Mail } from 'lucide-react';
import { BUSINESS } from '../../../config/business';
import { copyText } from '../../../lib/download';
import { formatDate, formatDateTime } from '../../../lib/format';
import type { Product, StockAlertRequest } from '../../../types';
import { DemoNotice, Modal } from '../../common/Modal';

export interface WaitlistGroup {
  product: Product;
  receivedQuantity: number | null;
  alertIds: string[];
}

interface WaitlistFollowUpModalProps {
  groups: WaitlistGroup[] | null;
  stockAlerts: StockAlertRequest[];
  onClose: () => void;
  canEdit: boolean;
  onMarkNotified: (alertId: string) => { success: boolean; error?: string };
  showToast: (msg: string) => void;
}

export function backInStockMessage(product: Product): { subject: string; body: string } {
  const subject = `${product.brand} ${product.model} is back in stock - ${BUSINESS.legalName.value}`;
  const body = [
    'Hello,',
    '',
    `You asked to be told when ${product.brand} ${product.model} (SKU: ${product.sku}) is available again. It is now back in stock.`,
    '',
    'Please reply to this email if you would like a quotation. Pricing and availability are confirmed in a formal quotation.',
    '',
    'Regards,',
    BUSINESS.legalName.value,
    `${BUSINESS.salesEmail.value} · ${BUSINESS.phone.value.display}`,
  ].join('\n');
  return { subject, body };
}

/**
 * Follow-up list for customers waiting on restocked products. The app does
 * NOT send messages. Staff contact customers themselves (e.g. via the email
 * draft link) and then record it with "Mark as manually notified".
 */
export const WaitlistFollowUpModal: React.FC<WaitlistFollowUpModalProps> = ({
  groups,
  stockAlerts,
  onClose,
  canEdit,
  onMarkNotified,
  showToast,
}) => {
  const isOpen = groups !== null && groups.length > 0;
  const alertById = new Map(stockAlerts.map(a => [a.id, a]));
  const rows = (groups ?? []).flatMap(g =>
    g.alertIds.map(id => ({ group: g, alert: alertById.get(id) })).filter((r): r is { group: WaitlistGroup; alert: StockAlertRequest } => !!r.alert),
  );
  const pendingRows = rows.filter(r => r.alert.status === 'pending');

  const mark = (alert: StockAlertRequest) => {
    const res = onMarkNotified(alert.id);
    showToast(res.success ? `Recorded: ${alert.email} was notified manually.` : res.error ?? 'Could not update the request.');
  };

  const markAll = () => {
    let done = 0;
    const failures: string[] = [];
    for (const r of pendingRows) {
      const res = onMarkNotified(r.alert.id);
      if (res.success) done++;
      else failures.push(`${r.alert.email}: ${res.error}`);
    }
    showToast(
      failures.length === 0
        ? `Recorded ${done} request(s) as manually notified.`
        : `Recorded ${done}; ${failures.length} could not be updated (${failures[0]}).`,
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      zIndexClass="z-[60]"
      maxWidth="max-w-3xl"
      icon={<Bell className="w-4 h-4" />}
      title="Customers waiting for these products"
      description="Stock was received. Contact these customers yourself, then record it here."
      footer={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-[#62798C]">
            {rows.length - pendingRows.length} of {rows.length} request(s) recorded as notified or closed
          </div>
          <div className="flex items-center gap-2 justify-end">
            {canEdit && pendingRows.length > 1 && (
              <button
                type="button"
                onClick={markAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DCE7EF] hover:bg-slate-50 text-[#183B57] rounded text-xs font-semibold"
                title="Use only after you have contacted every customer listed"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all {pendingRows.length} as manually notified</span>
              </button>
            )}
            <button type="button" onClick={onClose} className="px-3.5 py-1.5 text-xs text-white bg-[#10283D] hover:bg-[#275B86] rounded font-semibold">
              Done
            </button>
          </div>
        </div>
      }
    >
      <DemoNotice>
        <strong>No messages are sent by this prototype.</strong> "Open email draft" opens your own email app; "Mark as manually
        notified" only records (with time and demo role) that you contacted the customer.
      </DemoNotice>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {(groups ?? []).map(g => (
          <div key={g.product.id} className="p-3 rounded-lg border border-[#DCE7EF] bg-[#F7FAFD] text-xs">
            <div className="font-bold text-[#10283D] truncate">{g.product.model}</div>
            <div className="text-[10px] text-[#62798C] font-mono">
              {g.product.sku} · {g.product.brand}
            </div>
            <div className="text-[10px] text-[#275B86] font-semibold mt-1">
              {g.receivedQuantity !== null ? `+${g.receivedQuantity} received · ` : ''}On hand now: {g.product.stock ?? 'unconfirmed'}
            </div>
          </div>
        ))}
      </div>

      <div className="border border-[#DCE7EF] rounded-lg overflow-x-auto max-h-72">
        <table className="w-full text-left text-xs min-w-[560px]">
          <thead className="bg-[#F7FAFD] text-[#62798C] uppercase font-semibold text-[10px] tracking-wider border-b border-[#DCE7EF] sticky top-0">
            <tr>
              <th className="py-2 px-3">Customer email</th>
              <th className="py-2 px-3">Product</th>
              <th className="py-2 px-3">Requested</th>
              <th className="py-2 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCE7EF]">
            {rows.map(({ group, alert }) => {
              const msg = backInStockMessage(group.product);
              return (
                <tr key={alert.id}>
                  <td className="py-2.5 px-3 font-mono text-[#10283D]">
                    {alert.email}
                    {alert.isDemoSample && <span className="ml-1 text-[9px] font-sans px-1 rounded bg-slate-100 text-slate-500">demo</span>}
                  </td>
                  <td className="py-2.5 px-3">{alert.productModel}</td>
                  <td className="py-2.5 px-3 text-[#62798C] font-mono text-[11px]">{formatDate(alert.createdAt)}</td>
                  <td className="py-2.5 px-3 text-right">
                    {alert.status === 'pending' ? (
                      <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                        <a
                          href={`mailto:${alert.email}?subject=${encodeURIComponent(msg.subject)}&body=${encodeURIComponent(msg.body)}`}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[#275B86] border border-[#DCE7EF] rounded hover:bg-[#EBF3F8]"
                        >
                          <Mail className="w-3 h-3" /> Open email draft
                        </a>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => mark(alert)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-white bg-[#275B86] hover:bg-[#10283D] rounded"
                          >
                            <Check className="w-3 h-3" /> Mark as manually notified
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <Check className="w-3 h-3" />
                        {alert.status === 'notified' ? 'Manually notified' : 'Dismissed'}
                        {alert.statusChangedAt && <span className="font-normal text-emerald-800/80"> · {formatDateTime(alert.statusChangedAt)}</span>}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {groups && groups[0] && (
        <div className="p-3 bg-[#F7FAFD] rounded-lg border border-[#DCE7EF] text-xs space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-[#10283D] text-[11px] flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-[#275B86]" /> Suggested message (you send it)
            </span>
            <button
              type="button"
              onClick={async () => {
                const m = backInStockMessage(groups[0].product);
                const ok = await copyText(`Subject: ${m.subject}\n\n${m.body}`);
                showToast(ok ? 'Message copied. Paste it into your email or WhatsApp.' : 'Could not copy to clipboard.');
              }}
              className="text-[#275B86] hover:text-[#10283D] hover:underline font-semibold inline-flex items-center gap-1"
            >
              <Copy className="w-3 h-3" /> Copy message
            </button>
          </div>
          <pre className="whitespace-pre-wrap font-sans text-[11px] text-[#62798C]">{backInStockMessage(groups[0].product).body}</pre>
        </div>
      )}
    </Modal>
  );
};
