import React, { useEffect, useState } from 'react';
import { Check, Layers, Minus, Plus, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { LOW_STOCK } from '../../../config/settings';

/** Numeric threshold field that commits on Enter/blur and reverts on Escape. */
export const ThresholdInput: React.FC<{
  value: number;
  onCommit: (v: number) => void;
  className?: string;
  ariaLabel: string;
}> = ({ value, onCommit, className, ariaLabel }) => {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const parsed = parseInt(draft, 10);
    if (Number.isFinite(parsed) && parsed > 0) onCommit(parsed);
    else setDraft(String(value));
  };
  return (
    <input
      type="number"
      min={LOW_STOCK.minThreshold}
      max={LOW_STOCK.maxThreshold}
      value={draft}
      aria-label={ariaLabel}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => {
        if (e.key === 'Enter') commit();
        else if (e.key === 'Escape') {
          e.stopPropagation();
          setDraft(String(value));
        }
      }}
      className={className}
    />
  );
};

const PRESET_OPTIONS = [
  { value: 3, label: '≤ 3', badge: 'Critical', description: 'Immediate stockout risk' },
  { value: 5, label: '≤ 5', badge: 'Lean', description: 'Just-in-time stock buffer' },
  { value: 8, label: '≤ 8', badge: 'Default', description: 'Standard safety stock' },
  { value: 10, label: '≤ 10', badge: 'Buffer', description: 'Comfortable stock buffer' },
  { value: 15, label: '≤ 15', badge: 'High Turn', description: 'Fast-moving catalogue models' },
  { value: 20, label: '≤ 20', badge: 'Deep Reserve', description: 'Long lead-time procurement' },
];

interface ThresholdConfigPanelProps {
  threshold: number;
  onApplyThreshold: (v: number, announce?: boolean) => void;
  onResetDefault: () => void;
  onClose: () => void;
  countForThreshold: (v: number) => number;
  categoryNames: string[];
  categoryThresholds: Record<string, number>;
  effectiveThresholdFor: (category: string) => number;
  countForCategory: (category: string) => number;
  onSetCategoryThreshold: (category: string, v: number) => void;
  onResetCategoryThreshold: (category: string) => void;
  onResetAllCategoryThresholds: () => void;
  includeUnconfirmed: boolean;
  setIncludeUnconfirmed: (v: boolean) => void;
  summary: { all: number; outOfStock: number; critical: number };
}

