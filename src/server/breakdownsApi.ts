import type { BreakdownInput } from '../types/breakdown.js'
import { changeStatus, createBreakdown, isStatus, isValidBreakdown, validateBreakdownInput } from '../domain/breakdowns.js'
import type { BreakdownStore } from './store.js'

export const MAX_WRITES_PER_MINUTE = 30
export const MAX_BREAKDOWNS = 500
const MAX_BODY_BYTES = 200_000

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store' } })
}

async function readJson(request: Request): Promise<unknown> {
  const text = await request.text()
  if (text.length > MAX_BODY_BYTES) throw new Error('too-large')
  return JSON.parse(text)
}

function clientId(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
}

export interface ApiDeps {
  now?: () => Date
  newId?: () => string
}

/**
 * REST API for breakdowns (Web standard Request -> Response):
 *   GET    /api/breakdowns           list
 *   POST   /api/breakdowns           report (body: BreakdownInput)
 *   PATCH  /api/breakdowns?id=...    change status (body: { status })
 *   PUT    /api/breakdowns           replace all (demo mode; body: Breakdown[])
 * Every input is validated on the server with the same domain rules as the UI.
 */
export async function handleBreakdowns(request: Request, store: BreakdownStore | null, deps: ApiDeps = {}): Promise<Response> {
  const now = deps.now ?? (() => new Date())
  const newId = deps.newId ?? (() => crypto.randomUUID())

  if (!store) return json({ error: 'storage-not-configured' }, 503)

  const method = request.method.toUpperCase()
  if (method === 'GET') return json(await store.all())

  if (!['POST', 'PATCH', 'PUT'].includes(method)) return json({ error: 'method-not-allowed' }, 405)

  if ((await store.hit(clientId(request))) > MAX_WRITES_PER_MINUTE) {
    return json({ error: 'too-many-requests' }, 429)
  }

  let body: unknown
  try {
    body = await readJson(request)
  } catch {
    return json({ error: 'invalid-json' }, 400)
  }

  if (method === 'POST') {
    const input = body as BreakdownInput
    const errors = typeof body === 'object' && body !== null ? validateBreakdownInput({
      machineId: String(input.machineId ?? ''),
      description: String(input.description ?? ''),
      priority: input.priority ?? '',
      machineStopped: input.machineStopped === true,
      reportedBy: String(input.reportedBy ?? ''),
    }) : { machineId: 'invalid' }
    if (Object.keys(errors).length > 0) return json({ error: 'invalid', fields: errors }, 400)
    if ((await store.all()).length >= MAX_BREAKDOWNS) return json({ error: 'limit-reached' }, 409)
    const breakdown = createBreakdown({ ...input, machineStopped: input.machineStopped === true }, now(), newId())
    await store.put(breakdown)
    return json(breakdown, 201)
  }

  if (method === 'PATCH') {
    const id = new URL(request.url).searchParams.get('id') ?? ''
    const to = (body as { status?: unknown })?.status
    if (!isStatus(to)) return json({ error: 'invalid-status' }, 400)
    const current = await store.get(id)
    if (!current) return json({ error: 'not-found' }, 404)
    try {
      const updated = changeStatus(current, to, now())
      await store.put(updated)
      return json(updated)
    } catch {
      return json({ error: 'invalid-transition' }, 409)
    }
  }

  // PUT: replace everything (demo mode: load sample data or clear)
  if (!Array.isArray(body) || body.length > MAX_BREAKDOWNS || !body.every(isValidBreakdown)) {
    return json({ error: 'invalid' }, 400)
  }
  await store.replace(body)
  return json(body)
}
