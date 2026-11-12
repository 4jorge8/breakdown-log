import type { Machine } from '../types/breakdown.js'

/** Machines of the plant (a plastic film factory). Editable here until the backlog item "machine management" exists. */
export const MACHINES: Machine[] = [
  { id: 'ext-1', name: 'Extrusora 1', area: 'Extrusión' },
  { id: 'ext-2', name: 'Extrusora 2', area: 'Extrusión' },
  { id: 'bob-1', name: 'Bobinadora 1', area: 'Bobinado' },
  { id: 'cut-1', name: 'Cortadora longitudinal', area: 'Corte' },
  { id: 'prt-1', name: 'Impresora flexográfica', area: 'Impresión' },
  { id: 'cmp-1', name: 'Compresor de aire', area: 'Servicios' },
  { id: 'chl-1', name: 'Enfriadora de agua', area: 'Servicios' },
]

export function machineName(id: string): string {
  return MACHINES.find((m) => m.id === id)?.name ?? 'Máquina desconocida'
}
