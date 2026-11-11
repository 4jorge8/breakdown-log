import { describe, expect, it } from 'vitest'
import { allowedTransitions, changeStatus, formatDuration, pendingForTriage, resolvedHistory } from '../../src/domain/breakdowns'
import { breakdown } from '../helpers'

describe('pendingForTriage', () => {
  it('sorts by priority, then stopped machines, then oldest report', () => {
    const list = [
      breakdown({ id: 'low', priority: 'low', reportedAt: '2026-11-01T00:00:00Z' }),
      breakdown({ id: 'high-new', priority: 'high', reportedAt: '2026-11-10T10:00:00Z' }),
      breakdown({ id: 'high-old', priority: 'high', reportedAt: '2026-11-10T08:00:00Z' }),
      breakdown({ id: 'med-running', priority: 'medium', machineStopped: false }),
      breakdown({ id: 'med-stopped', priority: 'medium', machineStopped: true }),
    ]
    expect(pendingForTriage(list).map((b) => b.id)).toEqual(['high-old', 'high-new', 'med-stopped', 'med-running', 'low'])
  })

  it('excludes resolved breakdowns and does not mutate the input', () => {
    const list = [breakdown({ id: 'a', status: 'resolved' }), breakdown({ id: 'b', status: 'in_progress' })]
    const copy = [...list]
    expect(pendingForTriage(list).map((b) => b.id)).toEqual(['b'])
    expect(list).toEqual(copy)
  })

  it('returns an empty list when there is nothing pending', () => {
    expect(pendingForTriage([])).toEqual([])
  })
})

describe('resolvedHistory', () => {
  it('lists resolved breakdowns, most recent first', () => {
    const list = [
      breakdown({ id: 'old', status: 'resolved', resolvedAt: '2026-11-01T00:00:00Z' }),
      breakdown({ id: 'open' }),
      breakdown({ id: 'new', status: 'resolved', resolvedAt: '2026-11-05T00:00:00Z' }),
    ]
    expect(resolvedHistory(list).map((b) => b.id)).toEqual(['new', 'old'])
  })
})

describe('changeStatus', () => {
  const now = new Date('2026-11-10T09:30:00Z')

  it('open -> in progress records when the repair started', () => {
    const b = changeStatus(breakdown(), 'in_progress', now)
    expect(b.status).toBe('in_progress')
    expect(b.startedAt).toBe(now.toISOString())
    expect(b.resolvedAt).toBeUndefined()
  })

  it('in progress -> resolved keeps the start and records the resolution', () => {
    const started = breakdown({ status: 'in_progress', startedAt: '2026-11-10T08:30:00.000Z' })
    const b = changeStatus(started, 'resolved', now)
    expect(b).toMatchObject({ status: 'resolved', startedAt: '2026-11-10T08:30:00.000Z', resolvedAt: now.toISOString() })
  })

  it('allows a quick fix from open straight to resolved', () => {
    const b = changeStatus(breakdown(), 'resolved', now)
    expect(b.startedAt).toBe(now.toISOString())
    expect(b.resolvedAt).toBe(now.toISOString())
  })

  it('rejects invalid changes', () => {
    expect(() => changeStatus(breakdown({ status: 'resolved' }), 'open', now)).toThrow()
    expect(() => changeStatus(breakdown({ status: 'in_progress' }), 'open', now)).toThrow()
    expect(allowedTransitions('resolved')).toEqual([])
  })
})

describe('formatDuration', () => {
  it.each([
    [0, '0 min'],
    [-5000, '0 min'],
    [45 * 60e3, '45 min'],
    [60 * 60e3, '1 h'],
    [135 * 60e3, '2 h 15 min'],
    [24 * 3600e3, '1 d'],
    [76 * 3600e3, '3 d 4 h'],
  ])('%i ms -> %s', (ms, text) => {
    expect(formatDuration(ms)).toBe(text)
  })
})
