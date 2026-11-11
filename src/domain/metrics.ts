import type { Breakdown, Machine } from '../types/breakdown'

const HOUR = 3_600_000

export interface MachineIndicators {
  machine: Machine
  breakdowns: number
  open: number
  /** Hours the machine was stopped: report -> resolution, or report -> now if still stopped. */
  downtimeHours: number
  /** Mean time to repair (report -> resolution) of resolved breakdowns; null if none resolved. */
  mttrHours: number | null
}

export interface PlantIndicators {
  breakdowns: number
  open: number
  downtimeHours: number
  mttrHours: number | null
}

function hoursBetween(from: string, to: Date): number {
  return Math.max(0, (to.getTime() - new Date(from).getTime()) / HOUR)
}

/** Downtime of one breakdown in hours (0 if it does not stop the machine). */
export function downtimeHours(b: Breakdown, now: Date): number {
  if (!b.machineStopped) return 0
  return hoursBetween(b.reportedAt, b.resolvedAt ? new Date(b.resolvedAt) : now)
}

/** Mean time to repair in hours over the resolved breakdowns; null if none. */
export function mttrHours(list: Breakdown[]): number | null {
  const resolved = list.filter((b) => b.status === 'resolved' && b.resolvedAt)
  if (resolved.length === 0) return null
  const total = resolved.reduce((sum, b) => sum + hoursBetween(b.reportedAt, new Date(b.resolvedAt!)), 0)
  return total / resolved.length
}

/** Indicators per machine, machines with most downtime first. Machines without breakdowns are included. */
export function machineIndicators(list: Breakdown[], machines: Machine[], now: Date): MachineIndicators[] {
  return machines
    .map((machine) => {
      const own = list.filter((b) => b.machineId === machine.id)
      return {
        machine,
        breakdowns: own.length,
        open: own.filter((b) => b.status !== 'resolved').length,
        downtimeHours: own.reduce((sum, b) => sum + downtimeHours(b, now), 0),
        mttrHours: mttrHours(own),
      }
    })
    .sort((a, b) => b.downtimeHours - a.downtimeHours || b.breakdowns - a.breakdowns)
}

export function plantIndicators(list: Breakdown[], now: Date): PlantIndicators {
  return {
    breakdowns: list.length,
    open: list.filter((b) => b.status !== 'resolved').length,
    downtimeHours: list.reduce((sum, b) => sum + downtimeHours(b, now), 0),
    mttrHours: mttrHours(list),
  }
}

/** "12,5 h" with one decimal, Spanish format; "—" when there is no value. */
export function formatHours(hours: number | null): string {
  if (hours === null) return '—'
  return `${hours.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h`
}
