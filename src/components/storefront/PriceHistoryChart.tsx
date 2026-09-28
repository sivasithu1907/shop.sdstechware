import React, { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, BarChart2, Bell, BellRing, Info } from 'lucide-react';
import { getPublicPrice } from '../../features/catalog/pricing';
import { buildIllustrativePriceSeries } from '../../features/catalog/illustrativePriceSeries';
import { formatLKR } from '../../lib/format';
import type { Product } from '../../types';

interface PriceHistoryChartProps {
  product: Product;
  onOpenPriceAlert?: () => void;
  hasActiveAlert?: boolean;
}

/**
 * Price chart — DEMO ONLY.
 *
 * No real price history exists yet. For products with a public price the
 * chart shows a clearly labelled illustrative curve that ends at the current
 * public price. For Price-on-Request products nothing is generated, so no
 * hidden price can be revealed or inferred.
 */
export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({ product, onOpenPriceAlert, hasActiveAlert = false }) => {
  const publicPrice = getPublicPrice(product);
  const [range, setRange] = useState<'6m' | '3m'>('6m');

  const series = useMemo(() => (publicPrice === null ? [] : buildIllustrativePriceSeries(product.id, publicPrice)), [product.id, publicPrice]);
  const shown = range === '3m' ? series.slice(-3) : series;

  if (publicPrice === null) {
    return (
      <div className="bg-[#F8FAFC] border border-[#DCE7EF] rounded-xl p-4 sm:p-5 flex items-start gap-3 text-xs text-[#62798C]">
        <div className="w-8 h-8 rounded-lg bg-[#10283D] text-[#489DCA] flex items-center justify-center shrink-0">
          <BarChart2 className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-[#10283D]">Price history</h4>
          <p className="mt-0.5">This item is priced on request, so no price chart is shown. Request a quotation for current pricing.</p>
        </div>
      </div>
    );
  }

  const values = shown.map(p => p.price);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.25 || min * 0.08;

  return (
    <div className="bg-[#F8FAFC] border border-[#DCE7EF] rounded-xl p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#10283D] text-[#489DCA] flex items-center justify-center shrink-0 shadow-2xs">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-[#10283D] tracking-tight">Price chart</h4>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-semibold px-2 py-0.5 rounded border border-amber-300">
                DEMO — simulated data
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Illustrative curve for layout only. Not real price history or market data.</p>
          </div>
        </div>
        <div className="flex items-center bg-white border border-[#DCE7EF] p-0.5 rounded-lg text-xs font-semibold self-start sm:self-auto" role="group" aria-label="Chart range">
          {(['6m', '3m'] as const).map(r => (
            <button
              key={r}
              type="button"
              aria-pressed={range === r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 rounded-md text-[11px] transition-colors ${range === r ? 'bg-[#10283D] text-white shadow-2xs' : 'text-slate-600 hover:text-[#10283D]'}`}
            >
              {r === '6m' ? '6 months' : '3 months'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="bg-white border border-[#DCE7EF] rounded-lg p-2.5 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Current published price</span>
          <div className="text-sm font-bold font-mono text-[#10283D] mt-0.5 truncate">{formatLKR(publicPrice)}</div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Real (from catalogue)</span>
        </div>
        <div className="bg-white border border-[#DCE7EF] rounded-lg p-2.5 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Simulated low</span>
          <div className="text-sm font-bold font-mono text-slate-700 mt-0.5 truncate">{formatLKR(min)}</div>
          <span className="text-[10px] text-amber-700 block mt-0.5">Demo value</span>
        </div>
        <div className="bg-white border border-[#DCE7EF] rounded-lg p-2.5 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Simulated high</span>
          <div className="text-sm font-bold font-mono text-slate-700 mt-0.5 truncate">{formatLKR(max)}</div>
          <span className="text-[10px] text-amber-700 block mt-0.5">Demo value</span>
        </div>
      </div>

      <div className="bg-white border border-[#DCE7EF] rounded-xl p-3 sm:p-4 shadow-2xs">
        <div className="h-52 sm:h-60 w-full" role="img" aria-label="Illustrative simulated price chart (demo data, not real history)">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={shown} margin={{ top: 12, right: 12, left: -4, bottom: 4 }}>
              <defs>
                <linearGradient id="demoPriceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#275B86" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#275B86" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDF2F7" />
              <XAxis dataKey="label" stroke="#64748B" fontSize={11} tickLine={false} axisLine={{ stroke: '#CBD5E1' }} dy={6} />
              <YAxis
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                domain={[Math.max(0, Math.floor(min - pad)), Math.ceil(max + pad)]}
                tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)}
              />
              <Tooltip
                formatter={(v: unknown) => [formatLKR(typeof v === 'number' ? v : null), 'Simulated price']}
                labelFormatter={(l: unknown) => `${String(l)} (demo)`}
              />
              <Area
                type="monotone"
                dataKey="price"
                name="Simulated price"
                stroke="#275B86"
                strokeWidth={2}
                strokeDasharray="5 4"
                fill="url(#demoPriceGradient)"
                dot={{ r: 3, fill: '#275B86', stroke: '#FFFFFF', strokeWidth: 1.5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-500">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>Only the last point uses the real published price. Earlier points are generated for demonstration and must not be used for buying decisions.</span>
        </div>
      </div>

      <div className="p-3 bg-[#EBF3F8]/80 border border-[#275B86]/20 rounded-lg text-xs text-[#183B57] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 text-[11px] leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-[#275B86] shrink-0 mt-0.5" />
          <span>Prices can change. A formal quotation from SDS Techware confirms the price, its validity and availability.</span>
        </div>
        {onOpenPriceAlert && (
          <button
            type="button"
            onClick={onOpenPriceAlert}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-2xs self-start sm:self-auto ${
              hasActiveAlert ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-[#275B86] hover:bg-[#10283D] text-white'
            }`}
          >
            {hasActiveAlert ? <BellRing className="w-3.5 h-3.5 text-emerald-200" /> : <Bell className="w-3.5 h-3.5 text-[#489DCA]" />}
            <span>{hasActiveAlert ? 'Price alert saved' : 'Price alert'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
