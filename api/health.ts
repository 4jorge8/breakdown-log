// Vercel function: GET /api/health
// Used by uptime monitoring (UptimeRobot) to check the deployment is alive.
export function GET(): Response {
  return Response.json({ status: 'ok', app: 'breakdown-log' })
}
