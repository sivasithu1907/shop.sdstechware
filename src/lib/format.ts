/** Format an LKR amount. null/invalid → "Price on Request" (callers decide what may be shown). */
export function formatLKR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return 'Price on Request';
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

/** Format an internal cost; unknown costs are shown as "Unknown", never as zero. */
export function formatCost(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return 'Unknown';
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
