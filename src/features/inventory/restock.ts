import { LIMITS } from '../../config/settings';
import { createId, createReference } from '../../lib/ids';
import type { DemoActor, Product, StockMovement } from '../../types';

/**
 * Restocking rules
 * ----------------
 * 1. A REORDER DRAFT is a planning document (copy / print / CSV). Creating,
 *    printing or exporting it never changes stock.
 * 2. Stock increases only through a GOODS RECEIPT that staff explicitly
 *    confirm. A receipt is validated as a whole: if any line is invalid,
 *    nothing is applied and no history is recorded (no partial success).
 * 3. Purchase cost is separate from selling price. Unknown cost stays
 *    unknown (null) — it is never treated as zero and never derived from the
 *    selling price.
 * 4. Unknown (unconfirmed) starting stock must be handled explicitly: the
 *    receiver confirms that the on-hand count after receipt equals the
 *    received quantity, or does a stock count first.
 */

export type Outcome<T> = { ok: true; value: T } | { ok: false; error: string };

export function validateMovementQuantity(qty: unknown): string | null {
  if (typeof qty !== 'number' || !Number.isFinite(qty)) return 'Quantity must be a number.';
  if (!Number.isInteger(qty)) return 'Quantity must be a whole number.';
  if (qty < 1) return 'Quantity must be at least 1.';
  if (qty > LIMITS.movementQtyMax) return `Quantity cannot exceed ${LIMITS.movementQtyMax.toLocaleString()}.`;
  return null;
}

export function validateUnitCost(cost: unknown): string | null {
  if (cost === null || cost === undefined) return null; // unknown is allowed
  if (typeof cost !== 'number' || !Number.isFinite(cost)) return 'Unit cost must be a valid number or left blank (unknown).';
  if (cost < 0) return 'Unit cost cannot be negative.';
  return null;
}

