import { Hono } from 'hono'
import type { Env } from '../lib/types'
import { authMiddleware, adminOnly } from '../middleware/auth'

export const zohoRouter = new Hono<{ Bindings: Env }>()

zohoRouter.use('*', authMiddleware)
zohoRouter.use('*', adminOnly)

// Force Zoho token refresh
zohoRouter.post('/refresh-token', async (c) => {
  const token = await refreshZohoToken(c.env)
  if (!token) return c.json({ ok: false, error: { code: 'ZOHO_ERROR', message: 'Token refresh failed', status: 500 } }, 500)
  return c.json({ ok: true, data: { message: 'Token refreshed' } })
})

// Sync a project to Zoho CRM
zohoRouter.post('/sync/project/:id', async (c) => {
  const { id } = c.req.param()
  await c.env.TASK_QUEUE.send({ type: 'sync_zoho_contact', payload: { projectId: id, force: true } })
  return c.json({ ok: true, data: { message: 'Sync enqueued' } })
})

export async function refreshZohoToken(env: Env): Promise<string | null> {
  try {
    const resp = await fetch(
      `https://accounts.zoho.${env.ZOHO_REGION}/oauth/v2/token?refresh_token=${env.ZOHO_REFRESH_TOKEN}&client_id=${env.ZOHO_CLIENT_ID}&client_secret=${env.ZOHO_CLIENT_SECRET}&grant_type=refresh_token`,
      { method: 'POST' }
    )
    const data = await resp.json() as { access_token?: string }
    if (!data.access_token) return null

    await env.SESSIONS.put('zoho_access_token', data.access_token, { expirationTtl: 3300 })
    return data.access_token
  } catch {
    return null
  }
}

export async function getZohoToken(env: Env): Promise<string | null> {
  const cached = await env.SESSIONS.get('zoho_access_token')
  if (cached) return cached
  return refreshZohoToken(env)
}

export async function zohoApiRequest(
  env: Env,
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<unknown> {
  const token = await getZohoToken(env)
  if (!token) throw new Error('No Zoho token available')

  const resp = await fetch(`https://www.zohoapis.${env.ZOHO_REGION}/crm/v3/${path}`, {
    method,
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  return resp.json()
}
