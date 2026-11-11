import type { Breakdown, Priority } from '../types/breakdown'

type Sample = [machineId: string, description: string, priority: Priority, stopped: boolean, by: string, hoursAgo: number, repairHours: number | null, startedAfter?: number]

// Realistic breakdowns of a plastic film plant over the last ~10 days.
// repairHours null = still pending; startedAfter = hours until the repair started (in progress).
const SAMPLES: Sample[] = [
  ['ext-1', 'Rotura de lámina en el cabezal de extrusión', 'high', true, 'Ana', 230, 5.5],
  ['ext-1', 'Temperatura de zona 3 fuera de consigna, salta alarma', 'high', true, 'Luis', 170, 3],
  ['ext-1', 'Fuga de aceite en el reductor del husillo', 'medium', true, 'Ana', 96, 7.5],
  ['ext-1', 'Ruido metálico en el rodillo de salida', 'high', true, 'Marta', 5, null, 1],
  ['ext-2', 'El variador del motor principal da error de sobrecorriente', 'high', true, 'Luis', 200, 2],
  ['ext-2', 'Sensor de espesor descalibrado', 'medium', false, 'Pedro', 60, 1.5],
  ['bob-1', 'Se atasca la bobina al hacer el cambio automático', 'medium', true, 'Marta', 150, 2.5],
  ['bob-1', 'Freno del eje desenrollador no actúa', 'high', true, 'Pedro', 40, 4],
  ['bob-1', 'Cuchilla de corte transversal desafilada', 'low', false, 'Ana', 3, null],
  ['cut-1', 'Desalineación de las cuchillas longitudinales', 'medium', true, 'Luis', 120, 1],
  ['prt-1', 'Mancha de tinta en el cilindro 3', 'low', false, 'Marta', 80, 0.75],
  ['prt-1', 'Bomba de tinta no arranca', 'high', true, 'Pedro', 26, 1.5],
  ['cmp-1', 'Pierde presión, salta cada 10 minutos', 'medium', false, 'Luis', 30, 6],
  ['chl-1', 'Caudal de agua bajo en el circuito de refrigeración', 'medium', true, 'Ana', 1.5, null],
]

const HOUR = 3_600_000

export function sampleBreakdowns(now: Date): Breakdown[] {
  return SAMPLES.map(([machineId, description, priority, machineStopped, reportedBy, hoursAgo, repairHours, startedAfter], i) => {
    const reported = now.getTime() - hoursAgo * HOUR
    const base: Breakdown = {
      id: `demo-${i + 1}`,
      machineId,
      description,
      priority,
      machineStopped,
      reportedBy,
      status: 'open',
      reportedAt: new Date(reported).toISOString(),
    }
    if (repairHours !== null) {
      return {
        ...base,
        status: 'resolved',
        startedAt: new Date(reported + Math.min(0.5, repairHours / 2) * HOUR).toISOString(),
        resolvedAt: new Date(reported + repairHours * HOUR).toISOString(),
      }
    }
    if (startedAfter !== undefined) {
      return { ...base, status: 'in_progress', startedAt: new Date(reported + startedAfter * HOUR).toISOString() }
    }
    return base
  })
}
