import { Hono } from 'hono'
import type { Env } from '../lib/types'
import { Errors } from '../lib/errors'
import { authMiddleware } from '../middleware/auth'

export const complianceRouter = new Hono<{ Bindings: Env }>()

complianceRouter.use('*', authMiddleware)

complianceRouter.get('/', async (c) => {
  const clause = c.req.query('clause')
  const inspectionType = c.req.query('inspection_type')

  let query = 'SELECT * FROM compliance_rules WHERE is_active = 1'
  const bindings: unknown[] = []

  if (clause) {
    query += ' AND clause = ?'
    bindings.push(clause.toUpperCase())
  }
  if (inspectionType) {
    query += ' AND inspection_types LIKE ?'
    bindings.push(`%"${inspectionType}"%`)
  }

  query += ' ORDER BY clause ASC, sort_order ASC'

  const { results } = await c.env.DB.prepare(query).bind(...bindings).all()
  return c.json({ ok: true, data: results })
})

complianceRouter.get('/:clause', async (c) => {
  const { clause } = c.req.param()
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM compliance_rules WHERE clause = ? AND is_active = 1 ORDER BY version DESC'
  )
    .bind(clause.toUpperCase())
    .all()

  if (!results.length) return c.json(Errors.notFound('Compliance clause'), 404)
  return c.json({ ok: true, data: results })
})
