export type Priority = 'high' | 'medium' | 'low'

export type Status = 'open' | 'in_progress' | 'resolved'

export interface Machine {
  id: string
  name: string
  area: string
}

export interface Breakdown {
  id: string
  machineId: string
  description: string
  priority: Priority
  /** True when the breakdown stops the machine (counts as downtime). */
  machineStopped: boolean
  reportedBy: string
  status: Status
  /** ISO 8601 dates */
  reportedAt: string
  startedAt?: string
  resolvedAt?: string
}

/** What the operator fills in the report form. */
export interface BreakdownInput {
  machineId: string
  description: string
  priority: Priority | ''
  machineStopped: boolean
  reportedBy: string
}

export type InputErrors = Partial<Record<keyof BreakdownInput, string>>
