import { Hono } from 'hono'
import { z } from 'zod'
import type { Env, JwtPayload } from '../lib/types'
import { Errors } from '../lib/errors'
import { authMiddleware, adminOnly } from '../middleware/auth'
import { writeAuditLog } from '../lib/audit'
import { generateId } from '../lib/id'

export const usersRouter = new Hono<{ Bindings: Env }>()

usersRouter.use('*', authMiddleware)

usersRouter.get('/me', async (c) => {
  const payload = c.get('jwtPayload' as never) as JwtPayload
  const user = await c.env.DB.prepare(
    'SELECT id, email, name, role, licence_number, licence_expiry, phone, mfa_enabled, created_at FROM users WHERE id = ?'
  )
    .bind(payload.sub)
    .first()

  if (!user) return c.json(Errors.notFound('User'), 404)
  return c.json({ ok: true, data: user })
})

const updateMeSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  licence_number: z.string().optional(),
  licence_expiry: z.string().optional(),
})

usersRouter.patch('/me', async (c) => {
  const payload = c.get('jwtPayload' as never) as JwtPayload
  const body = await c.req.json().catch(() => null)
  const parsed = updateMeSchema.safeParse(body)
  if (!parsed.success) return c.json(Errors.badRequest('Invalid fields'), 400)

  const { name, phone, licence_number, licence_expiry } = parsed.data
  await c.env.DB.prepare(
    'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), licence_number = COALESCE(?, licence_number), licence_expiry = COALESCE(?, licence_expiry), updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  )
    .bind(name ?? null, phone ?? null, licence_number ?? null, licence_expiry ?? null, payload.sub)
    .run()

  await writeAuditLog(c.env.DB, { userId: payload.sub, action: 'user.update', entityType: 'user', entityId: payload.sub })

  const updated = await c.env.DB.prepare(
    'SELECT id, email, name, role, licence_number, licence_expiry, phone, mfa_enabled FROM users WHERE id = ?'
  )
    .bind(payload.sub)
    .first()

  return c.json({ ok: true, data: updated })
})

// Admin only — list all users
usersRouter.get('/', adminOnly, async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, email, name, role, licence_number, licence_expiry, is_active, created_at FROM users ORDER BY created_at DESC'
  ).all()
  return c.json({ ok: true, data: results })
})

// Admin only — create user
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  role: z.enum(['qp', 'admin', 'viewer']).default('qp'),
  licence_number: z.string().optional(),
  licence_expiry: z.string().optional(),
  phone: z.string().optional(),
})

usersRouter.post('/', adminOnly, async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = createUserSchema.safeParse(body)
  if (!parsed.success) return c.json(Errors.badRequest(parsed.error.message), 400)

  const { email, name, password, role, licence_number, licence_expiry, phone } = parsed.data

  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
  if (existing) return c.json(Errors.conflict('Email already registered'), 409)

  const encoder = new TextEncoder()
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(password))
  const passwordHash = btoa(String.fromCharCode(...new Uint8Array(hash)))

  const id = generateId('usr')
  await c.env.DB.prepare(
    'INSERT INTO users (id, email, name, password_hash, role, licence_number, licence_expiry, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(id, email, name, passwordHash, role, licence_number ?? null, licence_expiry ?? null, phone ?? null)
    .run()

  const payload = c.get('jwtPayload' as never) as JwtPayload
  await writeAuditLog(c.env.DB, {
    userId: payload.sub,
    action: 'user.create',
    entityType: 'user',
    entityId: id,
    metadata: { email, role },
  })

  return c.json({ ok: true, data: { id, email, name, role } }, 201)
})
