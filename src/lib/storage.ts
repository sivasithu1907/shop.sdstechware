/**
 * Central browser-storage access.
 *
 * - Every read/write goes through here so failures (private mode, quota,
 *   blocked storage) never crash the app.
 * - Malformed stored data is never silently thrown away: the raw text is
 *   copied to a backup key before the app falls back to defaults, and the
 *   problem is recorded so the Staff Workspace can show it.
 *
 * Browser storage is NOT secure and NOT shared between devices. It is only a
 * prototype persistence layer.
 */

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  /** Optional key listing (window.localStorage is handled separately). */
  keys?(): string[];
}

/** Existing keys are preserved from the pre-baseline prototype so saved data keeps loading. */
export const STORAGE_KEYS = {
  PRODUCTS: 'sds_techware_products_v2',
  CATEGORIES: 'sds_techware_categories_v2',
  BRANDS: 'sds_techware_brands_v2',
  STAFF: 'sds_techware_staff_v2',
  ROLE: 'sds_techware_role_v2',
  QUOTE: 'sds_techware_quote_v2',
  RECENT_SEARCHES: 'sds_techware_recent_searches_v2',
  COMPARE: 'sds_techware_compare_v2',
  STOCK_ALERTS: 'sds_techware_stock_alerts_v2',
  PRICE_ALERTS: 'sds_techware_price_alerts_v2',
  SAVED_FOR_LATER: 'sds_techware_saved_for_later_v2',
  REVIEWS: 'sds_techware_reviews_v2',
  /** Holds stock movement history (legacy name kept for compatibility). */
  RESTOCK_LOGS: 'sds_techware_restock_logs_v2',
  LOW_STOCK_THRESHOLD: 'sds_low_stock_threshold',
  CATEGORY_THRESHOLDS: 'sds_category_thresholds',
  USER_ALERT_EMAIL: 'sds_user_alert_email',
  SUPPORT_MESSAGES: 'sds_live_support_messages',
  SUPPORT_SOUND: 'sds_live_support_sound',
  /** No longer read (the fake Online/Away toggle was removed). Left untouched in storage. */
  SUPPORT_STATUS_UNUSED: 'sds_live_support_status',
} as const;

/** Keys cleared by "Reset demo data". Preferences such as thresholds are kept. */
export const DEMO_DATA_KEYS: string[] = [
  STORAGE_KEYS.PRODUCTS,
  STORAGE_KEYS.CATEGORIES,
  STORAGE_KEYS.BRANDS,
  STORAGE_KEYS.STAFF,
  STORAGE_KEYS.ROLE,
  STORAGE_KEYS.QUOTE,
  STORAGE_KEYS.RECENT_SEARCHES,
  STORAGE_KEYS.COMPARE,
  STORAGE_KEYS.STOCK_ALERTS,
  STORAGE_KEYS.PRICE_ALERTS,
  STORAGE_KEYS.SAVED_FOR_LATER,
  STORAGE_KEYS.REVIEWS,
  STORAGE_KEYS.RESTOCK_LOGS,
];

export type ReadStatus = 'missing' | 'ok' | 'recovered' | 'malformed' | 'unavailable';

export interface StorageIssue {
  key: string;
  status: 'recovered' | 'malformed' | 'write_failed' | 'unavailable';
  message: string;
  backupKey?: string;
  at: string;
}

const issues: StorageIssue[] = [];
const listeners = new Set<(all: StorageIssue[]) => void>();

function recordIssue(issue: Omit<StorageIssue, 'at'>) {
  const full = { ...issue, at: new Date().toISOString() };
  issues.push(full);
  console.warn(`[storage] ${issue.key}: ${issue.message}`);
  listeners.forEach(l => l([...issues]));
}

export function getStorageIssues(): StorageIssue[] {
  return [...issues];
}

/** Backup copies of unreadable data made in this or earlier sessions (key names only). */
export function listBackupKeys(): string[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const isWindowStorage = typeof window !== 'undefined' && storage === window.localStorage;
    const keys = isWindowStorage ? Object.keys(window.localStorage) : (storage.keys?.() ?? []);
    return keys.filter(k => k.includes('__backup_')).sort();
  } catch {
    return [];
  }
}

