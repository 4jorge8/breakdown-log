import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useBreakdownsStore } from '../../src/stores/breakdowns'
import { loadBreakdowns } from '../../src/services/breakdownService'
import { validInput } from '../helpers'

describe('breakdowns store · report', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('adds the breakdown and persists it (survives a reload)', async () => {
    const store = useBreakdownsStore()
    const b = await store.report(validInput())
    expect(store.items).toHaveLength(1)
    expect(b.status).toBe('open')

    setActivePinia(createPinia()) // simulate reloading the page
    expect(await loadBreakdowns()).toHaveLength(1)
  })

  it('does not save invalid reports', async () => {
    const store = useBreakdownsStore()
    await expect(store.report(validInput({ description: '' }))).rejects.toThrow()
    expect(await loadBreakdowns()).toEqual([])
  })
})
