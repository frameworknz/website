import { Hono } from 'hono'
import { z } from 'zod'
import type { Env, JwtPayload } from '../lib/types'
import { Errors } from '../lib/errors'
import { authMiddleware } from '../middleware/auth'
import { writeAuditLog } from '../lib/audit'
import { generateId } from '../lib/id'

export const inspectionsRouter = new Hono<{ Bindings: Env }>()

inspectionsRouter.use('*', authMiddleware)

inspectionsRouter.get('/', async (c) => {
  const payload = c.get('jwtPayload' as never) as JwtPayload
  const projectId = c.req.query('project_id')
  const status = c.req.query('status')
  const limit = Math.min(parseInt(c.req.query('limit') ?? '50'), 100)
  const offset = parseInt(c.req.query('offset') ?? '0')

  let query = `SELECT i.*, p.title as project_title, p.address as project_address, u.name as qp_name
               FROM inspections i
               JOIN projects p ON i.project_id = p.id
               JOIN users u ON i.qp_id = u.id`
  const bindings: unknown[] = []
  const conditions: string[] = []

  if (payload.role === 'qp') {
    conditions.push('i.qp_id = ?')
    bindings.push(payload.sub)
  }
  if (projectId) {
    conditions.push('i.project_id = ?')
    bindings.push(projectId)
  }
  if (status) {
    conditions.push('i.status = ?')
    bindings.push(status)
  }

  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ')
  query += ' ORDER BY i.scheduled_date DESC LIMIT ? OFFSET ?'
  bindings.push(limit, offset)

  const { results } = await c.env.DB.prepare(query).bind(...bindings).all()
  return c.json({ ok: true, data: results })
})

const createInspectionSchema = z.object({
  project_id: z.string(),
  inspection_type: z.enum([
    'foundation', 'subfloor_framing', 'pre_wrap', 'framing',
    'pre_line', 'wet_area_pre_line', 'pre_plaster', 'final',
  ]),
  scheduled_date: z.string().optional(),
  notes: z.string().optional(),
})

