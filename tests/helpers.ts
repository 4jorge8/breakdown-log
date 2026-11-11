import type { Breakdown, BreakdownInput } from '../src/types/breakdown'

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


export function breakdown(overrides: Partial<Breakdown> = {}): Breakdown {
  return {
    id: 'b-1',
    machineId: 'ext-1',
    description: 'Avería de prueba',
    priority: 'medium',
    machineStopped: false,
    reportedBy: 'Ana',
    status: 'open',
    reportedAt: '2026-11-10T08:00:00.000Z',
    ...overrides,
  }
}