/** Inline low-stock threshold configuration (global + per category). */
export const ThresholdConfigPanel: React.FC<ThresholdConfigPanelProps> = p => {
  const { threshold } = p;
  const stepBtn =
    'w-7 h-7 flex items-center justify-center text-[#183B57] hover:bg-slate-200/70 rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer';
  return (
    <div className="mt-4 pt-4 bg-linear-to-b from-[#F7FAFD] to-white p-4 sm:p-5 rounded-lg border border-[#DCE7EF] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#DCE7EF]">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-1 rounded bg-[#EBF3F8] text-[#275B86]">
              <SlidersHorizontal className="w-4 h-4" />
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#10283D]">Low Stock Threshold Settings</h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-[#62798C] border border-slate-200">
              Saved in this browser
            </span>
          </div>
          <p className="text-xs text-[#62798C]">
            Choose which quantity flags a product as low stock. Thresholds only change what is highlighted; they never change stock.
          </p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={p.onResetDefault}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#62798C] hover:text-[#183B57] bg-white border border-[#DCE7EF] hover:border-slate-300 rounded cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to Default ({LOW_STOCK.defaultThreshold})</span>
          </button>
          <button
            type="button"
            onClick={p.onClose}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-[#10283D] hover:bg-[#275B86] rounded cursor-pointer transition-colors shadow-xs"
          >
            <Check className="w-3 h-3" />
            <span>Done</span>
          </button>
        </div>
      </div>

      <div>
        <div className="text-[11px] font-semibold text-[#183B57] mb-2 flex flex-wrap items-center justify-between gap-1">
          <span>Preset strategies:</span>
          <span className="text-[#62798C] font-normal text-[10px]">Counts show currently matching products</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {PRESET_OPTIONS.map(opt => {
            const count = p.countForThreshold(opt.value);
            const selected = threshold === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={selected}
                onClick={() => p.onApplyThreshold(opt.value)}
                className={`p-2.5 rounded-md border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selected
                    ? 'bg-[#10283D] border-[#10283D] text-white shadow-xs ring-2 ring-[#275B86]/20'
                    : 'bg-white border-[#DCE7EF] hover:border-[#275B86] hover:bg-[#F7FAFD]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-xs font-bold font-mono ${selected ? 'text-white' : 'text-[#10283D]'}`}>{opt.label}</span>
                  <span className={`text-[9px] font-semibold px-1 rounded ${selected ? 'bg-[#275B86] text-white' : 'bg-slate-100 text-[#62798C]'}`}>
                    {opt.badge}
                  </span>
                </div>
                <div className={`text-[10px] leading-tight ${selected ? 'text-slate-200' : 'text-[#62798C]'}`}>{opt.description}</div>
                <div
                  className={`text-[10px] font-mono font-bold mt-2 pt-1 border-t ${
                    selected ? 'border-white/20 text-amber-300' : 'border-slate-100 text-[#275B86]'
                  }`}
                >
                  {count} {count === 1 ? 'item' : 'items'} flagged
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        <div className="bg-white p-3 rounded-md border border-[#DCE7EF] space-y-2">
          <span className="text-[11px] font-semibold text-[#183B57] block">Fine adjustment:</span>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-[#F7FAFD] border border-[#DCE7EF] rounded p-0.5">
              <button type="button" onClick={() => p.onApplyThreshold(threshold - 5)} disabled={threshold <= 5} className={`px-2 py-1 text-[11px] font-mono ${stepBtn} w-auto`} aria-label="Decrease threshold by 5">
                -5
              </button>
              <button type="button" onClick={() => p.onApplyThreshold(threshold - 1)} disabled={threshold <= 1} className={stepBtn} aria-label="Decrease threshold by 1">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <ThresholdInput
                value={threshold}
                onCommit={v => p.onApplyThreshold(v)}
                ariaLabel="Global low stock threshold"
                className="w-16 text-center text-sm font-mono font-bold bg-white border border-[#275B86] rounded py-1 text-[#10283D] focus:outline-none"
              />
              <button type="button" onClick={() => p.onApplyThreshold(threshold + 1)} disabled={threshold >= LOW_STOCK.maxThreshold} className={stepBtn} aria-label="Increase threshold by 1">
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => p.onApplyThreshold(threshold + 5)} disabled={threshold >= LOW_STOCK.maxThreshold - 5} className={`px-2 py-1 text-[11px] font-mono ${stepBtn} w-auto`} aria-label="Increase threshold by 5">
                +5
              </button>
            </div>
            <span className="text-xs text-[#62798C]">units or fewer is flagged</span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-md border border-[#DCE7EF] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#183B57]">
            <label htmlFor="threshold-slider">Range slider:</label>
            <span className="font-mono text-[#275B86] font-bold">Current: {threshold} units</span>
          </div>
          <input
            id="threshold-slider"
            type="range"
            min="1"
            max="50"
            step="1"
            value={Math.min(50, threshold)}
            onChange={e => p.onApplyThreshold(parseInt(e.target.value, 10), false)}
            className="w-full accent-[#275B86] cursor-pointer"
          />
          <div className="flex justify-between text-[9px] font-mono text-slate-400">
            <span>1</span>
            <span>8 (default)</span>
            <span>25</span>
            <span>50</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-md border border-[#DCE7EF] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#DCE7EF]">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-[#EBF3F8] text-[#275B86]">
                <Layers className="w-3.5 h-3.5" />
              </span>
              <h4 className="text-xs font-bold text-[#10283D] uppercase tracking-wider">Category overrides</h4>
            </div>
            <p className="text-[11px] text-[#62798C]">Set a different threshold per category. Categories without an override use the global value.</p>
          </div>
          <button
            type="button"
            onClick={p.onResetAllCategoryThresholds}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#62798C] hover:text-[#183B57] bg-[#F7FAFD] border border-[#DCE7EF] hover:border-slate-300 rounded cursor-pointer transition-colors shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset all overrides</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 pt-1">
          {p.categoryNames.map(cat => {
            const current = p.effectiveThresholdFor(cat);
            const overridden = p.categoryThresholds[cat] !== undefined;
            const count = p.countForCategory(cat);
            return (
              <div
                key={cat}
                className={`p-3 rounded-md border text-xs transition-all ${overridden ? 'bg-white border-[#275B86]/40 shadow-xs' : 'bg-[#F7FAFD]/70 border-[#DCE7EF]'}`}
              >
                <div className="flex items-start justify-between gap-1 mb-2">
                  <div className="min-w-0">
                    <div className="font-bold text-[#10283D] truncate" title={cat}>
                      {cat}
                    </div>
                    <span
                      className={`inline-block mt-0.5 px-1.5 rounded text-[10px] font-mono font-medium ${
                        overridden ? 'bg-[#EBF3F8] text-[#275B86]' : 'bg-slate-200/60 text-[#62798C]'
                      }`}
                    >
                      {overridden ? 'Category override' : 'Global default'}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      count > 0 ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {count} low
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#DCE7EF]/70">
                  <span className="text-[11px] text-[#62798C] font-mono">Alert ≤</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => p.onSetCategoryThreshold(cat, current - 1)}
                      disabled={current <= 1}
                      className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 text-[#183B57] hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                      aria-label={`Decrease ${cat} threshold`}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <ThresholdInput
                      value={current}
                      onCommit={v => p.onSetCategoryThreshold(cat, v)}
                      ariaLabel={`${cat} low stock threshold`}
                      className="w-12 text-center font-mono font-bold text-xs bg-white border border-[#DCE7EF] focus:border-[#275B86] rounded py-0.5 text-[#10283D] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => p.onSetCategoryThreshold(cat, current + 1)}
                      disabled={current >= LOW_STOCK.maxThreshold}
                      className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 text-[#183B57] hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                      aria-label={`Increase ${cat} threshold`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    {overridden && (
                      <button
                        type="button"
                        onClick={() => p.onResetCategoryThreshold(cat)}
                        className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 text-[#62798C] hover:text-[#183B57] hover:bg-slate-200 cursor-pointer ml-0.5"
                        aria-label={`Remove ${cat} override`}
                        title="Remove override (use global threshold)"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-3 bg-white rounded-md border border-[#DCE7EF] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <span className="text-[#183B57]">
          Flagging products with stock <strong>≤ {threshold} units</strong> (or their category override):{' '}
          <strong>{p.summary.all}</strong> items — {p.summary.outOfStock} out of stock, {p.summary.critical} critical.
        </span>
        <label className="flex items-center gap-1.5 text-xs text-[#183B57] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={p.includeUnconfirmed}
            onChange={e => p.setIncludeUnconfirmed(e.target.checked)}
            className="rounded border-[#DCE7EF] text-[#275B86] focus:ring-0 cursor-pointer"
          />
          <span className="text-[11px]">Include products with unconfirmed stock</span>
        </label>
      </div>
    </div>
  );
};