inspectionsRouter.post('/', async (c) => {
  const payload = c.get('jwtPayload' as never) as JwtPayload
  const body = await c.req.json().catch(() => null)
  const parsed = createInspectionSchema.safeParse(body)
  if (!parsed.success) return c.json(Errors.badRequest(parsed.error.message), 400)

  const { project_id, inspection_type, scheduled_date, notes } = parsed.data

  const project = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(project_id).first()
  if (!project) return c.json(Errors.notFound('Project'), 404)

  const id = generateId('insp')
  await c.env.DB.prepare(
    'INSERT INTO inspections (id, project_id, qp_id, inspection_type, scheduled_date, notes) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(id, project_id, payload.sub, inspection_type, scheduled_date ?? null, notes ?? null)
    .run()

  // Seed checklist from compliance rules for this inspection type
  const { results: rules } = await c.env.DB.prepare(
    "SELECT * FROM compliance_rules WHERE is_active = 1 AND (inspection_types LIKE ? OR inspection_types LIKE ? OR inspection_types LIKE ?)"
  )
    .bind(`%"${inspection_type}"%`, `["${inspection_type}"]`, `%${inspection_type}%`)
    .all<{ id: string; clause: string; title: string; description: string }>()

  if (rules.length > 0) {
    const stmt = c.env.DB.prepare(
      'INSERT INTO checklist_items (id, inspection_id, category, item_code, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    )
    const batch = rules.map((rule, i) =>
      stmt.bind(generateId('ci'), id, rule.clause, rule.id, rule.title, i)
    )
    await c.env.DB.batch(batch)
  }

  await writeAuditLog(c.env.DB, {
    userId: payload.sub,
    action: 'inspection.create',
    entityType: 'inspection',
    entityId: id,
    metadata: { project_id, inspection_type },
  })

  const inspection = await c.env.DB.prepare('SELECT * FROM inspections WHERE id = ?').bind(id).first()
  return c.json({ ok: true, data: inspection }, 201)
})

inspectionsRouter.get('/:id', async (c) => {
  const payload = c.get('jwtPayload' as never) as JwtPayload
  const { id } = c.req.param()

  const inspection = await c.env.DB.prepare(
    `SELECT i.*, p.title as project_title, p.address as project_address, u.name as qp_name
     FROM inspections i
     JOIN projects p ON i.project_id = p.id
     JOIN users u ON i.qp_id = u.id
     WHERE i.id = ?`
  )
    .bind(id)
    .first()

  if (!inspection) return c.json(Errors.notFound('Inspection'), 404)
  if (payload.role === 'qp' && (inspection as { qp_id: string }).qp_id !== payload.sub) {
    return c.json(Errors.forbidden(), 403)
  }

  return c.json({ ok: true, data: inspection })
})

const updateInspectionSchema = z.object({
  status: z.enum(['scheduled', 'in_progress', 'submitted', 'approved', 'failed', 'requires_remediation']).optional(),
  conducted_date: z.string().optional(),
  weather_conditions: z.string().optional(),
  site_conditions: z.string().optional(),
  overall_result: z.enum(['pass', 'conditional_pass', 'fail', 'incomplete']).optional(),
  notes: z.string().optional(),
})

inspectionsRouter.patch('/:id', async (c) => {
  const payload = c.get('jwtPayload' as never) as JwtPayload
  const { id } = c.req.param()

  const inspection = await c.env.DB.prepare('SELECT * FROM inspections WHERE id = ?').bind(id).first<{ qp_id: string; status: string }>()
  if (!inspection) return c.json(Errors.notFound('Inspection'), 404)
  if (payload.role === 'qp' && inspection.qp_id !== payload.sub) return c.json(Errors.forbidden(), 403)

  const body = await c.req.json().catch(() => null)
  const parsed = updateInspectionSchema.safeParse(body)
  if (!parsed.success) return c.json(Errors.badRequest(parsed.error.message), 400)

  const d = parsed.data
  await c.env.DB.prepare(
    `UPDATE inspections SET
      status = COALESCE(?, status), conducted_date = COALESCE(?, conducted_date),
      weather_conditions = COALESCE(?, weather_conditions), site_conditions = COALESCE(?, site_conditions),
      overall_result = COALESCE(?, overall_result), notes = COALESCE(?, notes),
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  )
    .bind(
      d.status ?? null, d.conducted_date ?? null, d.weather_conditions ?? null,
      d.site_conditions ?? null, d.overall_result ?? null, d.notes ?? null, id
    )
    .run()

  await writeAuditLog(c.env.DB, {
    userId: payload.sub,
    action: 'inspection.update',
    entityType: 'inspection',
    entityId: id,
    metadata: d,
  })

  const updated = await c.env.DB.prepare('SELECT * FROM inspections WHERE id = ?').bind(id).first()
  return c.json({ ok: true, data: updated })
})

// Submit inspection — transitions to submitted state
inspectionsRouter.post('/:id/submit', async (c) => {
  const payload = c.get('jwtPayload' as never) as JwtPayload
  const { id } = c.req.param()

  const inspection = await c.env.DB.prepare('SELECT * FROM inspections WHERE id = ?').bind(id).first<{ qp_id: string; status: string }>()
  if (!inspection) return c.json(Errors.notFound('Inspection'), 404)
  if (inspection.qp_id !== payload.sub) return c.json(Errors.forbidden(), 403)
  if (inspection.status !== 'in_progress') {
    return c.json(Errors.badRequest('Only in_progress inspections can be submitted'), 400)
  }

  await c.env.DB.prepare(
    "UPDATE inspections SET status = 'submitted', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  )
    .bind(id)
    .run()

  await writeAuditLog(c.env.DB, {
    userId: payload.sub,
    action: 'inspection.submit',
    entityType: 'inspection',
    entityId: id,
  })

  // Enqueue report generation
  await c.env.TASK_QUEUE.send({ type: 'generate_report', payload: { inspectionId: id } })

  return c.json({ ok: true, data: { id, status: 'submitted' } })
})

// Sign-off inspection
inspectionsRouter.post('/:id/sign-off', async (c) => {
  const payload = c.get('jwtPayload' as never) as JwtPayload
  const { id } = c.req.param()

  const inspection = await c.env.DB.prepare('SELECT * FROM inspections WHERE id = ?').bind(id).first<{ status: string; overall_result: string }>()
  if (!inspection) return c.json(Errors.notFound('Inspection'), 404)
  if (inspection.status !== 'submitted') {
    return c.json(Errors.badRequest('Only submitted inspections can be signed off'), 400)
  }

  const newStatus = inspection.overall_result === 'fail' ? 'failed' : 'approved'
  await c.env.DB.prepare(
    "UPDATE inspections SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  )
    .bind(newStatus, id)
    .run()

  await writeAuditLog(c.env.DB, {
    userId: payload.sub,
    action: 'inspection.sign_off',
    entityType: 'inspection',
    entityId: id,
    metadata: { status: newStatus },
  })

  // Enqueue Zoho deal update
  await c.env.TASK_QUEUE.send({ type: 'sync_zoho_contact', payload: { inspectionId: id, status: newStatus } })

  return c.json({ ok: true, data: { id, status: newStatus } })
})

// Get checklist items for an inspection
inspectionsRouter.get('/:id/checklist', async (c) => {
  const { id } = c.req.param()
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM checklist_items WHERE inspection_id = ? ORDER BY sort_order ASC'
  )
    .bind(id)
    .all()
  return c.json({ ok: true, data: results })
})
