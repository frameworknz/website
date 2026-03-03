import { Hono } from 'hono'
import { z } from 'zod'
import type { Env, JwtPayload } from '../lib/types'
import { Errors } from '../lib/errors'
import { authMiddleware } from '../middleware/auth'
import { writeAuditLog } from '../lib/audit'
import { generateId } from '../lib/id'

export const checklistRouter = new Hono<{ Bindings: Env }>()

checklistRouter.use('*', authMiddleware)

const updateItemSchema = z.object({
  result: z.enum(['pass', 'fail', 'n/a', 'pending']).optional(),
  notes: z.string().optional(),
  requires_remediation: z.boolean().optional(),
  remediation_deadline: z.string().optional(),
})

checklistRouter.patch('/:id', async (c) => {
  const payload = c.get('jwtPayload' as never) as JwtPayload
  const { id } = c.req.param()

  const item = await c.env.DB.prepare(
    `SELECT ci.*, i.qp_id FROM checklist_items ci
     JOIN inspections i ON ci.inspection_id = i.id
     WHERE ci.id = ?`
  )
    .bind(id)
    .first<{ inspection_id: string; qp_id: string }>()

  if (!item) return c.json(Errors.notFound('Checklist item'), 404)
  if (payload.role === 'qp' && item.qp_id !== payload.sub) return c.json(Errors.forbidden(), 403)

  const body = await c.req.json().catch(() => null)
  const parsed = updateItemSchema.safeParse(body)
  if (!parsed.success) return c.json(Errors.badRequest(parsed.error.message), 400)

  const d = parsed.data
  await c.env.DB.prepare(
    `UPDATE checklist_items SET
      result = COALESCE(?, result), notes = COALESCE(?, notes),
      requires_remediation = COALESCE(?, requires_remediation),
      remediation_deadline = COALESCE(?, remediation_deadline)
     WHERE id = ?`
  )
    .bind(
      d.result ?? null, d.notes ?? null,
      d.requires_remediation !== undefined ? (d.requires_remediation ? 1 : 0) : null,
      d.remediation_deadline ?? null, id
    )
    .run()

  await writeAuditLog(c.env.DB, {
    userId: payload.sub,
    action: 'checklist.update',
    entityType: 'checklist_item',
    entityId: id,
    metadata: d,
  })

  const updated = await c.env.DB.prepare('SELECT * FROM checklist_items WHERE id = ?').bind(id).first()
  return c.json({ ok: true, data: updated })
})

// Add custom checklist item to inspection
const addItemSchema = z.object({
  inspection_id: z.string(),
  category: z.string(),
  item_code: z.string(),
  description: z.string(),
})

checklistRouter.post('/', async (c) => {
  const payload = c.get('jwtPayload' as never) as JwtPayload
  const body = await c.req.json().catch(() => null)
  const parsed = addItemSchema.safeParse(body)
  if (!parsed.success) return c.json(Errors.badRequest(parsed.error.message), 400)

  const { inspection_id, category, item_code, description } = parsed.data

  const inspection = await c.env.DB.prepare('SELECT qp_id FROM inspections WHERE id = ?').bind(inspection_id).first<{ qp_id: string }>()
  if (!inspection) return c.json(Errors.notFound('Inspection'), 404)
  if (payload.role === 'qp' && inspection.qp_id !== payload.sub) return c.json(Errors.forbidden(), 403)

  const count = await c.env.DB.prepare('SELECT COUNT(*) as c FROM checklist_items WHERE inspection_id = ?')
    .bind(inspection_id)
    .first<{ c: number }>()

  const id = generateId('ci')
  await c.env.DB.prepare(
    'INSERT INTO checklist_items (id, inspection_id, category, item_code, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(id, inspection_id, category, item_code, description, (count?.c ?? 0) + 1)
    .run()

  const item = await c.env.DB.prepare('SELECT * FROM checklist_items WHERE id = ?').bind(id).first()
  return c.json({ ok: true, data: item }, 201)
})
