import { Hono } from 'hono'
import type { Env } from '../lib/types'

export const webhooksRouter = new Hono<{ Bindings: Env }>()

// Zoho CRM incoming webhook
webhooksRouter.post('/zoho', async (c) => {
  const body = await c.req.json().catch(() => null)
  if (!body) return c.json({ ok: false }, 400)

  // Enqueue processing — never block on webhook handler
  await c.env.TASK_QUEUE.send({
    type: 'sync_zoho_contact',
    payload: { source: 'webhook', data: body },
  })

  return c.json({ ok: true })
})
