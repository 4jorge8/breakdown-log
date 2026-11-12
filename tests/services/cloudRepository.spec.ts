import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, cloudRepository, connect, saveBreakdowns } from '../../src/services/breakdownService'
import { breakdown, validInput } from '../helpers'

function reply(status: number, body: unknown) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }))
}

describe('cloudRepository', () => {
  it('lists breakdowns and drops invalid records from the server', async () => {
    const fetchFn = vi.fn(() => reply(200, [breakdown({ id: 'ok' }), { id: 'broken' }]))
    const list = await cloudRepository(fetchFn as typeof fetch).list()
    expect(list.map((b) => b.id)).toEqual(['ok'])
  })

  it('creates through POST and updates through PATCH with the id', async () => {
    const fetchFn = vi.fn((url: string, init?: RequestInit) =>
      init?.method === 'POST' ? reply(201, breakdown({ id: 'srv' })) : reply(200, breakdown({ id: 'srv', status: 'in_progress', startedAt: '2026-11-12T10:00:00Z' })),
    )
    const repo = cloudRepository(fetchFn as unknown as typeof fetch)
    expect((await repo.create(validInput())).id).toBe('srv')
    expect(JSON.parse(fetchFn.mock.calls[0][1]!.body as string)).toEqual(validInput())
    expect((await repo.updateStatus('a b', 'in_progress')).status).toBe('in_progress')
    expect(fetchFn.mock.calls[1][0]).toBe('/api/breakdowns?id=a%20b')
  })

  it('turns server errors into ApiError with the error code', async () => {
    const repo = cloudRepository((() => reply(429, { error: 'too-many-requests' })) as unknown as typeof fetch)
    await expect(repo.create(validInput())).rejects.toMatchObject({ status: 429, code: 'too-many-requests' })
    await expect(repo.create(validInput())).rejects.toBeInstanceOf(ApiError)
  })
})

describe('connect', () => {
  beforeEach(() => localStorage.clear())

  it('uses the shared API when it answers with a list', async () => {
    const { repo, items } = await connect((() => reply(200, [breakdown()])) as unknown as typeof fetch)
    expect(repo.mode).toBe('cloud')
    expect(items).toHaveLength(1)
  })

  it.each([
    ['the API is not configured (503)', () => reply(503, { error: 'storage-not-configured' })],
    ['there is no API (404 HTML in local development)', () => Promise.resolve(new Response('<html>', { status: 404 }))],
    ['the network fails', () => Promise.reject(new TypeError('offline'))],
    ['the API answers something that is not a list', () => reply(200, { hello: 1 })],
  ])('falls back to this browser when %s', async (_label, fetchImpl) => {
    await saveBreakdowns([breakdown({ id: 'local-1' })])
    const { repo, items } = await connect(fetchImpl as unknown as typeof fetch)
    expect(repo.mode).toBe('local')
    expect(items.map((b) => b.id)).toEqual(['local-1'])
  })
})
