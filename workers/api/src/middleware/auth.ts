import type { Context, Next } from 'hono'
import type { Env, JwtPayload } from '../lib/types'
import { apiErrorResponse, Errors } from '../lib/errors'

async function verifyJwt(token: string, secret: string): Promise<JwtPayload | null> {
  try {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [header, payload, signature] = parts as [string, string, string]
    const signingInput = `${header}.${payload}`

    const sigBytes = Uint8Array.from(atob(signature.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
      c.charCodeAt(0)
    )

    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(signingInput))
    if (!valid) return null

    const decoded = JSON.parse(atob(payload)) as JwtPayload
    if (decoded.exp * 1000 < Date.now()) return null

    return decoded
  } catch {
    return null
  }
}

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authorization = c.req.header('Authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return apiErrorResponse(Errors.unauthorized().error)
  }

  const token = authorization.slice(7)
  const payload = await verifyJwt(token, c.env.JWT_SECRET)

  if (!payload) {
    return apiErrorResponse(Errors.unauthorized().error)
  }

  c.set('jwtPayload' as never, payload)
  await next()
}

export async function adminOnly(c: Context<{ Bindings: Env }>, next: Next) {
  const payload = c.get('jwtPayload' as never) as JwtPayload
  if (payload?.role !== 'admin') {
    return apiErrorResponse(Errors.forbidden().error)
  }
  await next()
}

export async function signJwt(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  secret: string,
  expiresInSeconds = 604800 // 7 days
): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  const now = Math.floor(Date.now() / 1000)
  const claims = { ...payload, iat: now, exp: now + expiresInSeconds }
  const claimsB64 = btoa(JSON.stringify(claims))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  const signingInput = `${header}.${claimsB64}`
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const sigBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(signingInput))
  const signature = btoa(String.fromCharCode(...new Uint8Array(sigBytes)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return `${signingInput}.${signature}`
}
