// Minimal in-memory TTL cache. Intentionally not backed by Redis or any
// external store — a single process's in-memory cache is enough to avoid
// re-hitting LTA DataMall for identical requests within a short window.
// Do not reach for infrastructure here unless a real multi-instance
// consistency requirement shows up later.

interface Entry<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache<T> {
  private readonly store = new Map<string, Entry<T>>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  clear(): void {
    this.store.clear();
  }
}
