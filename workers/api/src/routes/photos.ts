import { Hono } from 'hono'
import { z } from 'zod'
import type { Env, JwtPayload } from '../lib/types'
import { Errors } from '../lib/errors'
import { authMiddleware } from '../middleware/auth'
import { generateId } from '../lib/id'
import { writeAuditLog } from '../lib/audit'

export const photosRouter = new Hono<{ Bindings: Env }>()

photosRouter.use('*', authMiddleware)

// Get presigned upload URL for R2 — client uploads directly, Worker never proxies binary
photosRouter.post('/inspections/:id/presign', async (c) => {
  const payload = c.get('jwtPayload' as never) as JwtPayload
  const { id } = c.req.param()

  const inspection = await c.env.DB.prepare('SELECT qp_id, status FROM inspections WHERE id = ?')
    .bind(id)
    .first<{ qp_id: string; status: string }>()

  if (!inspection) return c.json(Errors.notFound('Inspection'), 404)
  if (payload.role === 'qp' && inspection.qp_id !== payload.sub) return c.json(Errors.forbidden(), 403)

  const body = await c.req.json().catch(() => null)
  const contentType = (body?.content_type as string | undefined) ?? 'image/jpeg'
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
  if (!allowedTypes.includes(contentType)) {
    return c.json(Errors.badRequest('Unsupported content type'), 400)
  }

  const key = `inspections/${id}/photos/${generateId('ph')}.jpg`

  // Generate presigned URL via R2 createPresignedUrl
  const url = await c.env.STORAGE.createMultipartUpload(key)

  // For standard presigned URL we use a signed URL approach
  // Note: R2 presigned URLs require custom signing — returning the key for now,
  // and actual signing would use the AWS Sig V4 approach with Cloudflare R2 credentials
  return c.json({
    ok: true,
    data: {
      key,
      expiresIn: 300,
      // In production: replace with actual R2 presigned URL from AWS SDK
      uploadUrl: `${c.env.R2_PUBLIC_URL}/upload?key=${key}`,
    },
  })
})

// Confirm photo upload after direct R2 upload
const confirmPhotoSchema = z.object({
  key: z.string(),
  caption: z.string().optional(),
  checklist_item_id: z.string().optional(),
  file_size: z.number().optional(),
  content_type: z.string().optional(),
})

photosRouter.post('/inspections/:id', async (c) => {
  const payload = c.get('jwtPayload' as never) as JwtPayload
  const { id } = c.req.param()

  const inspection = await c.env.DB.prepare('SELECT qp_id FROM inspections WHERE id = ?')
    .bind(id)
    .first<{ qp_id: string }>()

  if (!inspection) return c.json(Errors.notFound('Inspection'), 404)
  if (payload.role === 'qp' && inspection.qp_id !== payload.sub) return c.json(Errors.forbidden(), 403)

  const body = await c.req.json().catch(() => null)
  const parsed = confirmPhotoSchema.safeParse(body)
  if (!parsed.success) return c.json(Errors.badRequest(parsed.error.message), 400)

  const { key, caption, checklist_item_id, file_size, content_type } = parsed.data
  const photoId = generateId('photo')

  await c.env.DB.prepare(
    'INSERT INTO inspection_photos (id, inspection_id, checklist_item_id, r2_key, caption, file_size, content_type) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(photoId, id, checklist_item_id ?? null, key, caption ?? null, file_size ?? null, content_type ?? 'image/jpeg')
    .run()

  await writeAuditLog(c.env.DB, {
    userId: payload.sub,
    action: 'photo.upload',
    entityType: 'inspection',
    entityId: id,
    metadata: { key, checklist_item_id },
  })

  const photo = await c.env.DB.prepare('SELECT * FROM inspection_photos WHERE id = ?').bind(photoId).first()
  return c.json({ ok: true, data: photo }, 201)
})

// Get photos for an inspection
photosRouter.get('/inspections/:id', async (c) => {
  const payload = c.get('jwtPayload' as never) as JwtPayload
  const { id } = c.req.param()

  const inspection = await c.env.DB.prepare('SELECT qp_id FROM inspections WHERE id = ?')
    .bind(id)
    .first<{ qp_id: string }>()

  if (!inspection) return c.json(Errors.notFound('Inspection'), 404)
  if (payload.role === 'qp' && inspection.qp_id !== payload.sub) return c.json(Errors.forbidden(), 403)

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM inspection_photos WHERE inspection_id = ? ORDER BY uploaded_at DESC'
  )
    .bind(id)
    .all()

  return c.json({ ok: true, data: results })
})
