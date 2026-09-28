/**
 * Shared domain types for the SDS Techware catalogue prototype.
 *
 * Everything here is stored in the browser (localStorage). None of it is a
 * secure or authoritative record — see docs/PROJECT_HANDOVER.md.
 */

export type StaffRole = 'owner' | 'product_manager' | 'stock_editor' | 'viewer';
export type TeamRole = Exclude<StaffRole, 'viewer'>;

export interface ProductSpec {
  key: string;
  value: string;
}

export interface Product {
  id: string;
  model: string;
  name: string; // friendly descriptive name
  brand: string;
  category: string;
  sku: string;
  shortDescription: string;
  description: string;
  specifications: ProductSpec[];
  images: string[];
  /**
   * Selling price in LKR entered by staff.
   * null = no price entered. 0 is stored as-is but is never shown publicly
   * (see features/catalog/pricing.ts).
   */
  price: number | null;
  /** Staff intent to show the selling price publicly. See getPublicPrice(). */
  isPricePublic: boolean;
  /**
   * Internal purchase (supplier) cost per unit in LKR.
   * null/undefined = unknown. Never shown on the storefront and never derived
   * from the selling price.
   */
  purchaseCost?: number | null;
  stock: number | null; // null = unconfirmed, 0 = out of stock, >0 = in stock
  isPublished: boolean;
  isArchived: boolean;
  isFeatured?: boolean;
  featuredCaption?: string;
  createdAt: string;
  updatedAt: string;
}

/** Minimal product details kept with a quotation line (never includes prices). */
export interface QuoteItemSnapshot {
  model: string;
  name: string;
  brand: string;
  category: string;
  sku: string;
  shortDescription: string;
  specifications: ProductSpec[];
}

/** Persisted quotation list entry. */
export interface StoredQuoteItem {
  productId: string;
  quantity: number;
  /** 'catalog' items are re-resolved against the live catalogue; 'custom' items (configurator, warranty, chat) are not. */
  source: 'catalog' | 'custom';
  snapshot: QuoteItemSnapshot;
}

/** Quotation line as consumed by the UI (product is always storefront-safe). */
export interface QuoteItem {
  productId: string;
  quantity: number;
  source: 'catalog' | 'custom';
  /** Storefront-safe product: hidden prices are already removed. */
  product: Product;
  /** false when a catalogue item is no longer published (shown from its saved snapshot). */
  isListed: boolean;
}

export interface CustomerQuoteEnquiry {
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: 'active' | 'suspended';
  isCurrentUser?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Brand {
  id: string;
  name: string;
  country?: string;
}

/**
 * Identity attached to staff actions. Authentication does not exist yet, so
 * the actor is always the demo browser session plus the selected demo role.
 */
export interface DemoActor {
  kind: 'demo_session';
  role: StaffRole;
  label: string;
}

export type StockAlertStatus = 'pending' | 'notified' | 'dismissed';

export interface StockAlertRequest {
  id: string;
  productId: string;
  productModel: string;
  productBrand: string;
  productSku: string;
  email: string;
  createdAt: string;
  /**
   * 'notified' means a staff member recorded that they contacted the
   * customer manually. The app itself never sends messages.
   */
  status: StockAlertStatus;
  statusChangedAt?: string;
  statusChangedBy?: DemoActor;
  notificationMethod?: 'manual';
  isDemoSample?: boolean;
}

export interface PriceAlertRequest {
  id: string;
  productId: string;
  productModel: string;
  productBrand: string;
  productSku: string;
  /** Public price at the time the request was saved (null if none was public). */
  currentPrice: number | null;
  targetPrice: number | null;
  dropPercentage?: number;
  email: string;
  createdAt: string;
  status: 'active' | 'triggered' | 'cancelled';
  isDemoSample?: boolean;
}

export interface ProductReview {
  id: string;
  productId: string;
  authorName: string;
  authorCompany?: string;
  authorRole?: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  date: string;
  /** Self-declared by the reviewer; the prototype cannot verify purchases, so it is not displayed as verified. */
  verifiedPurchase: boolean;
  helpfulCount: number;
  /** Illustrative sample content, not a real customer review. */
  isDemoSample?: boolean;
}

/** @deprecated Legacy restock log format (before Baseline v1). Kept for migration only. */
export interface LegacyRestockLogEntry {
  id: string;
  productId: string;
  productModel: string;
  productBrand: string;
  productSku: string;
  category: string;
  previousStock: number | null;
  addedQuantity: number;
  newStock: number;
  timestamp: string;
  staffName: string;
  staffRole: StaffRole;
  method: 'quick_restock' | 'batch_reorder' | 'manual_inventory';
  poNumber?: string;
  unitPrice?: number | null;
  totalCost?: number | null;
  notes?: string;
}

export type StockMovementKind = 'goods_receipt' | 'stock_count' | 'legacy';

/** One confirmed stock change, recorded only after the product update succeeded. */
export interface StockMovement {
  id: string;
  kind: StockMovementKind;
  productId: string;
  productModel: string;
  productBrand: string;
  productSku: string;
  category: string;
  previousStock: number | null;
  /** Change applied. null when it cannot be known (e.g. unconfirmed stock set to unconfirmed). */
  quantityDelta: number | null;
  newStock: number | null;
  timestamp: string;
  actor: DemoActor | null;
  /** Human-readable actor text for display/export. */
  actorLabel: string;
  /** Supplier / PO / delivery note reference typed by staff (optional). */
  reference?: string;
  /** Purchase cost per unit entered on the receipt. null = unknown. */
  unitCost: number | null;
  /** unitCost × quantity when unitCost is known, otherwise null. */
  totalCost: number | null;
  batchId?: string;
  notes?: string;
  /** Original fields of a pre-Baseline-v1 record, preserved unchanged. */
  legacy?: LegacyRestockLogEntry;
}
