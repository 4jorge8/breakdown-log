import type { Breakdown } from '../types/breakdown'

/**
 * Data access for breakdowns. The ONLY module that touches storage.
 * The MVP keeps data in the browser (localStorage); a REST API can replace
 * this implementation later with the same async interface.
 */
export const STORAGE_KEY = 'breakdown-log:breakdowns:v1'

export async function loadBreakdowns(): Promise<Breakdown[]> {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const data: unknown = JSON.parse(raw)
    return Array.isArray(data) ? (data as Breakdown[]) : []
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
