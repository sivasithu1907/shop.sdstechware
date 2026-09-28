import type { PriceAlertRequest, StockAlertRequest, StockMovement } from '../types';

/**
 * Demo fixtures used when the browser has no saved data (or after
 * "Reset demo data"). All clearly marked as samples.
 */

export const DEFAULT_RECENT_SEARCHES = ['Logitech MX', 'Kingston NV2', 'Wi-Fi 6', 'APC Back-UPS'];

export const DEFAULT_SAVED_PRODUCT_IDS = ['prod-mx-master-3s'];

export const DEFAULT_STOCK_ALERTS: StockAlertRequest[] = [
  {
    id: 'alert-seed-1',
    productId: 'prod-apc-bx750mi',
    productModel: 'Back-UPS BX750MI',
    productBrand: 'APC',
    productSku: 'APC-BX750MI-MS',
    email: 'demo.customer1@example.com',
    createdAt: '2026-03-09T14:30:00.000Z',
    status: 'pending',
    isDemoSample: true,
  },
  {
    id: 'alert-seed-2',
    productId: 'prod-apc-bx750mi',
    productModel: 'Back-UPS BX750MI',
    productBrand: 'APC',
    productSku: 'APC-BX750MI-MS',
    email: 'demo.customer2@example.com',
    createdAt: '2026-03-10T09:15:00.000Z',
    status: 'pending',
    isDemoSample: true,
  },
];

/** No sample price alerts: they are only allowed for public prices and nothing monitors them. */
export const DEFAULT_PRICE_ALERTS: PriceAlertRequest[] = [];

/** History starts empty; it only records confirmed actions taken in this browser. */
export const DEFAULT_STOCK_MOVEMENTS: StockMovement[] = [];
