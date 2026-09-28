import { BUSINESS } from '../../config/business';
import { toCsv } from '../../lib/csv';
import { formatCost } from '../../lib/format';
import type { StockMovement } from '../../types';
import { movementKindLabel } from './history';
import type { ReorderDraft } from './restock';

const DRAFT_NOTICE = 'DRAFT ONLY - generating, copying or printing this document does not change stock.';

/** Plain-text reorder draft for copying to a supplier message. */
export function reorderDraftText(draft: ReorderDraft): string {
  const date = new Date(draft.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  let text = '=======================================================\n';
  text += `${BUSINESS.legalName.value.toUpperCase()} - REORDER DRAFT\n`;
  text += `Draft reference: ${draft.reference}\n`;
  text += `Date: ${date}\n`;
  text += `Prepared by: ${draft.actorLabel}\n`;
  text += `${DRAFT_NOTICE}\n`;
  text += '=======================================================\n\n';

  const byBrand = new Map<string, typeof draft.lines>();
  for (const l of draft.lines) byBrand.set(l.brand, [...(byBrand.get(l.brand) ?? []), l]);

  for (const [brand, lines] of byBrand) {
    text += `--- BRAND: ${brand.toUpperCase()} ---\n`;
    lines.forEach((l, i) => {
      text += `${i + 1}. SKU: ${l.sku} | Model: ${l.model}\n`;
      text += `   Current stock: ${l.currentStock ?? 'Unconfirmed'} -> Order qty: ${l.orderQty}\n`;
      text += `   Unit purchase cost: ${formatCost(l.unitCost)}${l.lineCost !== null ? ` | Line cost: ${formatCost(l.lineCost)}` : ''}\n\n`;
    });
  }

  text += '=======================================================\n';
  text += `TOTAL UNITS: ${draft.totalUnits} across ${draft.lines.length} line(s)\n`;
  if (draft.knownCostTotal !== null) {
    text += `KNOWN PURCHASE COST: ${formatCost(draft.knownCostTotal)}`;
    text += draft.linesWithUnknownCost > 0 ? ` (incomplete - ${draft.linesWithUnknownCost} line(s) with unknown cost)\n` : '\n';
  } else {
    text += 'PURCHASE COST: Unknown (no purchase costs recorded)\n';
  }
  text += 'AUTHORISED SIGNATORY: _____________________________\n';
  text += '=======================================================\n';
  return text;
}

/** CSV reorder draft with blank receiving columns for the physical check. */
export function reorderDraftCsv(draft: ReorderDraft): string {
  const rows: unknown[][] = [
    [`${BUSINESS.legalName.value} - Reorder draft & receiving checklist`],
    ['Draft reference', draft.reference, 'Created', new Date(draft.createdAt).toLocaleString('en-GB'), 'Prepared by', draft.actorLabel],
    [DRAFT_NOTICE],
    [],
    [
      'Line #',
      'SKU',
      'Model / Item',
      'Brand',
      'Category',
      'Stock when drafted',
      'Low-stock threshold',
      'Order qty',
      'Unit purchase cost (LKR)',
      'Line purchase cost (LKR)',
      'Qty received',
      'Serial / batch numbers',
      'Inspection (pass/fail)',
      'Received by',
      'Notes',
    ],
  ];
  draft.lines.forEach((l, i) =>
    rows.push([
      i + 1,
      l.sku,
      l.name,
      l.brand,
      l.category,
      l.currentStock ?? 'Unconfirmed',
      `<= ${l.threshold}`,
      l.orderQty,
      l.unitCost ?? 'Unknown',
      l.lineCost ?? 'Unknown',
      '',
      '',
      '',
      '',
      '',
    ]),
  );
  rows.push([]);
  rows.push([
    'TOTALS',
    '',
    '',
    '',
    '',
    '',
    '',
    draft.totalUnits,
    '',
    draft.knownCostTotal === null ? 'Unknown' : draft.linesWithUnknownCost > 0 ? `${draft.knownCostTotal} (incomplete)` : draft.knownCostTotal,
  ]);
  return toCsv(rows);
}

export function historyCsv(movements: StockMovement[], exportedBy: string): string {
  const rows: unknown[][] = [
    [`${BUSINESS.legalName.value} - Stock movement history (browser-local prototype log, not a secure audit trail)`],
    ['Exported', new Date().toLocaleString('en-GB'), 'Exported by', exportedBy],
    [],
    [
      'Record ID',
      'Timestamp',
      'Type',
      'SKU',
      'Model',
      'Brand',
      'Category',
      'Reference',
      'Previous stock',
      'Change',
      'New stock',
      'Recorded by',
      'Unit purchase cost (LKR)',
      'Total purchase cost (LKR)',
      'Notes',
    ],
  ];
  for (const m of movements) {
    rows.push([
      m.id,
      new Date(m.timestamp).toLocaleString('en-GB'),
      movementKindLabel(m),
      m.productSku,
      m.productModel,
      m.productBrand,
      m.category,
      m.reference ?? '',
      m.previousStock ?? 'Unconfirmed',
      m.quantityDelta === null ? 'n/a' : m.quantityDelta,
      m.newStock ?? 'Unconfirmed',
      m.actorLabel,
      m.unitCost ?? 'Unknown',
      m.totalCost ?? 'Unknown',
      m.notes ?? '',
    ]);
  }
  return toCsv(rows);
}
