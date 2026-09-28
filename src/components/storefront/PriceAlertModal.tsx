import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/StoreContext';
import type { Product, PriceAlertRequest } from '../../types';
import { getPublicPrice } from '../../features/catalog/pricing';
import { readString, STORAGE_KEYS, writeString } from '../../lib/storage';
import { useDialog } from '../../hooks/useDialog';
import {
  Bell,
  BellRing,
  TrendingDown,
  Mail,
  Check,
  X,
  AlertCircle,
  ShieldCheck,
  DollarSign,
  ArrowDownRight,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const {
    formatLKR,
    addPriceAlert,
    removePriceAlert,
    getPriceAlertsForProduct,
    showToast,
  } = useStore();

  const activeAlerts = useMemo(() => {
    return getPriceAlertsForProduct(product.id);
  }, [getPriceAlertsForProduct, product.id]);

  const existingAlert = activeAlerts[0] as PriceAlertRequest | undefined;
  const dialogRef = useDialog<HTMLDivElement>(isOpen, onClose);

  // Selected discount preset or custom
  const [selectedPreset, setSelectedPreset] = useState<'any' | '5' | '10' | '15' | 'custom'>(() => {
    if (existingAlert?.dropPercentage) {
      const p = String(existingAlert.dropPercentage);
      if (p === '5' || p === '10' || p === '15') return p as '5' | '10' | '15';
      return 'custom';
    }
    return 'any';
  });

  // Only a PUBLIC price may be used here; hidden prices never reach this modal.
  const basePrice = getPublicPrice(product) ?? 0;

  const [customPriceInput, setCustomPriceInput] = useState<string>(() => {
    if (existingAlert?.targetPrice && basePrice > 0) {
      return String(existingAlert.targetPrice);
    }
    return basePrice > 0 ? String(Math.round(basePrice * 0.9)) : '';
  });

  const [email, setEmail] = useState<string>(() => {
    if (existingAlert) return existingAlert.email;
    return readString(STORAGE_KEYS.USER_ALERT_EMAIL) ?? '';
  });

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Calculate target price and savings
  const { targetPrice, savingsAmount, dropPercent } = useMemo(() => {
    if (!basePrice || basePrice <= 0) {
      return { targetPrice: null, savingsAmount: null, dropPercent: null };
    }

    if (selectedPreset === 'any') {
      return {
        targetPrice: null,
        savingsAmount: null,
        dropPercent: null,
      };
    }

    if (selectedPreset === '5') {
      const target = Math.round(basePrice * 0.95);
      return {
        targetPrice: target,
        savingsAmount: basePrice - target,
        dropPercent: 5,
      };
    }

    if (selectedPreset === '10') {
      const target = Math.round(basePrice * 0.9);
      return {
        targetPrice: target,
        savingsAmount: basePrice - target,
        dropPercent: 10,
      };
    }

    if (selectedPreset === '15') {
      const target = Math.round(basePrice * 0.85);
      return {
        targetPrice: target,
        savingsAmount: basePrice - target,
        dropPercent: 15,
      };
    }

    // Custom
    const parsed = parseFloat(customPriceInput);
    if (!isNaN(parsed) && parsed > 0) {
      const savings = Math.max(0, basePrice - parsed);
      const percent = Number((((basePrice - parsed) / basePrice) * 100).toFixed(1));
      return {
        targetPrice: parsed,
        savingsAmount: savings,
        dropPercent: percent > 0 ? percent : null,
      };
    }

    return { targetPrice: null, savingsAmount: null, dropPercent: null };
  }, [basePrice, selectedPreset, customPriceInput]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg('Please provide a corporate or work email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address (e.g. name@company.lk).');
      return;
    }

    if (selectedPreset === 'custom') {
      const customVal = parseFloat(customPriceInput);
      if (isNaN(customVal) || customVal <= 0) {
        setErrorMsg('Please specify a valid positive target price.');
        return;
      }
      if (basePrice > 0 && customVal >= basePrice) {
        setErrorMsg('Target price must be lower than the current price to trigger a price drop notification.');
        return;
      }
    }

    const finalDropPercent = dropPercent !== null ? dropPercent : undefined;
    const res = addPriceAlert(product.id, trimmedEmail, targetPrice, finalDropPercent);

    if (res.success) {
      writeString(STORAGE_KEYS.USER_ALERT_EMAIL, trimmedEmail);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } else {
      setErrorMsg(res.error || 'Failed to register price alert. Please try again.');
    }
  };

  const handleCancelAlert = (id: string) => {
    removePriceAlert(id);
    showToast(`Price alert request removed for ${product.model}.`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-60 overflow-y-auto bg-[#10283D]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Price alert request"
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-2xl border border-[#DCE7EF] w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col text-[#183B57] focus:outline-none"
      >
        {/* Header */}
        <div className="bg-[#10283D] text-white px-5 py-4 flex items-center justify-between border-b border-[#275B86]/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#275B86] to-[#489DCA] flex items-center justify-center text-white shadow-md">
              <BellRing className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Price Alert Request
                </h3>
                <span className="bg-amber-400/20 text-amber-200 text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-300/40 font-semibold">
                  Demo
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Save the price you are hoping for. Nothing is monitored or emailed automatically.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Active Alert Banner if already registered */}
          {existingAlert && !isSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Request saved
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                  This browser only
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-snug">
                Saved for <strong>{existingAlert.email}</strong>
                {existingAlert.targetPrice ? ` with a target of ${formatLKR(existingAlert.targetPrice)}` : ' for any price reduction'}.
                No automatic monitoring or emails exist in this prototype; SDS Techware staff may follow up manually.
              </p>
              <div className="pt-1 flex items-center justify-between border-t border-emerald-200/60 text-[11px]">
                <span className="text-emerald-700">Remove this request?</span>
                <button
                  type="button"
                  onClick={() => handleCancelAlert(existingAlert.id)}
                  className="text-red-700 hover:text-red-900 font-semibold flex items-center gap-1 underline cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* Product Quick Profile */}
          <div className="flex items-center gap-3.5 p-3 bg-[#F8FAFC] border border-[#DCE7EF] rounded-xl">
            <div className="w-14 h-14 bg-white border border-[#DCE7EF] rounded-lg p-1.5 flex items-center justify-center shrink-0">
              {product.images && product.images[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.model}
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              ) : (
                <DollarSign className="w-6 h-6 text-slate-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold text-[#275B86] tracking-wider block">
                {product.brand} · {product.category}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#10283D] truncate">
                {product.model}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                {basePrice > 0 ? (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[11px] text-slate-500">Current:</span>
                    <span className="text-xs sm:text-sm font-bold font-mono text-[#10283D]">
                      {formatLKR(basePrice)}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-[#275B86] font-semibold">
                    Price on Request
                  </span>
                )}
                <span className="text-[10px] text-slate-400 font-mono">
                  SKU: {product.sku}
                </span>
              </div>
            </div>
          </div>

          {/* Price alerts need a published price (never a hidden one). */}
          {basePrice <= 0 ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
              Price alerts are only available for items with a published price. This item is priced on request — add it to your
              quotation list instead.
            </div>
          ) : isSuccess ? (
            <div className="py-8 text-center space-y-3 animate-fadeIn">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-[#10283D]">
                Request saved
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Your price alert request for <strong>{email}</strong> is saved in this browser. This prototype does not monitor prices or send
                emails automatically.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Threshold Selection */}
              {basePrice > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#10283D] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <TrendingDown className="w-3.5 h-3.5 text-[#275B86]" />
                      Tell me if the price drops by:
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      Select drop threshold
                    </span>
                  </label>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPreset('any')}
                      className={`p-2 rounded-xl border text-xs font-medium transition-all text-center cursor-pointer ${
                        selectedPreset === 'any'
                          ? 'bg-[#275B86] text-white border-[#275B86] font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      Any Drop
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPreset('5')}
                      className={`p-2 rounded-xl border text-xs font-medium transition-all text-center cursor-pointer ${
                        selectedPreset === '5'
                          ? 'bg-[#275B86] text-white border-[#275B86] font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      5% Drop
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPreset('10')}
                      className={`p-2 rounded-xl border text-xs font-medium transition-all text-center cursor-pointer ${
                        selectedPreset === '10'
                          ? 'bg-[#275B86] text-white border-[#275B86] font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      10% Drop
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPreset('15')}
                      className={`p-2 rounded-xl border text-xs font-medium transition-all text-center cursor-pointer ${
                        selectedPreset === '15'
                          ? 'bg-[#275B86] text-white border-[#275B86] font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      15% Drop
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPreset('custom')}
                      className={`col-span-2 sm:col-span-1 p-2 rounded-xl border text-xs font-medium transition-all text-center cursor-pointer ${
                        selectedPreset === 'custom'
                          ? 'bg-[#275B86] text-white border-[#275B86] font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      Custom
                    </button>
                  </div>

                  {/* Custom Target Price Input */}
                  {selectedPreset === 'custom' && (
                    <div className="pt-2 space-y-1 animate-fadeIn">
                      <label className="text-[11px] font-semibold text-slate-600 block">
                        Enter Target Price (LKR) Below {formatLKR(basePrice)}:
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          LKR
                        </span>
                        <input
                          type="number"
                          value={customPriceInput}
                          onChange={e => setCustomPriceInput(e.target.value)}
                          placeholder="e.g. 35000"
                          className="w-full bg-white border border-slate-300 focus:border-[#275B86] focus:ring-1 focus:ring-[#275B86] rounded-xl pl-12 pr-4 py-2 text-xs font-mono text-[#10283D] placeholder-slate-400 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Live Target Summary Pill */}
                  <div className="p-3 bg-[#EBF3F8]/70 border border-[#275B86]/20 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Your Target Trigger:</span>
                      <span className="font-bold font-mono text-[#10283D]">
                        {selectedPreset === 'any'
                          ? 'Any price below current'
                          : targetPrice
                          ? `At or below ${formatLKR(targetPrice)}`
                          : 'Custom threshold'}
                      </span>
                    </div>
                    {savingsAmount !== null && savingsAmount > 0 && (
                      <div className="flex items-center justify-between text-[11px] text-emerald-700 font-medium">
                        <span className="flex items-center gap-1">
                          <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                          Difference from current price:
                        </span>
                        <span className="font-mono font-bold">
                          {formatLKR(savingsAmount)} {dropPercent ? `(${dropPercent}%)` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Corporate Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#10283D] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#275B86]" />
                    Your email:
                  </span>
                  <span className="text-[10px] text-slate-400">Stored in this browser only</span>
                </label>

                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="Enter procurement / work email (e.g. buyer@company.lk)..."
                    className="w-full bg-white border border-slate-300 focus:border-[#275B86] focus:ring-1 focus:ring-[#275B86] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#10283D] placeholder-slate-400 outline-none transition-all shadow-2xs"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Trust Badge */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  Prototype: requests are not monitored and no emails are sent. A future backend would need consent and a messaging service.
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#275B86] hover:bg-[#10283D] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{existingAlert ? 'Update request' : 'Save request'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
