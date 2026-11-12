import { describe, expect, it } from 'vitest'
import type { Redis } from '@upstash/redis'
import { redisStore } from '../../src/server/redisStore'
import { breakdown } from '../helpers'

/** Minimal in-memory stand-in for the Upstash client (only the commands the store uses). */
function fakeRedis() {
  const hashes = new Map<string, Map<string, unknown>>()
  const counters = new Map<string, number>()
  const expires: string[] = []
  const api = {
    async hgetall(key: string) {
      const h = hashes.get(key)
      return h && h.size ? Object.fromEntries(h) : null
    },
    async hget(key: string, field: string) {
      return hashes.get(key)?.get(field) ?? null
    },
    async hset(key: string, values: Record<string, unknown>) {
      const h = hashes.get(key) ?? new Map()
      Object.entries(values).forEach(([k, v]) => h.set(k, v))
      hashes.set(key, h)
      return Object.keys(values).length
    },
    async del(key: string) {
      hashes.delete(key)
      return 1
    },
    async incr(key: string) {
      const n = (counters.get(key) ?? 0) + 1
      counters.set(key, n)
      return n
    },
    async expire(key: string) {
      expires.push(key)
      return 1
    },
    multi() {
      const ops: (() => Promise<unknown>)[] = []
      const tx = {
        del: (key: string) => (ops.push(() => api.del(key)), tx),
        hset: (key: string, v: Record<string, unknown>) => (ops.push(() => api.hset(key, v)), tx),
        exec: async () => {
          for (const op of ops) await op()
          return []
        },
      }
      return tx
    },
  }
  return { client: api as unknown as Redis, hashes, expires }
}

describe('redisStore', () => {
  it('stores each breakdown as a field of one hash', async () => {
    const { client, hashes } = fakeRedis()
    const store = redisStore(client)
    await store.put(breakdown({ id: 'a' }))
    await store.put(breakdown({ id: 'b' }))
    expect([...hashes.get('breakdown-log:breakdowns')!.keys()]).toEqual(['a', 'b'])
    expect((await store.get('a'))?.id).toBe('a')
    expect(await store.get('zzz')).toBeNull()
    expect(await store.all()).toHaveLength(2)
  })

  it('returns an empty list when nothing is stored', async () => {
    expect(await redisStore(fakeRedis().client).all()).toEqual([])
  })

  it('replaces everything atomically, also with an empty list', async () => {
    const { client } = fakeRedis()
    const store = redisStore(client)
    await store.put(breakdown({ id: 'old' }))
    await store.replace([breakdown({ id: 'new' })])
    expect((await store.all()).map((b) => b.id)).toEqual(['new'])
    await store.replace([])
    expect(await store.all()).toEqual([])
  })

  it('counts writes per client and sets an expiry on the first one', async () => {
    const { client, expires } = fakeRedis()
    const store = redisStore(client)
    expect(await store.hit('1.1.1.1')).toBe(1)
    expect(await store.hit('1.1.1.1')).toBe(2)
    expect(expires).toHaveLength(1)
  })
})
