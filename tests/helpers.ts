import type { BreakdownInput } from '../src/types/breakdown'

export function validInput(overrides: Partial<BreakdownInput> = {}): BreakdownInput {
  return {
    machineId: 'ext-1',
    description: 'Ruido metálico en el rodillo de salida',
    priority: 'high',
    machineStopped: true,
    reportedBy: 'Ana',
    ...overrides,
  }
}
