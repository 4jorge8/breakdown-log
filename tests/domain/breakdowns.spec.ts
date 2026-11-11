import { describe, expect, it } from 'vitest'
import { createBreakdown, validateBreakdownInput, DESCRIPTION_MAX } from '../../src/domain/breakdowns'
import { validInput } from '../helpers'

describe('validateBreakdownInput', () => {
  it('accepts a complete report', () => {
    expect(validateBreakdownInput(validInput())).toEqual({})
  })

  it('requires an existing machine', () => {
    expect(validateBreakdownInput(validInput({ machineId: '' })).machineId).toBeDefined()
    expect(validateBreakdownInput(validInput({ machineId: 'not-a-machine' })).machineId).toBeDefined()
  })

  it('requires a description of at least 5 characters, ignoring spaces', () => {
    expect(validateBreakdownInput(validInput({ description: '    abc   ' })).description).toBeDefined()
    expect(validateBreakdownInput(validInput({ description: 'Fuga' })).description).toBeDefined()
    expect(validateBreakdownInput(validInput({ description: 'Fugas' })).description).toBeUndefined()
  })

  it('rejects descriptions longer than the maximum', () => {
    const long = 'x'.repeat(DESCRIPTION_MAX + 1)
    expect(validateBreakdownInput(validInput({ description: long })).description).toBeDefined()
    expect(validateBreakdownInput(validInput({ description: 'x'.repeat(DESCRIPTION_MAX) })).description).toBeUndefined()
  })

  it('requires a priority and the reporter name', () => {
    const errors = validateBreakdownInput(validInput({ priority: '', reportedBy: ' ' }))
    expect(errors.priority).toBeDefined()
    expect(errors.reportedBy).toBeDefined()
  })
})

describe('createBreakdown', () => {
  it('creates an open breakdown with trimmed text and the report date', () => {
    const now = new Date('2026-11-11T08:00:00Z')
    const b = createBreakdown(validInput({ description: '  Fuga de aceite  ', reportedBy: ' Ana ' }), now, 'id-1')
    expect(b).toMatchObject({
      id: 'id-1',
      machineId: 'ext-1',
      description: 'Fuga de aceite',
      reportedBy: 'Ana',
      priority: 'high',
      machineStopped: true,
      status: 'open',
      reportedAt: '2026-11-11T08:00:00.000Z',
    })
    expect(b.resolvedAt).toBeUndefined()
  })

  it('throws on invalid input instead of saving bad data', () => {
    expect(() => createBreakdown(validInput({ machineId: '' }), new Date(), 'x')).toThrow()
  })
})
