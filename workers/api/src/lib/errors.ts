import type { ApiError, Result } from './types'

export function ok<T>(data: T): Result<T> {
  return { ok: true, data }
}

export function err(code: string, message: string, status: number): Result<never> {
  return { ok: false, error: { code, message, status } }
}

export const Errors = {
  unauthorized: () => err('UNAUTHORIZED', 'Authentication required', 401),
  forbidden: () => err('FORBIDDEN', 'Insufficient permissions', 403),
  notFound: (entity = 'Resource') => err('NOT_FOUND', `${entity} not found`, 404),
  badRequest: (msg: string) => err('BAD_REQUEST', msg, 400),
  conflict: (msg: string) => err('CONFLICT', msg, 409),
  internal: (msg = 'Internal server error') => err('INTERNAL_ERROR', msg, 500),
  unprocessable: (msg: string) => err('UNPROCESSABLE', msg, 422),
} as const

export function apiErrorResponse(error: ApiError): Response {
  return new Response(JSON.stringify({ ok: false, error }), {
    status: error.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
