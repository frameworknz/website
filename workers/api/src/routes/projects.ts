import { Hono } from 'hono'
import { z } from 'zod'
import type { Env, JwtPayload } from '../lib/types'
import { Errors } from '../lib/errors'
import { authMiddleware } from '../middleware/auth'
import { writeAuditLog } from '../lib/audit'
import { generateId } from '../lib/id'

export const projectsRouter = new Hono<{ Bindings: Env }>()

projectsRouter.use('*', authMiddleware)

projectsRouter.get('/', async (c) => {
  const payload = c.get('jwtPayload' as never) as JwtPayload
  const status = c.req.query('status')
  const limit = Math.min(parseInt(c.req.query('limit') ?? '50'), 100)
  const offset = parseInt(c.req.query('offset') ?? '0')

  let query = 'SELECT p.*, u.name as qp_name FROM projects p LEFT JOIN users u ON p.assigned_qp_id = u.id'
  const bindings: unknown[] = []

  if (payload.role === 'qp') {
    query += ' WHERE p.assigned_qp_id = ?'
    bindings.push(payload.sub)
    if (status) {
      query += ' AND p.status = ?'
      bindings.push(status)
    }
  } else {
    if (status) {
      query += ' WHERE p.status = ?'
      bindings.push(status)
    }
  }

  query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?'
  bindings.push(limit, offset)

  const { results } = await c.env.DB.prepare(query).bind(...bindings).all()
  return c.json({ ok: true, data: results })
})

const createProjectSchema = z.object({
  title: z.string().min(1),
  address: z.string().min(1),
  suburb: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  council_ref: z.string().optional(),
  owner_name: z.string().optional(),
  owner_email: z.string().email().optional(),
  owner_phone: z.string().optional(),
  project_type: z.enum(['residential', 'commercial', 'industrial']),
  assigned_qp_id: z.string().optional(),
  notes: z.string().optional(),
})

projectsRouter.post('/', async (c) => {
  const payload = c.get('jwtPayload' as never) as JwtPayload
  const body = await c.req.json().catch(() => null)
  const parsed = createProjectSchema.safeParse(body)
  if (!parsed.success) return c.json(Errors.badRequest(parsed.error.message), 400)

  const data = parsed.data
  const id = generateId('proj')
  const assignedQpId = data.assigned_qp_id ?? (payload.role === 'qp' ? payload.sub : null)

  await c.env.DB.prepare(
    `INSERT INTO projects (id, title, address, suburb, city, postcode, council_ref, owner_name, owner_email, owner_phone, project_type, assigned_qp_id, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id, data.title, data.address, data.suburb ?? null, data.city ?? null,
      data.postcode ?? null, data.council_ref ?? null, data.owner_name ?? null,
      data.owner_email ?? null, data.owner_phone ?? null, data.project_type,
      assignedQpId, data.notes ?? null
    )
    .run()

  await writeAuditLog(c.env.DB, {
    userId: payload.sub,
    action: 'project.create',
    entityType: 'project',
    entityId: id,
    metadata: { title: data.title },
  })

  // Enqueue Zoho sync async
  await c.env.TASK_QUEUE.send({ type: 'sync_zoho_contact', payload: { projectId: id } })

  const project = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first()
  return c.json({ ok: true, data: project }, 201)
})

projectsRouter.get('/:id', async (c) => {
  const payload = c.get('jwtPayload' as never) as JwtPayload
  const { id } = c.req.param()

  const project = await c.env.DB.prepare(
    'SELECT p.*, u.name as qp_name FROM projects p LEFT JOIN users u ON p.assigned_qp_id = u.id WHERE p.id = ?'
  )
    .bind(id)
    .first()

  if (!project) return c.json(Errors.notFound('Project'), 404)
  if (payload.role === 'qp' && (project as { assigned_qp_id: string }).assigned_qp_id !== payload.sub) {
    return c.json(Errors.forbidden(), 403)
  }

  return c.json({ ok: true, data: project })
})

const updateProjectSchema = z.object({
  title: z.string().min(1).optional(),
  address: z.string().optional(),
  suburb: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  council_ref: z.string().optional(),
  owner_name: z.string().optional(),
  owner_email: z.string().email().optional(),
  owner_phone: z.string().optional(),
  status: z.enum(['active', 'on_hold', 'complete', 'cancelled']).optional(),
  assigned_qp_id: z.string().optional(),
  notes: z.string().optional(),
})

projectsRouter.patch('/:id', async (c) => {
  const payload = c.get('jwtPayload' as never) as JwtPayload
  const { id } = c.req.param()

  const project = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first()
  if (!project) return c.json(Errors.notFound('Project'), 404)

  const body = await c.req.json().catch(() => null)
  const parsed = updateProjectSchema.safeParse(body)
  if (!parsed.success) return c.json(Errors.badRequest(parsed.error.message), 400)

  const d = parsed.data
  await c.env.DB.prepare(
    `UPDATE projects SET
      title = COALESCE(?, title), address = COALESCE(?, address),
      suburb = COALESCE(?, suburb), city = COALESCE(?, city),
      postcode = COALESCE(?, postcode), council_ref = COALESCE(?, council_ref),
      owner_name = COALESCE(?, owner_name), owner_email = COALESCE(?, owner_email),
      owner_phone = COALESCE(?, owner_phone), status = COALESCE(?, status),
      assigned_qp_id = COALESCE(?, assigned_qp_id), notes = COALESCE(?, notes),
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  )
    .bind(
      d.title ?? null, d.address ?? null, d.suburb ?? null, d.city ?? null,
      d.postcode ?? null, d.council_ref ?? null, d.owner_name ?? null,
      d.owner_email ?? null, d.owner_phone ?? null, d.status ?? null,
      d.assigned_qp_id ?? null, d.notes ?? null, id
    )
    .run()

  await writeAuditLog(c.env.DB, {
    userId: payload.sub,
    action: 'project.update',
    entityType: 'project',
    entityId: id,
    metadata: d,
  })

  const updated = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first()
  return c.json({ ok: true, data: updated })
})
