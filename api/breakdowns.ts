// Vercel function: /api/breakdowns (shared storage for all devices).
// Uses Upstash Redis from the Vercel Marketplace. Without its environment
// variables it answers 503 and the app keeps working with browser storage.
import { Redis } from '@upstash/redis'
import { handleBreakdowns } from '../src/server/breakdownsApi.js'
import { redisStore } from '../src/server/redisStore.js'
import type { BreakdownStore } from '../src/server/store.js'

function createStore(): BreakdownStore | null {
  const configured =
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ||
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  return configured ? redisStore(Redis.fromEnv()) : null
}

const store = createStore()

export function GET(request: Request): Promise<Response> {
  return handleBreakdowns(request, store)
}
export function POST(request: Request): Promise<Response> {
  return handleBreakdowns(request, store)
}
export function PATCH(request: Request): Promise<Response> {
  return handleBreakdowns(request, store)
}
export function PUT(request: Request): Promise<Response> {
  return handleBreakdowns(request, store)
}
