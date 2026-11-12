import type { Redis } from '@upstash/redis'
import type { Breakdown } from '../types/breakdown.js'
import type { BreakdownStore } from './store.js'

const KEY = 'breakdown-log:breakdowns'

/** Breakdowns stored in one Redis hash: field = breakdown id, value = breakdown JSON. */
export function redisStore(redis: Redis): BreakdownStore {
  return {
    async all() {
      const hash = await redis.hgetall<Record<string, Breakdown>>(KEY)
      return hash ? Object.values(hash) : []
    },
    async get(id) {
      return (await redis.hget<Breakdown>(KEY, id)) ?? null
    },
    async put(b) {
      await redis.hset(KEY, { [b.id]: b })
    },
    async replace(list) {
      const tx = redis.multi()
      tx.del(KEY)
      if (list.length > 0) tx.hset(KEY, Object.fromEntries(list.map((b) => [b.id, b])))
      await tx.exec()
    },
    async hit(clientId) {
      const key = `breakdown-log:rate:${clientId}:${Math.floor(Date.now() / 60_000)}`
      const n = await redis.incr(key)
      if (n === 1) await redis.expire(key, 120)
      return n
    },
  }
}
