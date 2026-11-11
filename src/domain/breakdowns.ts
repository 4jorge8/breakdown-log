import type { Breakdown, BreakdownInput, InputErrors, Priority } from '../types/breakdown'
import { MACHINES } from '../data/machines'

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
