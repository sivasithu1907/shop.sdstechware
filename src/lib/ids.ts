/** Prototype-grade unique id (not cryptographically secure). */
export function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Short human reference, e.g. DRAFT-481203. Not guaranteed unique across devices. */
export function createReference(prefix: string, now: Date = new Date()): string {
  return `${prefix}-${now.getTime().toString().slice(-6)}`;
}
