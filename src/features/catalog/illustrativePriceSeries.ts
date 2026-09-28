/**
 * DEMO ONLY: deterministic illustrative price series for the product page
 * chart. It is NOT real price history. Callers must only pass a PUBLIC price
 * (never a hidden one) and must label the chart as simulated.
 */
export interface IllustrativePricePoint {
  label: string;
  price: number;
}

export function buildIllustrativePriceSeries(seedKey: string, currentPublicPrice: number, now: Date = new Date(), months = 6): IllustrativePricePoint[] {
  let seed = 0;
  for (let i = 0; i < seedKey.length; i++) seed = (seed * 31 + seedKey.charCodeAt(i)) % 10000;

  const points: IllustrativePricePoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
    if (i === 0) {
      points.push({ label, price: currentPublicPrice });
      continue;
    }
    // Small deterministic wobble (±4%) around the current public price.
    const wobble = Math.sin((seed % 97) + i * 1.7) * 0.04;
    const price = Math.max(0, Math.round((currentPublicPrice * (1 + wobble)) / 100) * 100);
    points.push({ label, price });
  }
  return points;
}
