import type { Breakdown, BreakdownInput, Status, StorageMode } from '../types/breakdown'
import { changeStatus, createBreakdown, isValidBreakdown } from '../domain/breakdowns'

/**
 * Data access for breakdowns. The ONLY module that touches storage.
 *
 * - cloud: the shared API (/api/breakdowns, Upstash Redis on Vercel), so every
 *   device sees the same breakdowns.
 * - local: browser localStorage, used when the API is not available
 *   (local development, or a deployment without a database connected).
 *
 * Both implement the same async interface, so stores and views don't know which one is used.
 */
export interface BreakdownRepository {
  mode: StorageMode
  list(): Promise<Breakdown[]>
  create(input: BreakdownInput): Promise<Breakdown>
  updateStatus(id: string, to: Status): Promise<Breakdown>
  replaceAll(list: Breakdown[]): Promise<void>
}

// ---------- local (browser) ----------

export const STORAGE_KEY = 'breakdown-log:breakdowns:v1'

export async function loadBreakdowns(): Promise<Breakdown[]> {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const data: unknown = JSON.parse(raw)
    return Array.isArray(data) ? data.filter(isValidBreakdown) : []
  } catch {
    // Corrupted data must not break the app
    return []
  }
}

export async function saveBreakdowns(breakdowns: Breakdown[]): Promise<void> {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(breakdowns))
}

export function newId(): string {
  return crypto.randomUUID()
}

export const localRepository: BreakdownRepository = {
  mode: 'local',
  list: loadBreakdowns,
  async create(input) {
    const breakdown = createBreakdown(input, new Date(), newId())
    await saveBreakdowns([...(await loadBreakdowns()), breakdown])
    return breakdown
  },
  async updateStatus(id, to) {
    const all = await loadBreakdowns()
    const current = all.find((b) => b.id === id)
    if (!current) throw new Error(`Breakdown not found: ${id}`)
    const updated = changeStatus(current, to, new Date())
    await saveBreakdowns(all.map((b) => (b.id === id ? updated : b)))
    return updated
  },
  replaceAll: saveBreakdowns,
}

// ---------- cloud (shared API) ----------

export const API_URL = '/api/breakdowns'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  constructor(status: number, code: string) {
    super(`API ${status}: ${code}`)
    this.status = status
    this.code = code
  }
}

type FetchFn = typeof fetch

async function call<T>(fetchFn: FetchFn, url: string, init?: RequestInit): Promise<T> {
  const res = await fetchFn(url, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  })
  const body: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const code = (body as { error?: string } | null)?.error ?? 'unknown'
    throw new ApiError(res.status, code)
  }
  return body as T
}

function checked(value: unknown): Breakdown {
  if (!isValidBreakdown(value)) throw new ApiError(502, 'invalid-response')
  return value
}

export function cloudRepository(fetchFn: FetchFn = fetch): BreakdownRepository {
  return {
    mode: 'cloud',
    async list() {
      const data = await call<unknown>(fetchFn, API_URL)
      if (!Array.isArray(data)) throw new ApiError(502, 'invalid-response')
      return data.filter(isValidBreakdown)
    },
    async create(input) {
      return checked(await call(fetchFn, API_URL, { method: 'POST', body: JSON.stringify(input) }))
    },
    async updateStatus(id, to) {
      return checked(
        await call(fetchFn, `${API_URL}?id=${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status: to }) }),
      )
    },
    async replaceAll(list) {
      await call(fetchFn, API_URL, { method: 'PUT', body: JSON.stringify(list) })
    },
  }
}

/**
 * Chooses where the data lives: the shared API if it answers with a list,
 * otherwise this browser. Returns the repository and its first list.
 */
export async function connect(fetchFn: FetchFn = fetch, timeoutMs = 4000): Promise<{ repo: BreakdownRepository; items: Breakdown[] }> {
  const cloud = cloudRepository((url, init) => fetchFn(url, { ...init, signal: AbortSignal.timeout(timeoutMs) }))
  try {
    const items = await cloud.list()
    return { repo: cloudRepository(fetchFn), items }
  } catch {
    return { repo: localRepository, items: await localRepository.list() }
  }
}
