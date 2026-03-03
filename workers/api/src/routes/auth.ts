import { Hono } from 'hono'
import { z } from 'zod'
import type { Env } from '../lib/types'
import { Errors } from '../lib/errors'
import { generateId } from '../lib/id'
import { writeAuditLog } from '../lib/audit'
import { signJwt } from '../middleware/auth'

export const authRouter = new Hono<{ Bindings: Env }>()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
}

authRouter.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(Errors.badRequest('Invalid email or password format'), 400)
  }

  const { email, password } = parsed.data
  const passwordHash = await hashPassword(password)

  const user = await c.env.DB.prepare(
    'SELECT id, email, name, role, licence_number, licence_expiry, is_active, password_hash FROM users WHERE email = ?'
  )
    .bind(email)
    .first<{
      id: string
      email: string
      name: string
      role: string
      licence_number: string | null
      licence_expiry: string | null
      is_active: number
      password_hash: string
    }>()

  if (!user || user.password_hash !== passwordHash || !user.is_active) {
    return c.json(Errors.unauthorized(), 401)
  }

  const token = await signJwt(
    { sub: user.id, email: user.email, role: user.role as 'qp' | 'admin' | 'viewer' },
    c.env.JWT_SECRET
  )

  const refreshToken = generateId('rt')
  const refreshHash = await hashPassword(refreshToken)
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  await c.env.DB.prepare(
    'INSERT INTO sessions (id, user_id, refresh_token_hash, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(
      generateId('sess'),
      user.id,
      refreshHash,
      expiresAt,
      c.req.header('CF-Connecting-IP') ?? null,
      c.req.header('User-Agent') ?? null
    )
    .run()

  await writeAuditLog(c.env.DB, {
    userId: user.id,
    action: 'auth.login',
    ipAddress: c.req.header('CF-Connecting-IP'),
    userAgent: c.req.header('User-Agent'),
  })

  return c.json({
    ok: true,
    data: {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        licence_number: user.licence_number,
        licence_expiry: user.licence_expiry,
      },
    },
  })
})

authRouter.post('/refresh', async (c) => {
  const body = await c.req.json().catch(() => null)
  const refreshToken = body?.refreshToken as string | undefined
  if (!refreshToken) return c.json(Errors.badRequest('refreshToken required'), 400)

  const passwordHash = async (t: string) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(t)
    const hash = await crypto.subtle.digest('SHA-256', data)
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
  }

  const tokenHash = await passwordHash(refreshToken)
  const now = new Date().toISOString()

  const session = await c.env.DB.prepare(
    'SELECT s.id, s.user_id, u.email, u.role, u.is_active FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.refresh_token_hash = ? AND s.expires_at > ?'
  )
    .bind(tokenHash, now)
    .first<{ id: string; user_id: string; email: string; role: string; is_active: number }>()

  if (!session || !session.is_active) return c.json(Errors.unauthorized(), 401)

  const newToken = await signJwt(
    { sub: session.user_id, email: session.email, role: session.role as 'qp' | 'admin' | 'viewer' },
    c.env.JWT_SECRET
  )

  return c.json({ ok: true, data: { token: newToken } })
})

authRouter.post('/logout', async (c) => {
  const body = await c.req.json().catch(() => null)
  const refreshToken = body?.refreshToken as string | undefined
  if (refreshToken) {
    const encoder = new TextEncoder()
    const data = encoder.encode(refreshToken)
    const hash = await crypto.subtle.digest('SHA-256', data)
    const tokenHash = btoa(String.fromCharCode(...new Uint8Array(hash)))
    await c.env.DB.prepare('DELETE FROM sessions WHERE refresh_token_hash = ?').bind(tokenHash).run()
  }
  return c.json({ ok: true, data: { message: 'Logged out' } })
})
