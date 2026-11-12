import { describe, expect, it } from 'vitest'
import { isStatus, isValidBreakdown } from '../../src/domain/breakdowns'
import { breakdown } from '../helpers'

describe('isValidBreakdown', () => {
  it('accepts a complete record', () => {
    expect(isValidBreakdown(breakdown())).toBe(true)
    expect(isValidBreakdown(breakdown({ status: 'resolved', startedAt: '2026-11-10T09:00:00Z', resolvedAt: '2026-11-10T10:00:00Z' }))).toBe(true)
  })

  it.each([
    ['null', null],
    ['a string', 'x'],
    ['no id', breakdown({ id: '' })],
    ['unknown status', { ...breakdown(), status: 'closed' }],
    ['unknown priority', { ...breakdown(), priority: 'urgent' }],
    ['unknown machine', breakdown({ machineId: 'nope' })],
    ['short description', breakdown({ description: 'x' })],
    ['bad date', breakdown({ reportedAt: 'yesterday' })],
    ['resolved without date', breakdown({ status: 'resolved' })],
    ['machineStopped not boolean', { ...breakdown(), machineStopped: 'yes' }],
  ])('rejects %s', (_label, value) => {
    expect(isValidBreakdown(value)).toBe(false)
  })

  it('recognises valid statuses only', () => {
    expect(isStatus('in_progress')).toBe(true)
    expect(isStatus('done')).toBe(false)
  })
})