/** Parse a cost input field: blank → null (unknown). Returns undefined when invalid. */
export function parseCostInput(text: string): number | null | undefined {
  const t = text.trim().replace(/,/g, '');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

// ---------------------------------------------------------------- drafts

export interface ReorderDraftLine {
  productId: string;
  sku: string;
  model: string;
  name: string;
  brand: string;
  category: string;
  currentStock: number | null;
  threshold: number;
  orderQty: number;
  /** Last known purchase cost per unit. null = unknown. Never the selling price. */
  unitCost: number | null;
  /** unitCost × orderQty, or null when cost is unknown. */
  lineCost: number | null;
}

export interface ReorderDraft {
  reference: string;
  createdAt: string;
  actorLabel: string;
  lines: ReorderDraftLine[];
  totalUnits: number;
  /** Sum of known line costs, or null if no line has a known cost. */
  knownCostTotal: number | null;
  linesWithUnknownCost: number;
}

export function buildReorderDraft(
  products: Product[],
  quantities: Record<string, number>,
  thresholdOf: (p: Product) => number,
  actor: DemoActor,
  now: Date = new Date(),
  reference?: string,
): Outcome<ReorderDraft> {
  const lines: ReorderDraftLine[] = [];
  for (const p of products) {
    if (!(p.id in quantities)) continue;
    const qty = quantities[p.id];
    const err = validateMovementQuantity(qty);
    if (err) return { ok: false, error: `${p.model}: ${err}` };
    const unitCost = typeof p.purchaseCost === 'number' && Number.isFinite(p.purchaseCost) ? p.purchaseCost : null;
    lines.push({
      productId: p.id,
      sku: p.sku,
      model: p.model,
      name: p.name || p.model,
      brand: p.brand,
      category: p.category,
      currentStock: p.stock,
      threshold: thresholdOf(p),
      orderQty: qty,
      unitCost,
      lineCost: unitCost === null ? null : unitCost * qty,
    });
  }
  if (lines.length === 0) return { ok: false, error: 'Select at least one product for the reorder draft.' };
  const known = lines.filter(l => l.lineCost !== null);
  return {
    ok: true,
    value: {
      reference: reference ?? createReference('DRAFT', now),
      createdAt: now.toISOString(),
      actorLabel: actor.label,
      lines,
      totalUnits: lines.reduce((s, l) => s + l.orderQty, 0),
      knownCostTotal: known.length ? known.reduce((s, l) => s + (l.lineCost ?? 0), 0) : null,
      linesWithUnknownCost: lines.length - known.length,
    },
  };
}

// ---------------------------------------------------------------- receipts

export interface ReceiptLineInput {
  productId: string;
  quantity: number;
  /** Purchase cost per unit for this delivery. null = unknown. */
  unitCost: number | null;
  /** Required when the product's current stock is unconfirmed (null). */
  confirmUnknownStartingStock?: boolean;
}

export interface GoodsReceiptInput {
  lines: ReceiptLineInput[];
  reference?: string;
  notes?: string;
}

export interface ReceiptLineError {
  productId: string;
  model: string;
  message: string;
}

export interface GoodsReceiptResult {
  ok: boolean;
  errors: ReceiptLineError[];
  /** Updated product list when ok; the original list (unchanged) when not ok. */
  products: Product[];
  /** History records — only produced when ok. */
  movements: StockMovement[];
  batchId: string | null;
  totalUnits: number;
}

export function validateReceiptLine(product: Product | undefined, line: ReceiptLineInput): string | null {
  if (!product) return 'Product not found.';
  if (product.isArchived) return 'Product is archived. Restore it before receiving stock.';
  const qtyErr = validateMovementQuantity(line.quantity);
  if (qtyErr) return qtyErr;
  const costErr = validateUnitCost(line.unitCost);
  if (costErr) return costErr;
  if (product.stock === null && line.confirmUnknownStartingStock !== true) {
    return 'Current stock is unconfirmed. Confirm that on-hand stock after this receipt equals the received quantity, or record a stock count first.';
  }
  if (product.stock !== null && product.stock + line.quantity > Number.MAX_SAFE_INTEGER) return 'Resulting stock is too large.';
  return null;
}

/**
 * Apply a confirmed goods receipt atomically. Returns the new product list and
 * one history record per line — or, if ANY line fails, the unchanged product
 * list, no history, and every error.
 */
export function applyGoodsReceipt(
  products: Product[],
  input: GoodsReceiptInput,
  actor: DemoActor,
  now: Date = new Date(),
): GoodsReceiptResult {
  const fail = (errors: ReceiptLineError[]): GoodsReceiptResult => ({
    ok: false,
    errors,
    products,
    movements: [],
    batchId: null,
    totalUnits: 0,
  });

  if (actor.role === 'viewer') {
    return fail([{ productId: '', model: '', message: 'The Viewer role cannot change stock.' }]);
  }
  if (!input.lines || input.lines.length === 0) {
    return fail([{ productId: '', model: '', message: 'The receipt has no lines.' }]);
  }

  const byId = new Map(products.map(p => [p.id, p]));
  const seen = new Set<string>();
  const errors: ReceiptLineError[] = [];
  for (const line of input.lines) {
    const product = byId.get(line.productId);
    if (seen.has(line.productId)) {
      errors.push({ productId: line.productId, model: product?.model ?? line.productId, message: 'Product appears more than once in this receipt.' });
      continue;
    }
    seen.add(line.productId);
    const err = validateReceiptLine(product, line);
    if (err) errors.push({ productId: line.productId, model: product?.model ?? line.productId, message: err });
  }
  if (errors.length > 0) return fail(errors);

  const timestamp = now.toISOString();
  const batchId = input.lines.length > 1 ? createId('receipt') : null;
  const reference = input.reference?.trim() || undefined;
  const notes = input.notes?.trim() || undefined;
  const updates = new Map<string, Product>();
  const movements: StockMovement[] = [];

  for (const line of input.lines) {
    const product = byId.get(line.productId)!;
    const previousStock = product.stock;
    const newStock = (previousStock ?? 0) + line.quantity;
    const unitCost = line.unitCost ?? null;
    updates.set(product.id, {
      ...product,
      stock: newStock,
      // A known receipt cost becomes the product's last known purchase cost; unknown cost changes nothing.
      purchaseCost: unitCost !== null ? unitCost : product.purchaseCost ?? null,
      updatedAt: timestamp,
    });
    movements.push({
      id: createId('mov'),
      kind: 'goods_receipt',
      productId: product.id,
      productModel: product.model,
      productBrand: product.brand,
      productSku: product.sku,
      category: product.category,
      previousStock,
      quantityDelta: line.quantity,
      newStock,
      timestamp,
      actor,
      actorLabel: actor.label,
      reference,
      unitCost,
      totalCost: unitCost === null ? null : unitCost * line.quantity,
      batchId: batchId ?? undefined,
      notes:
        previousStock === null
          ? [notes, 'Starting stock was unconfirmed; receiver confirmed on-hand count equals received quantity.'].filter(Boolean).join(' ')
          : notes,
    });
  }

  return {
    ok: true,
    errors: [],
    products: products.map(p => updates.get(p.id) ?? p),
    movements,
    batchId,
    totalUnits: input.lines.reduce((s, l) => s + l.quantity, 0),
  };
}

// ---------------------------------------------------------------- stock counts

export interface StockCountResult {
  ok: boolean;
  error?: string;
  products: Product[];
  movement: StockMovement | null;
  /** true when the new value equals the old one (nothing recorded). */
  unchanged: boolean;
}

/**
 * Record a direct stock count / correction (Inventory sheet, product editor,
 * stock requests). Sets an absolute value, including back to "unconfirmed".
 */
export function applyStockCount(
  products: Product[],
  productId: string,
  newStock: number | null,
  actor: DemoActor,
  now: Date = new Date(),
  notes?: string,
): StockCountResult {
  const failed = (error: string): StockCountResult => ({ ok: false, error, products, movement: null, unchanged: false });
  if (actor.role === 'viewer') return failed('The Viewer role cannot change stock.');
  const product = products.find(p => p.id === productId);
  if (!product) return failed('Product not found.');
  if (newStock !== null && (!Number.isInteger(newStock) || newStock < 0)) {
    return failed('Stock must be a non-negative whole number, or unconfirmed.');
  }
  if (newStock !== null && newStock > LIMITS.movementQtyMax * 10) return failed('Stock value is unrealistically large.');
  if (product.stock === newStock) return { ok: true, products, movement: null, unchanged: true };

  const timestamp = now.toISOString();
  const movement: StockMovement = {
    id: createId('mov'),
    kind: 'stock_count',
    productId: product.id,
    productModel: product.model,
    productBrand: product.brand,
    productSku: product.sku,
    category: product.category,
    previousStock: product.stock,
    quantityDelta: product.stock !== null && newStock !== null ? newStock - product.stock : null,
    newStock,
    timestamp,
    actor,
    actorLabel: actor.label,
    unitCost: null,
    totalCost: null,
    notes: notes?.trim() || undefined,
  };
  return {
    ok: true,
    products: products.map(p => (p.id === productId ? { ...p, stock: newStock, updatedAt: timestamp } : p)),
    movement,
    unchanged: false,
  };
}

/** History record for stock entered when a product is first created (no stock change is applied here). */
export function initialStockMovement(product: Product, actor: DemoActor, now: Date = new Date()): StockMovement | null {
  if (product.stock === null) return null;
  return {
    id: createId('mov'),
    kind: 'stock_count',
    productId: product.id,
    productModel: product.model,
    productBrand: product.brand,
    productSku: product.sku,
    category: product.category,
    previousStock: null,
    quantityDelta: null,
    newStock: product.stock,
    timestamp: now.toISOString(),
    actor,
    actorLabel: actor.label,
    unitCost: null,
    totalCost: null,
    notes: 'Initial stock entered when the product was created.',
  };
}
