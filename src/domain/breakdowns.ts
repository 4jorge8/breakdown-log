import type { Breakdown, BreakdownInput, InputErrors, Priority, Status } from '../types/breakdown.js'
import { MACHINES } from '../data/machines.js'

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

export const DESCRIPTION_MIN = 5
export const DESCRIPTION_MAX = 500

/** Returns the validation errors of a report (empty object when it is valid). */
export function validateBreakdownInput(input: BreakdownInput): InputErrors {
  const errors: InputErrors = {}
  if (!MACHINES.some((m) => m.id === input.machineId)) {
    errors.machineId = 'Elige la máquina averiada.'
  }
  const description = input.description.trim()
  if (description.length < DESCRIPTION_MIN) {
    errors.description = `Describe la avería (mínimo ${DESCRIPTION_MIN} caracteres).`
  } else if (description.length > DESCRIPTION_MAX) {
    errors.description = `La descripción no puede pasar de ${DESCRIPTION_MAX} caracteres.`
  }
  if (!input.priority) {
    errors.priority = 'Indica la prioridad.'
  }
  if (input.reportedBy.trim().length < 2) {
    errors.reportedBy = 'Escribe tu nombre.'
  }
  return errors
}

/** Builds a new open breakdown from a valid report. */
export function createBreakdown(input: BreakdownInput, now: Date, id: string): Breakdown {
  if (Object.keys(validateBreakdownInput(input)).length > 0) {
    throw new Error('Invalid breakdown input')
  }
  return {
    id,
    machineId: input.machineId,
    description: input.description.trim(),
    priority: input.priority as Priority,
    machineStopped: input.machineStopped,
    reportedBy: input.reportedBy.trim(),
    status: 'open',
    reportedAt: now.toISOString(),
  }
}

export function emptyInput(): BreakdownInput {
  return { machineId: '', description: '', priority: '', machineStopped: true, reportedBy: '' }
}

// ---------- US-02: triage and status changes ----------

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

export const STATUS_LABELS: Record<Status, string> = {
  open: 'Abierta',
  in_progress: 'En reparación',
  resolved: 'Resuelta',
}

/** Allowed status changes. A quick fix may go straight from open to resolved. */
const TRANSITIONS: Record<Status, Status[]> = {
  open: ['in_progress', 'resolved'],
  in_progress: ['resolved'],
  resolved: [],
}

export function allowedTransitions(status: Status): Status[] {
  return TRANSITIONS[status]
}

/** Returns a copy of the breakdown with the new status and its timestamp. */
export function changeStatus(b: Breakdown, to: Status, now: Date): Breakdown {
  if (!TRANSITIONS[b.status].includes(to)) {
    throw new Error(`Invalid status change: ${b.status} -> ${to}`)
  }
  const at = now.toISOString()
  if (to === 'in_progress') return { ...b, status: to, startedAt: at }
  return { ...b, status: to, startedAt: b.startedAt ?? at, resolvedAt: at }
}

/**
 * Pending breakdowns in the order maintenance should attend them:
 * priority first, then stopped machines, then the oldest report.
 */
export function pendingForTriage(list: Breakdown[]): Breakdown[] {
  return list
    .filter((b) => b.status !== 'resolved')
    .sort(
      (a, b) =>
        PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
        Number(b.machineStopped) - Number(a.machineStopped) ||
        a.reportedAt.localeCompare(b.reportedAt),
    )
}

/** Resolved breakdowns, most recent first. */
export function resolvedHistory(list: Breakdown[]): Breakdown[] {
  return list
    .filter((b) => b.status === 'resolved')
    .sort((a, b) => (b.resolvedAt ?? '').localeCompare(a.resolvedAt ?? ''))
}

/** Human duration in Spanish: "45 min", "2 h 15 min", "3 d 4 h". */
export function formatDuration(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / 60000))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return minutes % 60 ? `${hours} h ${minutes % 60} min` : `${hours} h`
  const days = Math.floor(hours / 24)
  return hours % 24 ? `${days} d ${hours % 24} h` : `${days} d`
}

// ---------- US-05: validating records that come from outside (API, storage) ----------

const STATUSES: Status[] = ['open', 'in_progress', 'resolved']
const PRIORITIES: Priority[] = ['high', 'medium', 'low']

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

export function isStatus(value: unknown): value is Status {
  return STATUSES.includes(value as Status)
}

/** True when an unknown value is a complete, consistent breakdown record. */
export function isValidBreakdown(value: unknown): value is Breakdown {
  if (typeof value !== 'object' || value === null) return false
  const b = value as Record<string, unknown>
  if (typeof b.id !== 'string' || b.id.length === 0 || b.id.length > 64) return false
  if (typeof b.machineStopped !== 'boolean' || !isStatus(b.status) || !isIsoDate(b.reportedAt)) return false
  if (!PRIORITIES.includes(b.priority as Priority)) return false
  if (typeof b.machineId !== 'string' || typeof b.description !== 'string' || typeof b.reportedBy !== 'string') return false
  const inputErrors = validateBreakdownInput({
    machineId: b.machineId,
    description: b.description,
    priority: b.priority as Priority,
    machineStopped: b.machineStopped,
    reportedBy: b.reportedBy,
  })
  if (Object.keys(inputErrors).length > 0) return false
  if (b.startedAt !== undefined && !isIsoDate(b.startedAt)) return false
  if (b.resolvedAt !== undefined && !isIsoDate(b.resolvedAt)) return false
  if (b.status === 'resolved' && b.resolvedAt === undefined) return false
  return true
}
