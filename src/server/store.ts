import type { Breakdown } from '../types/breakdown.js'

/** Server-side persistence used by the API. Implemented with Redis in production and in memory in tests. */
export interface BreakdownStore {
  all(): Promise<Breakdown[]>
  get(id: string): Promise<Breakdown | null>
  put(breakdown: Breakdown): Promise<void>
  replace(list: Breakdown[]): Promise<void>
  /** Counts a write from a client in the current minute (for rate limiting). */
  hit(clientId: string): Promise<number>
}

export function memoryStore(initial: Breakdown[] = []): BreakdownStore {
  const items = new Map(initial.map((b) => [b.id, b]))
  const hits = new Map<string, number>()
  return {
    async all() {
      return [...items.values()]
    },
    async get(id) {
      return items.get(id) ?? null
    },
    async put(b) {
      items.set(b.id, b)
    },
    async replace(list) {
      items.clear()
      list.forEach((b) => items.set(b.id, b))
    },
    async hit(clientId) {
      const key = `${clientId}:${Math.floor(Date.now() / 60_000)}`
      const n = (hits.get(key) ?? 0) + 1
      hits.set(key, n)
      return n
    },
  }
}
