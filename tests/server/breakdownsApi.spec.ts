import { describe, expect, it } from 'vitest'
import { MAX_BREAKDOWNS, MAX_WRITES_PER_MINUTE, handleBreakdowns } from '../../src/server/breakdownsApi'
import { memoryStore } from '../../src/server/store'
import { breakdown, validInput } from '../helpers'

const URL_ = 'https://app.test/api/breakdowns'
const now = () => new Date('2026-11-12T10:00:00Z')
const deps = { now, newId: () => 'srv-1' }

function req(method: string, body?: unknown, url = URL_, ip = '1.1.1.1') {
  return new Request(url, {
    method,
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  })
}

describe('handleBreakdowns', () => {
  it('answers 503 when no storage is configured (the app falls back to the browser)', async () => {
    const res = await handleBreakdowns(req('GET'), null)
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ error: 'storage-not-configured' })
  })

  it('GET lists the stored breakdowns', async () => {
    const res = await handleBreakdowns(req('GET'), memoryStore([breakdown()]))
    expect(res.status).toBe(200)
    expect(await res.json()).toHaveLength(1)
  })

  it('POST validates on the server and creates the breakdown with server id and time', async () => {
    const store = memoryStore()
    const res = await handleBreakdowns(req('POST', validInput()), store, deps)
    expect(res.status).toBe(201)
    expect(await res.json()).toMatchObject({ id: 'srv-1', status: 'open', reportedAt: '2026-11-12T10:00:00.000Z' })
    expect(await store.all()).toHaveLength(1)
  })

  it('POST rejects invalid input with the field errors, and bad JSON', async () => {
    const store = memoryStore()
    const res = await handleBreakdowns(req('POST', validInput({ description: '', machineId: 'x' })), store, deps)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(Object.keys(body.fields)).toEqual(expect.arrayContaining(['description', 'machineId']))
    expect((await handleBreakdowns(req('POST', '{oops'), store, deps)).status).toBe(400)
    expect((await handleBreakdowns(req('POST', 'null'), store, deps)).status).toBe(400)
    expect(await store.all()).toEqual([])
  })

  it('POST refuses new breakdowns when the limit is reached', async () => {
    const full = Array.from({ length: MAX_BREAKDOWNS }, (_, i) => breakdown({ id: `b${i}` }))
    const res = await handleBreakdowns(req('POST', validInput()), memoryStore(full), deps)
    expect(res.status).toBe(409)
  })

  it('PATCH changes the status following the allowed transitions', async () => {
    const store = memoryStore([breakdown({ id: 'a' })])
    const ok = await handleBreakdowns(req('PATCH', { status: 'in_progress' }, `${URL_}?id=a`), store, deps)
    expect(ok.status).toBe(200)
    expect((await store.get('a'))?.status).toBe('in_progress')

    expect((await handleBreakdowns(req('PATCH', { status: 'open' }, `${URL_}?id=a`), store, deps)).status).toBe(409)
    expect((await handleBreakdowns(req('PATCH', { status: 'closed' }, `${URL_}?id=a`), store, deps)).status).toBe(400)
    expect((await handleBreakdowns(req('PATCH', { status: 'resolved' }, `${URL_}?id=zzz`), store, deps)).status).toBe(404)
  })

  it('PUT replaces everything only with valid records (demo mode)', async () => {
    const store = memoryStore([breakdown({ id: 'old' })])
    const ok = await handleBreakdowns(req('PUT', [breakdown({ id: 'n1' }), breakdown({ id: 'n2' })]), store, deps)
    expect(ok.status).toBe(200)
    expect((await store.all()).map((b) => b.id)).toEqual(['n1', 'n2'])

    const bad = await handleBreakdowns(req('PUT', [breakdown({ id: 'x' }), { id: 'evil' }]), store, deps)
    expect(bad.status).toBe(400)
    expect((await store.all()).map((b) => b.id)).toEqual(['n1', 'n2'])

    expect((await handleBreakdowns(req('PUT', { not: 'a list' }), store, deps)).status).toBe(400)
    expect((await handleBreakdowns(req('PUT', []), store, deps)).status).toBe(200)
    expect(await store.all()).toEqual([])
  })

  it('rejects other methods', async () => {
    expect((await handleBreakdowns(req('DELETE'), memoryStore(), deps)).status).toBe(405)
  })

  it('limits writes per client and minute (rate limiting)', async () => {
    const store = memoryStore()
    for (let i = 0; i < MAX_WRITES_PER_MINUTE; i++) {
      expect((await handleBreakdowns(req('PUT', [], URL_, '9.9.9.9'), store, deps)).status).toBe(200)
    }
    expect((await handleBreakdowns(req('PUT', [], URL_, '9.9.9.9'), store, deps)).status).toBe(429)
    // another client is not affected, and reading is never limited
    expect((await handleBreakdowns(req('PUT', [], URL_, '8.8.8.8'), store, deps)).status).toBe(200)
    expect((await handleBreakdowns(req('GET', undefined, URL_, '9.9.9.9'), store, deps)).status).toBe(200)
  })
})
