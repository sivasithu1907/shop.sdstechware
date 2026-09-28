import React, { useState } from 'react';
import { useStore } from '../../store/StoreContext';

import { Shield, UserPlus, AlertCircle, CheckCircle2, UserX, Lock } from 'lucide-react';

export const TeamAccessView: React.FC = () => {
  const { staffList, currentRole, addStaff, updateStaffRole, toggleStaffStatus, revokeStaff } = useStore();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [roleInput, setRoleInput] = useState<'owner' | 'product_manager' | 'stock_editor'>('product_manager');

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // If not owner, display restricted access notice
  if (currentRole !== 'owner') {
    return (
      <div className="bg-white p-8 rounded-lg border border-[#DCE7EF] shadow-sm text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-[#10283D]">Owner Permission Required</h3>
        <p className="text-xs text-[#62798C] max-w-md mx-auto">
          Team Access and staff role administration is restricted to Owner accounts. Switch to the Owner role using the top demo switcher to preview staff management capabilities.
        </p>
      </div>
    );
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    const res = addStaff(nameInput, emailInput, roleInput);
    if (!res.success) {
      setActionError(res.error || 'Failed to add staff member.');
    } else {
      setActionSuccess(`Staff record for ${nameInput} added (demo only — no invitation sent).`);
      setNameInput('');
      setEmailInput('');
      setAddModalOpen(false);
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  const handleRoleChange = (id: string, newRole: 'owner' | 'product_manager' | 'stock_editor') => {
    setActionError(null);
    setActionSuccess(null);
    const res = updateStaffRole(id, newRole);
    if (!res.success) {
      setActionError(res.error || 'Failed to update role.');
    } else {
      setActionSuccess('Staff role updated.');
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  const handleToggleStatus = (id: string) => {
    setActionError(null);
    setActionSuccess(null);
    const res = toggleStaffStatus(id);
    if (!res.success) {
      setActionError(res.error || 'Failed to toggle status.');
    } else {
      setActionSuccess('Staff status updated.');
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  const handleRevoke = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke access for ${name}?`)) return;
    setActionError(null);
    setActionSuccess(null);
    const res = revokeStaff(id);
    if (!res.success) {
      setActionError(res.error || 'Failed to revoke staff access.');
    } else {
      setActionSuccess(`Staff record for ${name} removed.`);
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  const roleTitles = {
    owner: 'Owner',
    product_manager: 'Product Manager',
    stock_editor: 'Stock Editor',
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-lg border border-[#DCE7EF] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#275B86]" />
            <h2 className="text-sm font-bold text-[#10283D] uppercase tracking-wider">
              Team Access &amp; Staff Permissions
            </h2>
          </div>
          <p className="text-xs text-[#62798C] mt-0.5">
            Demo team records for previewing role permissions. These are not login accounts: nobody can sign in with them and no invitations are sent.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#275B86] hover:bg-[#10283D] rounded-md transition-colors shadow-sm self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Action Messages */}
      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-white rounded-lg border border-[#DCE7EF] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#183B57]">
            <thead className="bg-[#F7FAFD] border-b border-[#DCE7EF] text-[11px] font-bold text-[#62798C] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role &amp; Permissions</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE7EF]">
              {staffList.map(staff => {
                const isSelf = staff.isCurrentUser && staff.role === 'owner';

                return (
                  <tr key={staff.id} className="hover:bg-[#F7FAFD]/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#10283D]">
                      <div className="flex items-center gap-2">
                        <span>{staff.name}</span>
                        {staff.isCurrentUser && (
                          <span className="text-[10px] bg-[#10283D] text-white px-1.5 py-0.2 rounded font-normal font-mono">
                            Current Session
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-[#62798C] font-mono">
                      {staff.email}
                    </td>

                    <td className="py-3 px-4">
                      {isSelf ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-[#10283D]">
                          <Shield className="w-3 h-3 text-[#275B86]" />
                          Owner (Self Protected)
                        </span>
                      ) : (
                        <select
                          value={staff.role}
                          onChange={e => handleRoleChange(staff.id, e.target.value as any)}
                          className="text-xs bg-[#F7FAFD] border border-[#DCE7EF] rounded px-2.5 py-1 text-[#10283D] font-medium focus:outline-none focus:border-[#275B86]"
                        >
                          <option value="owner">Owner (Full control)</option>
                          <option value="product_manager">Product Manager (Catalog &amp; Prices)</option>
                          <option value="stock_editor">Stock Editor (Stock counts only)</option>
                        </select>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {staff.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Suspended
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isSelf ? (
                        <span className="text-[11px] text-slate-400 italic">Protected</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(staff.id)}
                            className="text-xs text-[#275B86] hover:underline"
                          >
                            {staff.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            onClick={() => handleRevoke(staff.id, staff.name)}
                            className="text-xs text-red-600 hover:underline flex items-center gap-0.5"
                          >
                            <UserX className="w-3 h-3" />
                            <span>Revoke</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#10283D]/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-[#DCE7EF]">
            <h3 className="text-base font-bold text-[#10283D]">Add Staff Member</h3>
            <p className="text-xs text-[#62798C] mt-1">
              Adds a demo team record in this browser. No account is created and no email is sent.
            </p>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#183B57] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  placeholder="e.g. Nimal Gunaratne"
                  className="w-full px-3 py-2 text-xs border border-[#DCE7EF] rounded bg-[#F7FAFD] focus:outline-none focus:border-[#275B86]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#183B57] mb-1">
                  Corporate Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="e.g. nimal.g@sdstechware.lk"
                  className="w-full px-3 py-2 text-xs border border-[#DCE7EF] rounded bg-[#F7FAFD] focus:outline-none focus:border-[#275B86]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#183B57] mb-1">
                  Assigned Role *
                </label>
                <select
                  value={roleInput}
                  onChange={e => setRoleInput(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-[#DCE7EF] rounded bg-[#F7FAFD] focus:outline-none focus:border-[#275B86]"
                >
                  <option value="product_manager">Product Manager (Catalog, Specs, Prices, Stock)</option>
                  <option value="stock_editor">Stock Editor (Stock counts only)</option>
                  <option value="owner">Owner (Full administrative permissions)</option>
                </select>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#183B57] hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-[#275B86] hover:bg-[#10283D] text-white rounded font-semibold transition-colors"
                >
                  Confirm Addition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
