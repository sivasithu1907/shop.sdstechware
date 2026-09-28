import { asFiniteNumberOrNull, asString, isRecord } from '../../lib/storage';
import type { DemoActor, LegacyRestockLogEntry, StaffRole, StockMovement } from '../../types';

/**
 * Stock movement history lives in browser storage. It is a convenience log
 * for the prototype, NOT a secure or tamper-proof audit trail: anyone with
 * access to the browser can edit or clear it.
 */

const STAFF_ROLES: StaffRole[] = ['owner', 'product_manager', 'stock_editor', 'viewer'];

function isActor(v: unknown): v is DemoActor {
  return isRecord(v) && v.kind === 'demo_session' && STAFF_ROLES.includes(v.role as StaffRole) && typeof v.label === 'string';
}

function normalizeCurrent(raw: Record<string, unknown>): StockMovement | null {
  const id = asString(raw.id);
  const productId = asString(raw.productId);
  const kind = raw.kind;
  if (!id || !productId || (kind !== 'goods_receipt' && kind !== 'stock_count' && kind !== 'legacy')) return null;
  const actor = isActor(raw.actor) ? raw.actor : null;
  return {
    id,
    kind,
    productId,
    productModel: asString(raw.productModel),
    productBrand: asString(raw.productBrand),
    productSku: asString(raw.productSku),
    category: asString(raw.category),
    previousStock: asFiniteNumberOrNull(raw.previousStock),
    quantityDelta: asFiniteNumberOrNull(raw.quantityDelta),
    newStock: asFiniteNumberOrNull(raw.newStock),
    timestamp: asString(raw.timestamp, new Date(0).toISOString()),
    actor,
    actorLabel: asString(raw.actorLabel, actor?.label ?? 'Unknown'),
    reference: typeof raw.reference === 'string' ? raw.reference : undefined,
    unitCost: asFiniteNumberOrNull(raw.unitCost),
    totalCost: asFiniteNumberOrNull(raw.totalCost),
    batchId: typeof raw.batchId === 'string' ? raw.batchId : undefined,
    notes: typeof raw.notes === 'string' ? raw.notes : undefined,
    legacy: isRecord(raw.legacy) ? (raw.legacy as unknown as LegacyRestockLogEntry) : undefined,
  };
}

/**
 * Convert a pre-Baseline-v1 restock log entry. The original record is kept
 * verbatim in `legacy`. Its staff name was chosen automatically by the old
 * widget (first staff member with the role, or an invented fallback name), and
 * its "cost" was computed from the SELLING price, so neither is shown as fact.
 */
function fromLegacy(raw: Record<string, unknown>): StockMovement | null {
  const id = asString(raw.id);
  const productId = asString(raw.productId);
  const added = asFiniteNumberOrNull(raw.addedQuantity);
  if (!id || !productId || added === null) return null;
  const legacy = raw as unknown as LegacyRestockLogEntry;
  const staffName = asString(raw.staffName, 'unknown');
  const staffRole = asString(raw.staffRole, 'unknown');
  const method = asString(raw.method);
  return {
    id,
    kind: 'legacy',
    productId,
    productModel: asString(raw.productModel),
    productBrand: asString(raw.productBrand),
    productSku: asString(raw.productSku),
    category: asString(raw.category),
    previousStock: asFiniteNumberOrNull(raw.previousStock),
    quantityDelta: added,
    newStock: asFiniteNumberOrNull(raw.newStock),
    timestamp: asString(raw.timestamp, new Date(0).toISOString()),
    actor: null,
    actorLabel: `Legacy record — attribution not verified (recorded as "${staffName}", ${staffRole})`,
    reference: typeof raw.poNumber === 'string' ? raw.poNumber : undefined,
    unitCost: null,
    totalCost: null,
    notes: [
      method === 'quick_restock' ? 'Legacy quick restock' : method === 'batch_reorder' ? 'Legacy batch reorder' : 'Legacy adjustment',
      id.startsWith('restock-seed-') ? '(demo sample record)' : null,
      'Legacy cost values were based on selling price and are not purchase costs.',
    ]
      .filter(Boolean)
      .join(' · '),
    legacy: { ...legacy },
  };
}

export function normalizeStockMovement(raw: unknown): StockMovement | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.kind === 'string') return normalizeCurrent(raw);
  if ('addedQuantity' in raw) return fromLegacy(raw);
  return null;
}

export function movementKindLabel(m: StockMovement): string {
  switch (m.kind) {
    case 'goods_receipt':
      return 'Goods receipt (confirmed)';
    case 'stock_count':
      return 'Stock count / correction';
    case 'legacy':
      return 'Legacy record (pre-baseline)';
  }
}
