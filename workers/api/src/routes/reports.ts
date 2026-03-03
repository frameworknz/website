import { Hono } from 'hono'
import { z } from 'zod'
import type { Env, JwtPayload } from '../lib/types'
import { Errors } from '../lib/errors'
import { authMiddleware } from '../middleware/auth'
import { writeAuditLog } from '../lib/audit'
import { generateId } from '../lib/id'

export const reportsRouter = new Hono<{ Bindings: Env }>()

reportsRouter.use('*', authMiddleware)

// Generate report for an inspection (enqueues PDF generation)
reportsRouter.post('/generate/:inspection_id', async (c) => {
  const payload = c.get('jwtPayload' as never) as JwtPayload
  const { inspection_id } = c.req.param()

  const inspection = await c.env.DB.prepare('SELECT * FROM inspections WHERE id = ?')
    .bind(inspection_id)
    .first<{ qp_id: string; status: string }>()

  if (!inspection) return c.json(Errors.notFound('Inspection'), 404)
  if (payload.role === 'qp' && inspection.qp_id !== payload.sub) return c.json(Errors.forbidden(), 403)

  const reportId = generateId('rep')
  const reportType = 'inspection'

  await c.env.DB.prepare(
    'INSERT INTO reports (id, inspection_id, report_type) VALUES (?, ?, ?)'
  )
    .bind(reportId, inspection_id, reportType)
    .run()

  // Enqueue PDF generation — never block on this
  await c.env.TASK_QUEUE.send({
    type: 'generate_report',
    payload: { reportId, inspectionId: inspection_id },
  })

  await writeAuditLog(c.env.DB, {
    userId: payload.sub,
    action: 'report.generate',
    entityType: 'report',
    entityId: reportId,
    metadata: { inspection_id },
  })

  return c.json({ ok: true, data: { id: reportId, status: 'generating' } }, 202)
})

reportsRouter.get('/:id', async (c) => {
  const payload = c.get('jwtPayload' as never) as JwtPayload
  const { id } = c.req.param()

  const report = await c.env.DB.prepare(
    `SELECT r.*, i.qp_id, i.project_id FROM reports r
     JOIN inspections i ON r.inspection_id = i.id
     WHERE r.id = ?`
  )
    .bind(id)
    .first<{ qp_id: string; r2_key: string | null }>()

  if (!report) return c.json(Errors.notFound('Report'), 404)
  if (payload.role === 'qp' && report.qp_id !== payload.sub) return c.json(Errors.forbidden(), 403)

  let signedUrl: string | null = null
  if (report.r2_key) {
    // Generate signed R2 URL valid for 1 hour
    const obj = await c.env.STORAGE.get(report.r2_key)
    if (obj) {
      signedUrl = `${c.env.R2_PUBLIC_URL}/${report.r2_key}`
    }
  }

  return c.json({ ok: true, data: { ...report, download_url: signedUrl } })
})

const sendReportSchema = z.object({
  recipients: z.array(z.string().email()).min(1),
})

reportsRouter.post('/:id/send', async (c) => {
  const payload = c.get('jwtPayload' as never) as JwtPayload
  const { id } = c.req.param()

  const report = await c.env.DB.prepare(
    `SELECT r.*, i.qp_id FROM reports r
     JOIN inspections i ON r.inspection_id = i.id
     WHERE r.id = ?`
  )
    .bind(id)
    .first<{ qp_id: string; signed_at: string | null; r2_key: string | null }>()

  if (!report) return c.json(Errors.notFound('Report'), 404)
  if (payload.role === 'qp' && report.qp_id !== payload.sub) return c.json(Errors.forbidden(), 403)
  if (!report.r2_key) return c.json(Errors.badRequest('Report PDF not yet generated'), 400)

  const body = await c.req.json().catch(() => null)
  const parsed = sendReportSchema.safeParse(body)
  if (!parsed.success) return c.json(Errors.badRequest(parsed.error.message), 400)

  const { recipients } = parsed.data

  await c.env.DB.prepare(
    'UPDATE reports SET sent_to = ?, signed_by = ?, signed_at = CURRENT_TIMESTAMP WHERE id = ? AND signed_at IS NULL'
  )
    .bind(JSON.stringify(recipients), payload.sub, id)
    .run()

  // Enqueue email delivery
  await c.env.TASK_QUEUE.send({
    type: 'send_report',
    payload: { reportId: id, recipients },
  })

  await writeAuditLog(c.env.DB, {
    userId: payload.sub,
    action: 'report.send',
    entityType: 'report',
    entityId: id,
    metadata: { recipients },
  })

  return c.json({ ok: true, data: { id, sent_to: recipients } })
})
