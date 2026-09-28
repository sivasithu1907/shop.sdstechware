import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/StoreContext';
import { computeBudgetStats, getPublicPrice } from '../../features/catalog/pricing';
import {
  Calculator,
  RotateCcw,
  Users,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PriceRangeCalculatorProps {
  compact?: boolean;
  onFilterApplied?: () => void;
}

export const PriceRangeCalculator: React.FC<PriceRangeCalculatorProps> = ({
  compact = false,
  onFilterApplied,
}) => {
  const {
    publishedProducts,
    budgetFilter,
    setBudgetFilter,
    resetBudgetFilter,
    catalogPriceBounds,
    isBudgetFilterActive,
    formatLKR,
  } = useStore();

  const [mode, setMode] = useState<'ceiling' | 'bracket'>('ceiling');
  const [showEstimator, setShowEstimator] = useState<boolean>(false);
  const [teamUnits, setTeamUnits] = useState<number>(5);

  const minBound = catalogPriceBounds.min;
  const maxBound = catalogPriceBounds.max;

  // Local inputs for numeric editing
  const [minInput, setMinInput] = useState<string>(String(budgetFilter.min));
  const [maxInput, setMaxInput] = useState<string>(String(budgetFilter.max));

  // Sync inputs when filter resets or changes externally
  React.useEffect(() => {
    setMinInput(String(budgetFilter.min));
    setMaxInput(String(budgetFilter.max));
  }, [budgetFilter.min, budgetFilter.max]);

  // Statistics use PUBLIC prices only (Price-on-Request items never contribute).
  const budgetStats = useMemo(() => computeBudgetStats(publishedProducts, budgetFilter), [publishedProducts, budgetFilter]);

  /** Number of products with a public price inside [min, max] (used for preset hints). */
  const countPublicInRange = (min: number, max: number) =>
    publishedProducts.filter(p => {
      const price = getPublicPrice(p);
      return price !== null && price >= min && price <= max;
    }).length;

  // Handle slider ceiling change
  const handleCeilingChange = (val: number) => {
    setBudgetFilter(prev => ({
      ...prev,
      min: minBound,
      max: val,
    }));
    setMaxInput(String(val));
    onFilterApplied?.();
  };

  // Handle bracket min change
  const handleMinSliderChange = (val: number) => {
    const clampedMin = Math.min(val, budgetFilter.max - 1000);
    setBudgetFilter(prev => ({
      ...prev,
      min: Math.max(minBound, clampedMin),
    }));
    setMinInput(String(Math.max(minBound, clampedMin)));
    onFilterApplied?.();
  };

  // Handle bracket max change
  const handleMaxSliderChange = (val: number) => {
    const clampedMax = Math.max(val, budgetFilter.min + 1000);
    setBudgetFilter(prev => ({
      ...prev,
      max: Math.min(maxBound, clampedMax),
    }));
    setMaxInput(String(Math.min(maxBound, clampedMax)));
    onFilterApplied?.();
  };

  // Handle manual input submits
  const handleMinInputBlur = () => {
    let parsed = parseInt(minInput.replace(/[^0-9]/g, ''), 10);
    if (isNaN(parsed) || parsed < minBound) parsed = minBound;
    if (parsed >= budgetFilter.max) parsed = budgetFilter.max - 1000;
    setBudgetFilter(prev => ({ ...prev, min: parsed }));
    setMinInput(String(parsed));
    onFilterApplied?.();
  };

  const handleMaxInputBlur = () => {
    let parsed = parseInt(maxInput.replace(/[^0-9]/g, ''), 10);
    if (isNaN(parsed) || parsed > maxBound) parsed = maxBound;
    if (parsed <= budgetFilter.min) parsed = budgetFilter.min + 1000;
    setBudgetFilter(prev => ({ ...prev, max: parsed }));
    setMaxInput(String(parsed));
    onFilterApplied?.();
  };

  // Preset options
  const applyPreset = (rawMin: number, rawMax: number) => {
    const min = Math.max(minBound, Math.min(rawMin, maxBound));
    const max = Math.min(maxBound, Math.max(rawMax, min));
    setBudgetFilter(prev => ({
      ...prev,
      min,
      max,
    }));
    setMinInput(String(min));
    setMaxInput(String(max));
    onFilterApplied?.();
  };

  // Volume estimation calculations
  const teamTotalCap = budgetFilter.max * teamUnits;
  const teamEstimatedSpend = (budgetStats.avgPrice ?? 0) * teamUnits;
  const potentialTeamSavings = Math.max(0, teamTotalCap - teamEstimatedSpend);

  // Calculate percentage of track filled for ceiling mode
  const ceilingPercent = Math.min(
    100,
    Math.max(0, ((budgetFilter.max - minBound) / (maxBound - minBound || 1)) * 100)
  );

  const bracketMinPercent = Math.min(
    100,
    Math.max(0, ((budgetFilter.min - minBound) / (maxBound - minBound || 1)) * 100)
  );
  const bracketMaxPercent = Math.min(
    100,
    Math.max(0, ((budgetFilter.max - minBound) / (maxBound - minBound || 1)) * 100)
  );

  return (
    <div className="bg-white rounded-lg border border-[#DCE7EF] p-4 shadow-xs space-y-4 text-[#183B57]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#DCE7EF]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#EBF3F8] text-[#275B86] flex items-center justify-center">
            <Calculator className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#10283D] uppercase tracking-wider">
              Budget Calculator
            </h3>
            <span className="text-[10px] text-[#62798C] block leading-none mt-0.5">
              Filter by procurement budget
            </span>
          </div>
        </div>

        {isBudgetFilterActive && (
          <button
            type="button"
            onClick={resetBudgetFilter}
            className="inline-flex items-center gap-1 text-[11px] text-[#275B86] hover:text-[#10283D] font-medium hover:underline cursor-pointer transition-colors"
            title="Reset budget to full catalog range"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Mode Selector (Ceiling vs Bracket) */}
      <div className="grid grid-cols-2 p-0.5 bg-[#F1F5F9] rounded-md text-[11px] font-medium text-slate-600">
        <button
          type="button"
          onClick={() => {
            setMode('ceiling');
            setBudgetFilter(prev => ({ ...prev, min: minBound }));
          }}
          className={`py-1 px-2 rounded transition-all text-center cursor-pointer ${
            mode === 'ceiling'
              ? 'bg-white text-[#10283D] font-bold shadow-2xs'
              : 'hover:text-[#183B57]'
          }`}
        >
          Budget Ceiling
        </button>
        <button
          type="button"
          onClick={() => setMode('bracket')}
          className={`py-1 px-2 rounded transition-all text-center cursor-pointer ${
            mode === 'bracket'
              ? 'bg-white text-[#10283D] font-bold shadow-2xs'
              : 'hover:text-[#183B57]'
          }`}
        >
          Min — Max Bracket
        </button>
      </div>

      {/* Current Range Summary Badge */}
      <div className="p-2.5 bg-[#F8FAFC] border border-[#DCE7EF] rounded-md space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#62798C]">Active Budget:</span>
          <span className="text-xs font-bold font-mono text-[#10283D]">
            {mode === 'ceiling'
              ? `Up to ${formatLKR(budgetFilter.max)}`
              : `${formatLKR(budgetFilter.min)} – ${formatLKR(budgetFilter.max)}`}
          </span>
        </div>

        {/* Dynamic Match Count Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-[#62798C]">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              <strong>{budgetStats.totalMatching}</strong> of {publishedProducts.length} items match
            </span>
            <span className="font-semibold text-emerald-700">
              {budgetStats.percentOfCatalog}% of catalog
            </span>
          </div>
          <p className="text-[10px] text-slate-400">Uses published prices only. Price-on-Request items follow the checkbox below.</p>
          {/* Visual Progress Bar */}
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#275B86] to-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${budgetStats.percentOfCatalog}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Slider Area */}
      <div className="space-y-3 pt-1">
        {mode === 'ceiling' ? (
          /* Single Ceiling Slider */
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#62798C]">Max Unit Budget:</span>
              <span className="font-bold font-mono text-[#275B86] text-xs">
                {formatLKR(budgetFilter.max)}
              </span>
            </div>

            <div className="relative pt-1 pb-1">
              <input
                type="range"
                min={minBound}
                max={maxBound}
                step={1000}
                value={budgetFilter.max}
                onChange={e => handleCeilingChange(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#275B86] focus:outline-none"
                style={{
                  background: `linear-gradient(to right, #275B86 0%, #275B86 ${ceilingPercent}%, #E2E8F0 ${ceilingPercent}%, #E2E8F0 100%)`,
                }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>{formatLKR(minBound)}</span>
              <span>{formatLKR(Math.round((minBound + maxBound) / 2))}</span>
              <span>{formatLKR(maxBound)}</span>
            </div>
          </div>
        ) : (
          /* Dual Bracket Controls */
          <div className="space-y-3">
            {/* Min Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#62798C]">Minimum Price:</span>
                <span className="font-mono text-xs font-semibold text-[#10283D]">
                  {formatLKR(budgetFilter.min)}
                </span>
              </div>
              <input
                type="range"
                min={minBound}
                max={maxBound}
                step={1000}
                value={budgetFilter.min}
                onChange={e => handleMinSliderChange(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#275B86] focus:outline-none"
              />
            </div>

            {/* Max Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#62798C]">Maximum Price:</span>
                <span className="font-mono text-xs font-semibold text-[#10283D]">
                  {formatLKR(budgetFilter.max)}
                </span>
              </div>
              <input
                type="range"
                min={minBound}
                max={maxBound}
                step={1000}
                value={budgetFilter.max}
                onChange={e => handleMaxSliderChange(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#275B86] focus:outline-none"
              />
            </div>

            {/* Numeric Direct Input Fields */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[10px] text-[#62798C] block mb-1">Min (LKR)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={minInput}
                    onChange={e => setMinInput(e.target.value)}
                    onBlur={handleMinInputBlur}
                    onKeyDown={e => e.key === 'Enter' && handleMinInputBlur()}
                    placeholder="Min"
                    className="w-full text-xs font-mono bg-[#F8FAFC] border border-[#DCE7EF] rounded px-2 py-1 text-[#10283D] focus:outline-none focus:border-[#275B86]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-[#62798C] block mb-1">Max (LKR)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={maxInput}
                    onChange={e => setMaxInput(e.target.value)}
                    onBlur={handleMaxInputBlur}
                    onKeyDown={e => e.key === 'Enter' && handleMaxInputBlur()}
                    placeholder="Max"
                    className="w-full text-xs font-mono bg-[#F8FAFC] border border-[#DCE7EF] rounded px-2 py-1 text-[#10283D] focus:outline-none focus:border-[#275B86]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Corporate Budget Presets */}
      <div className="space-y-1.5 pt-1 border-t border-[#DCE7EF]">
        <span className="text-[10px] font-bold text-[#10283D] uppercase tracking-wider block">
          Quick Budget Tiers
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => applyPreset(minBound, 10000)}
            className={`p-1.5 rounded border text-[11px] text-left transition-all cursor-pointer ${
              budgetFilter.max === 10000 && budgetFilter.min === minBound
                ? 'bg-[#EBF3F8] border-[#275B86] text-[#275B86] font-bold'
                : 'bg-white border-[#DCE7EF] text-slate-700 hover:bg-[#F8FAFC]'
            }`}
          >
            <div className="leading-tight">&lt; LKR 10K</div>
            <div className="text-[9px] text-[#62798C]">{countPublicInRange(0, 10000)} priced item(s)</div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset(10000, 30000)}
            className={`p-1.5 rounded border text-[11px] text-left transition-all cursor-pointer ${
              budgetFilter.min === 10000 && budgetFilter.max === 30000
                ? 'bg-[#EBF3F8] border-[#275B86] text-[#275B86] font-bold'
                : 'bg-white border-[#DCE7EF] text-slate-700 hover:bg-[#F8FAFC]'
            }`}
          >
            <div className="leading-tight">10K – 30K</div>
            <div className="text-[9px] text-[#62798C]">{countPublicInRange(10000, 30000)} priced item(s)</div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset(30000, 50000)}
            className={`p-1.5 rounded border text-[11px] text-left transition-all cursor-pointer ${
              budgetFilter.min === 30000 && budgetFilter.max === 50000
                ? 'bg-[#EBF3F8] border-[#275B86] text-[#275B86] font-bold'
                : 'bg-white border-[#DCE7EF] text-slate-700 hover:bg-[#F8FAFC]'
            }`}
          >
            <div className="leading-tight">30K – 50K</div>
            <div className="text-[9px] text-[#62798C]">{countPublicInRange(30000, 50000)} priced item(s)</div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset(50000, maxBound)}
            className={`p-1.5 rounded border text-[11px] text-left transition-all cursor-pointer ${
              budgetFilter.min === 50000 && budgetFilter.max === maxBound
                ? 'bg-[#EBF3F8] border-[#275B86] text-[#275B86] font-bold'
                : 'bg-white border-[#DCE7EF] text-slate-700 hover:bg-[#F8FAFC]'
            }`}
          >
            <div className="leading-tight">50K+</div>
            <div className="text-[9px] text-[#62798C]">{countPublicInRange(50000, Number.MAX_SAFE_INTEGER)} priced item(s)</div>
          </button>
        </div>
      </div>

      {/* Dynamic Range Statistics Card */}
      {budgetStats.inRangePricedCount > 0 && budgetStats.avgPrice !== null && (
        <div className="p-2.5 bg-[#EBF3F8]/70 border border-[#275B86]/20 rounded-md text-xs space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#62798C]">Avg. Item In Range:</span>
            <span className="font-mono font-bold text-[#10283D]">
              {formatLKR(budgetStats.avgPrice)}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-[#275B86]/10">
            <span>Range Spread:</span>
            <span className="font-mono">
              {formatLKR(budgetStats.lowestPrice)} – {formatLKR(budgetStats.highestPrice)}
            </span>
          </div>
        </div>
      )}

      {/* Interactive Volume / Team Rollout Spend Estimator */}
      <div className="border border-[#DCE7EF] rounded-md overflow-hidden bg-[#FAFCFE]">
        <button
          type="button"
          onClick={() => setShowEstimator(prev => !prev)}
          className="w-full p-2.5 flex items-center justify-between text-left text-xs font-semibold text-[#183B57] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#275B86]" />
            <span>Team / Batch Spend Estimator</span>
          </span>
          {showEstimator ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {showEstimator && (
          <div className="p-3 pt-1 border-t border-[#DCE7EF] space-y-3 text-xs bg-white animate-fadeIn">
            <p className="text-[11px] text-[#62798C] leading-snug">
              Calculate department allocation when purchasing items under this budget:
            </p>

            {/* Stepper for Units */}
            <div className="flex items-center justify-between bg-[#F8FAFC] p-2 rounded border border-[#DCE7EF]">
              <span className="text-[11px] font-medium text-slate-700">Team Workstations:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTeamUnits(Math.max(1, teamUnits - 1))}
                  className="w-6 h-6 rounded bg-white border border-slate-300 text-slate-700 flex items-center justify-center font-bold hover:bg-slate-50 active:scale-95 cursor-pointer"
                >
                  -
                </button>
                <span className="font-mono font-bold text-xs w-6 text-center text-[#10283D]">
                  {teamUnits}
                </span>
                <button
                  type="button"
                  onClick={() => setTeamUnits(Math.min(100, teamUnits + 1))}
                  className="w-6 h-6 rounded bg-white border border-slate-300 text-slate-700 flex items-center justify-center font-bold hover:bg-slate-50 active:scale-95 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Calculation Results */}
            <div className="space-y-1.5 p-2 bg-[#EBF3F8]/50 rounded border border-[#275B86]/20 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Batch Budget Cap ({teamUnits}x):</span>
                <span className="font-mono font-bold text-[#10283D]">
                  {formatLKR(teamTotalCap)}
                </span>
              </div>

              {budgetStats.avgPrice !== null && (
                <div className="flex items-center justify-between text-emerald-700 font-medium">
                  <span>Est. Outlay (Avg Price):</span>
                  <span className="font-mono font-bold">
                    {formatLKR(teamEstimatedSpend)}
                  </span>
                </div>
              )}

              {potentialTeamSavings > 0 && (
                <div className="flex items-center justify-between text-[10px] text-emerald-600 pt-1 border-t border-[#275B86]/10">
                  <span>Headroom vs. your budget cap:</span>
                  <span className="font-mono font-bold">
                    ~{formatLKR(potentialTeamSavings)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quote-only Products Toggle */}
      <div className="pt-2 border-t border-[#DCE7EF]">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={budgetFilter.includeQuoteOnly}
            onChange={e => {
              setBudgetFilter(prev => ({
                ...prev,
                includeQuoteOnly: e.target.checked,
              }));
              onFilterApplied?.();
            }}
            className="w-3.5 h-3.5 rounded text-[#275B86] border-slate-300 focus:ring-[#275B86] cursor-pointer"
          />
          <span className="text-[11px] text-[#62798C]">
            Include 'Price on Request' RFQ items
          </span>
        </label>
      </div>
    </div>
  );
};