export function subscribeStorageIssues(listener: (all: StorageIssue[]) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let storageOverride: StorageLike | null | undefined;

/** Test hook: inject a fake storage (or null to simulate unavailable storage). */
export function setStorageForTesting(storage: StorageLike | null | undefined) {
  storageOverride = storage;
  issues.length = 0;
}

export function getStorage(): StorageLike | null {
  if (storageOverride !== undefined) return storageOverride;
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function backupRaw(storage: StorageLike, key: string, raw: string): string | undefined {
  const backupKey = `${key}__backup_${Date.now()}`;
  try {
    storage.setItem(backupKey, raw);
    return backupKey;
  } catch {
    return undefined;
  }
}

export interface ReadResult<T> {
  value: T;
  status: ReadStatus;
}

/**
 * Read and validate a JSON value.
 *
 * `normalize` receives the parsed value and must return:
 *   - `{ value, dropped: 0 }` when everything was usable,
 *   - `{ value, dropped: n }` when n entries were unusable (raw data is backed up),
 *   - `null` when nothing is usable (raw data is backed up, fallback used).
 */
export function readJSON<T>(
  key: string,
  normalize: (parsed: unknown) => { value: T; dropped: number } | null,
  fallback: () => T,
): ReadResult<T> {
  const storage = getStorage();
  if (!storage) return { value: fallback(), status: 'unavailable' };

  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch {
    return { value: fallback(), status: 'unavailable' };
  }
  if (raw === null) return { value: fallback(), status: 'missing' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const backupKey = backupRaw(storage, key, raw);
    recordIssue({
      key,
      status: 'malformed',
      backupKey,
      message: `Stored data could not be parsed. Defaults are used; the original text was ${backupKey ? `copied to "${backupKey}"` : 'NOT backed up (storage full)'}.`,
    });
    return { value: fallback(), status: 'malformed' };
  }

  let result: { value: T; dropped: number } | null;
  try {
    result = normalize(parsed);
  } catch {
    result = null;
  }

  if (result === null) {
    const backupKey = backupRaw(storage, key, raw);
    recordIssue({
      key,
      status: 'malformed',
      backupKey,
      message: `Stored data had an unexpected shape. Defaults are used; the original text was ${backupKey ? `copied to "${backupKey}"` : 'NOT backed up (storage full)'}.`,
    });
    return { value: fallback(), status: 'malformed' };
  }

  if (result.dropped > 0) {
    const backupKey = backupRaw(storage, key, raw);
    recordIssue({
      key,
      status: 'recovered',
      backupKey,
      message: `${result.dropped} unreadable entr${result.dropped === 1 ? 'y was' : 'ies were'} skipped. The original text was ${backupKey ? `copied to "${backupKey}"` : 'NOT backed up (storage full)'}.`,
    });
    return { value: result.value, status: 'recovered' };
  }

  return { value: result.value, status: 'ok' };
}

/** Read a plain string value (no JSON). */
export function readString(key: string): string | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export interface WriteResult {
  ok: boolean;
  error?: string;
}

const reportedWriteFailures = new Set<string>();

function write(key: string, value: string): WriteResult {
  const storage = getStorage();
  if (!storage) {
    if (!reportedWriteFailures.has(key)) {
      reportedWriteFailures.add(key);
      recordIssue({ key, status: 'unavailable', message: 'Browser storage is unavailable. Changes are kept only until the page is reloaded.' });
    }
    return { ok: false, error: 'Browser storage is unavailable.' };
  }
  try {
    storage.setItem(key, value);
    reportedWriteFailures.delete(key);
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error && /quota/i.test(e.name + e.message)
      ? 'Browser storage is full (large images or chat attachments are the usual cause).'
      : 'The browser refused to save data.';
    if (!reportedWriteFailures.has(key)) {
      reportedWriteFailures.add(key);
      recordIssue({ key, status: 'write_failed', message: `${message} Recent changes are kept only until the page is reloaded.` });
    }
    return { ok: false, error: message };
  }
}

export function writeJSON(key: string, value: unknown): WriteResult {
  let text: string;
  try {
    text = JSON.stringify(value);
  } catch {
    return { ok: false, error: 'Value could not be serialised.' };
  }
  return write(key, text);
}

export function writeString(key: string, value: string): WriteResult {
  return write(key, value);
}

export function removeKey(key: string): WriteResult {
  const storage = getStorage();
  if (!storage) return { ok: false, error: 'Browser storage is unavailable.' };
  try {
    storage.removeItem(key);
    return { ok: true };
  } catch {
    return { ok: false, error: 'The browser refused to remove data.' };
  }
}

// ---------- small normalisation helpers shared by feature modules ----------

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Normalise an array by mapping each entry; entries returning null are counted as dropped. */
export function normalizeArray<T>(parsed: unknown, item: (raw: unknown) => T | null): { value: T[]; dropped: number } | null {
  if (!Array.isArray(parsed)) return null;
  const value: T[] = [];
  let dropped = 0;
  for (const raw of parsed) {
    const n = item(raw);
    if (n === null) dropped++;
    else value.push(n);
  }
  return { value, dropped };
}

export function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

export function asFiniteNumberOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}
