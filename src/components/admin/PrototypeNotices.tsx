import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { listUnconfirmedBusinessDetails } from '../../config/business';
import { listBackupKeys } from '../../lib/storage';
import { useStore } from '../../store/StoreContext';

/**
 * Staff-facing notices: prototype limitations, browser-storage problems and
 * business details that still need confirmation.
 */
export const PrototypeNotices: React.FC = () => {
  const { storageIssues } = useStore();
  const [showDetails, setShowDetails] = useState(false);
  const unconfirmed = listUnconfirmedBusinessDetails();
  const [backupKeys] = useState(listBackupKeys);

  return (
    <div className="space-y-3">
      {storageIssues.length > 0 && (
        <div role="alert" className="p-3 rounded-lg border border-red-200 bg-red-50 text-xs text-red-900 space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Browser storage problems detected
          </div>
          <ul className="list-disc pl-5 space-y-0.5">
            {storageIssues.map(i => (
              <li key={`${i.key}-${i.at}`}>
                <span className="font-mono">{i.key}</span>: {i.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {backupKeys.length > 0 && (
        <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700">
          <strong>Backups of unreadable browser data exist</strong> ({backupKeys.length}). They were kept instead of being deleted:{' '}
          <span className="font-mono break-all">{backupKeys.join(', ')}</span>. They can be inspected in the browser's developer tools
          (Application → Local Storage) and removed there once no longer needed.
        </div>
      )}

      <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Prototype workspace.</strong> Data is stored only in this browser. There is no sign-in, no email/SMS
              sending and no secure audit log. Hidden prices are hidden in the UI only.
            </span>
          </div>
          <button
            type="button"
            aria-expanded={showDetails}
            onClick={() => setShowDetails(v => !v)}
            className="inline-flex items-center gap-1 text-amber-900 font-semibold hover:underline shrink-0"
          >
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Business details to confirm ({unconfirmed.length})
          </button>
        </div>
        {showDetails && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-[11px] min-w-[480px]">
              <thead>
                <tr className="text-amber-800">
                  <th className="py-1 pr-3">Detail</th>
                  <th className="py-1 pr-3">Current value</th>
                  <th className="py-1">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-200">
                {unconfirmed.map(r => (
                  <tr key={r.label}>
                    <td className="py-1 pr-3 font-semibold">{r.label}</td>
                    <td className="py-1 pr-3 font-mono">{r.value}</td>
                    <td className="py-1">{r.note ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[11px]">Edit these in <span className="font-mono">src/config/business.ts</span> and mark them confirmed.</p>
          </div>
        )}
      </div>
    </div>
  );
};
