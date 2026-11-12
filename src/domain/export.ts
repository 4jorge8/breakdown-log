import type { Breakdown, Machine } from '../types/breakdown'
import { PRIORITY_LABELS, STATUS_LABELS } from './breakdowns'
import { downtimeHours } from './metrics'

/** Excel in Spanish uses ";" as separator and "," as decimal mark. */
const SEP = ';'
const BOM = '﻿' // so Excel opens the file as UTF-8 (accents)

export const CSV_HEADERS = [
  'ID',
  'Máquina',
  'Área',
  'Descripción',
  'Prioridad',
  'Máquina parada',
  'Avisó',
  'Estado',
  'Fecha aviso',
  'Inicio reparación',
  'Fecha resolución',
  'Horas de parada',
  'Horas hasta resolver',
]

/**
 * Free text written by users must not be run by Excel as a formula
 * (CSV injection): a leading = + - @ is neutralised with an apostrophe.
 */
function neutraliseFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
}

function escapeCell(value: string): string {
  return /[";\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function formatDate(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatNumber(n: number): string {
  return n.toFixed(2).replace('.', ',')
}

/** CSV (Excel, Spanish locale) with every breakdown, most recent first. */
export function breakdownsToCsv(list: Breakdown[], machines: Machine[], now: Date): string {
  const rows = [...list]
    .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt))
    .map((b) => {
      const machine = machines.find((m) => m.id === b.machineId)
      const toResolve = b.resolvedAt ? (Date.parse(b.resolvedAt) - Date.parse(b.reportedAt)) / 3_600_000 : null
      return [
        b.id,
        machine?.name ?? b.machineId,
        machine?.area ?? '',
        neutraliseFormula(b.description),
        PRIORITY_LABELS[b.priority],
        b.machineStopped ? 'Sí' : 'No',
        neutraliseFormula(b.reportedBy),
        STATUS_LABELS[b.status],
        formatDate(b.reportedAt),
        formatDate(b.startedAt),
        formatDate(b.resolvedAt),
        formatNumber(downtimeHours(b, now)),
        toResolve === null ? '' : formatNumber(toResolve),
      ]
        .map(escapeCell)
        .join(SEP)
    })
  return BOM + [CSV_HEADERS.join(SEP), ...rows].join('\r\n') + '\r\n'
}

export function csvFileName(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `averias-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.csv`
}
