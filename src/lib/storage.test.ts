import { afterEach, describe, expect, it } from 'vitest';
import { getStorageIssues, normalizeArray, readJSON, setStorageForTesting, writeJSON, type StorageLike } from './storage';

class MemoryStorage implements StorageLike {
  data = new Map<string, string>();
  failWrites = false;
  getItem(k: string) {
    return this.data.has(k) ? this.data.get(k)! : null;
  }
  setItem(k: string, v: string) {
    if (this.failWrites) {
      const e = new Error('Quota exceeded');
      e.name = 'QuotaExceededError';
      throw e;
    }
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

const numbers = (p: unknown) => normalizeArray(p, v => (typeof v === 'number' ? v : null));

afterEach(() => setStorageForTesting(undefined));

describe('browser storage adapter', () => {
  it('backs up unparseable data instead of discarding it, then uses defaults', () => {
    const mem = new MemoryStorage();
    mem.data.set('k', '{not json');
    setStorageForTesting(mem);
    const r = readJSON('k', numbers, () => [42]);
    expect(r.status).toBe('malformed');
    expect(r.value).toEqual([42]);
    const backupKey = [...mem.data.keys()].find(k => k.startsWith('k__backup_'))!;
    expect(mem.data.get(backupKey)).toBe('{not json');
    expect(getStorageIssues()[0]).toMatchObject({ key: 'k', status: 'malformed', backupKey });
  });

  it('keeps the readable entries, backs up the original and reports skipped ones', () => {
    const mem = new MemoryStorage();
    mem.data.set('k', JSON.stringify([1, 'x', 2]));
    setStorageForTesting(mem);
    const r = readJSON('k', numbers, () => []);
    expect(r.status).toBe('recovered');
    expect(r.value).toEqual([1, 2]);
    expect([...mem.data.keys()].some(k => k.startsWith('k__backup_'))).toBe(true);
  });

  it('falls back safely when storage is unavailable', () => {
    setStorageForTesting(null);
    expect(readJSON('k', numbers, () => [7])).toEqual({ value: [7], status: 'unavailable' });
    expect(writeJSON('k', [1]).ok).toBe(false);
  });

  it('reports write failures such as a full quota', () => {
    const mem = new MemoryStorage();
    mem.failWrites = true;
    setStorageForTesting(mem);
    const r = writeJSON('big', ['x']);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/full/i);
    expect(getStorageIssues().some(i => i.key === 'big' && i.status === 'write_failed')).toBe(true);
  });

  it('reads valid data unchanged', () => {
    const mem = new MemoryStorage();
    mem.data.set('k', '[3,4]');
    setStorageForTesting(mem);
    expect(readJSON('k', numbers, () => [])).toEqual({ value: [3, 4], status: 'ok' });
  });
});
