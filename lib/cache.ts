type Entry<T> = { data: T; at: number };
const store = new Map<string, Entry<unknown>>();

const FRESH_MS = 30_000;  // under 30s → skip background refresh
const TTL_MS   = 120_000; // over 2min → must wait for fresh fetch

export function cacheGet<T>(key: string): { data: T; stale: boolean } | null {
  const e = store.get(key) as Entry<T> | undefined;
  if (!e) return null;
  const age = Date.now() - e.at;
  if (age > TTL_MS) { store.delete(key); return null; }
  return { data: e.data, stale: age > FRESH_MS };
}

export function cacheSet<T>(key: string, data: T): void {
  store.set(key, { data, at: Date.now() });
}

export function cacheInvalidate(...keys: string[]): void {
  for (const k of keys) store.delete(k);
}
