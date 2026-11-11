import { describe, expect, it } from 'vitest'
import { sampleBreakdowns } from '../../src/data/sampleData'
import { MACHINES } from '../../src/data/machines'
import { validateBreakdownInput } from '../../src/domain/breakdowns'

describe('sampleBreakdowns', () => {
  const now = new Date('2026-11-13T10:00:00Z')
  const list = sampleBreakdowns(now)

  it('only uses machines of the plant and valid reports', () => {
    for (const b of list) {
      expect(MACHINES.some((m) => m.id === b.machineId)).toBe(true)
      expect(validateBreakdownInput({ ...b })).toEqual({})
    }
  })

  it('has consistent dates: report <= start <= resolution <= now', () => {
    for (const b of list) {
      const reported = Date.parse(b.reportedAt)
      expect(reported).toBeLessThanOrEqual(now.getTime())
      if (b.startedAt) expect(Date.parse(b.startedAt)).toBeGreaterThanOrEqual(reported)
      if (b.resolvedAt) expect(Date.parse(b.resolvedAt)).toBeGreaterThanOrEqual(Date.parse(b.startedAt!))
      if (b.resolvedAt) expect(Date.parse(b.resolvedAt)).toBeLessThanOrEqual(now.getTime())
    }
  })

  it('mixes open, in progress and resolved breakdowns', () => {
    const statuses = new Set(list.map((b) => b.status))
    expect(statuses).toEqual(new Set(['open', 'in_progress', 'resolved']))
  })
})
