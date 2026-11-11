import { beforeEach, describe, expect, it } from 'vitest'
import { STORAGE_KEY, loadBreakdowns, saveBreakdowns } from '../../src/services/breakdownService'
import { createBreakdown } from '../../src/domain/breakdowns'
import { validInput } from '../helpers'

describe('breakdownService', () => {
  beforeEach(() => localStorage.clear())

  it('returns an empty list when nothing is stored', async () => {
    expect(await loadBreakdowns()).toEqual([])
  })

  it('saves and loads breakdowns', async () => {
    const b = createBreakdown(validInput(), new Date(), 'id-1')
    await saveBreakdowns([b])
    expect(await loadBreakdowns()).toEqual([b])
  })

  it('survives corrupted storage', async () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(await loadBreakdowns()).toEqual([])
    localStorage.setItem(STORAGE_KEY, '{"a":1}')
    expect(await loadBreakdowns()).toEqual([])
  })
})
