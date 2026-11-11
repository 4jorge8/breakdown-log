import { describe, expect, it } from 'vitest'
import { downtimeHours, formatHours, machineIndicators, mttrHours, plantIndicators } from '../../src/domain/metrics'
import type { Machine } from '../../src/types/breakdown'
import { breakdown } from '../helpers'

const now = new Date('2026-11-10T12:00:00Z')
const machines: Machine[] = [
  { id: 'a', name: 'A', area: 'X' },
  { id: 'b', name: 'B', area: 'X' },
  { id: 'c', name: 'C', area: 'Y' },
]

describe('downtimeHours', () => {
  it('counts report -> resolution when the machine was stopped', () => {
    const b = breakdown({ machineStopped: true, status: 'resolved', reportedAt: '2026-11-10T08:00:00Z', resolvedAt: '2026-11-10T10:30:00Z' })
    expect(downtimeHours(b, now)).toBe(2.5)
  })

  it('counts until now while the machine is still stopped', () => {
    const b = breakdown({ machineStopped: true, reportedAt: '2026-11-10T09:00:00Z' })
    expect(downtimeHours(b, now)).toBe(3)
  })

  it('is zero when the machine kept running', () => {
    const b = breakdown({ machineStopped: false, status: 'resolved', reportedAt: '2026-11-10T08:00:00Z', resolvedAt: '2026-11-10T11:00:00Z' })
    expect(downtimeHours(b, now)).toBe(0)
  })
})

describe('mttrHours', () => {
  it('averages report -> resolution over resolved breakdowns only', () => {
    const list = [
      breakdown({ status: 'resolved', reportedAt: '2026-11-10T08:00:00Z', resolvedAt: '2026-11-10T09:00:00Z' }),
      breakdown({ status: 'resolved', reportedAt: '2026-11-10T08:00:00Z', resolvedAt: '2026-11-10T11:00:00Z' }),
      breakdown({ status: 'open', reportedAt: '2026-11-01T00:00:00Z' }),
    ]
    expect(mttrHours(list)).toBe(2)
  })

  it('includes breakdowns that did not stop the machine', () => {
    const list = [breakdown({ machineStopped: false, status: 'resolved', reportedAt: '2026-11-10T08:00:00Z', resolvedAt: '2026-11-10T12:00:00Z' })]
    expect(mttrHours(list)).toBe(4)
  })

  it('is null when nothing has been resolved', () => {
    expect(mttrHours([])).toBeNull()
    expect(mttrHours([breakdown()])).toBeNull()
  })
})

describe('machineIndicators', () => {
  const list = [
    breakdown({ id: '1', machineId: 'a', machineStopped: true, status: 'resolved', reportedAt: '2026-11-10T08:00:00Z', resolvedAt: '2026-11-10T09:00:00Z' }),
    breakdown({ id: '2', machineId: 'b', machineStopped: true, status: 'resolved', reportedAt: '2026-11-10T06:00:00Z', resolvedAt: '2026-11-10T10:00:00Z' }),
    breakdown({ id: '3', machineId: 'b', machineStopped: false, reportedAt: '2026-11-10T11:00:00Z' }),
  ]

  it('computes the indicators of each machine and sorts by downtime', () => {
    const rows = machineIndicators(list, machines, now)
    expect(rows.map((r) => r.machine.id)).toEqual(['b', 'a', 'c'])
    expect(rows[0]).toMatchObject({ breakdowns: 2, open: 1, downtimeHours: 4, mttrHours: 4 })
    expect(rows[1]).toMatchObject({ breakdowns: 1, open: 0, downtimeHours: 1, mttrHours: 1 })
  })

  it('includes machines without breakdowns with empty indicators', () => {
    const c = machineIndicators(list, machines, now).find((r) => r.machine.id === 'c')
    expect(c).toMatchObject({ breakdowns: 0, open: 0, downtimeHours: 0, mttrHours: null })
  })

  it('ignores breakdowns of unknown machines in the per-machine table', () => {
    const rows = machineIndicators([breakdown({ machineId: 'zzz', machineStopped: true })], machines, now)
    expect(rows.every((r) => r.breakdowns === 0)).toBe(true)
  })
})

describe('plantIndicators', () => {
  it('summarises the whole plant', () => {
    const list = [
      breakdown({ machineStopped: true, status: 'resolved', reportedAt: '2026-11-10T08:00:00Z', resolvedAt: '2026-11-10T10:00:00Z' }),
      breakdown({ machineStopped: true, reportedAt: '2026-11-10T11:00:00Z' }),
    ]
    expect(plantIndicators(list, now)).toEqual({ breakdowns: 2, open: 1, downtimeHours: 3, mttrHours: 2 })
  })
})

describe('formatHours', () => {
  it('formats in Spanish with one decimal', () => {
    expect(formatHours(2.25)).toMatch(/^2,[23] h$/)
    expect(formatHours(0)).toBe('0,0 h')
    expect(formatHours(null)).toBe('—')
  })
})
