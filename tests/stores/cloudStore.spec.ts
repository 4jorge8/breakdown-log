import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useBreakdownsStore } from '../../src/stores/breakdowns'
import { breakdown, validInput } from '../helpers'

function reply(status: number, body: unknown) {
  return Promise.resolve(new Response(JSON.stringify(body), { status }))
}

describe('breakdowns store with shared storage', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })
  afterEach(() => vi.unstubAllGlobals())

  it('uses the API, and sees breakdowns reported from other devices on refresh', async () => {
    let serverList = [breakdown({ id: 'a' })]
    vi.stubGlobal('fetch', vi.fn(() => reply(200, serverList)))
    const store = useBreakdownsStore()
    await store.load()
    expect(store.mode).toBe('cloud')
    expect(store.items.map((b) => b.id)).toEqual(['a'])

    serverList = [...serverList, breakdown({ id: 'from-phone' })]
    await store.refresh()
    expect(store.items.map((b) => b.id)).toEqual(['a', 'from-phone'])
    expect(localStorage.length).toBe(0) // nothing written in the browser
  })

  it('shows an error in Spanish and keeps the list when saving fails', async () => {
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => (init?.method ? reply(500, { error: 'boom' }) : reply(200, [])))
    vi.stubGlobal('fetch', fetchMock)
    const store = useBreakdownsStore()
    await store.load()
    await expect(store.report(validInput())).rejects.toThrow()
    expect(store.error).toContain('No se ha podido guardar')
    expect(store.items).toEqual([])
  })

  it('validates in the browser before calling the API', async () => {
    const fetchMock = vi.fn(() => reply(200, []))
    vi.stubGlobal('fetch', fetchMock)
    const store = useBreakdownsStore()
    await store.load()
    await expect(store.report(validInput({ machineId: '' }))).rejects.toThrow()
    expect(fetchMock).toHaveBeenCalledTimes(1) // only the initial list
  })
})
