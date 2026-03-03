import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import type { Env } from './lib/types'
import { authRouter } from './routes/auth'
import { usersRouter } from './routes/users'
import { projectsRouter } from './routes/projects'
import { inspectionsRouter } from './routes/inspections'
import { checklistRouter } from './routes/checklist'
import { photosRouter } from './routes/photos'
import { reportsRouter } from './routes/reports'
import { complianceRouter } from './routes/compliance'
import { webhooksRouter } from './routes/webhooks'
import { zohoRouter } from './routes/zoho'

const app = new Hono<{ Bindings: Env }>()

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: (origin) => {
      const allowed = [
        'https://framework.co.nz',
        'https://portal.framework.co.nz',
        'https://staging.framework.co.nz',
        'http://localhost:3000',
        'http://localhost:3001',
      ]
      return allowed.includes(origin) ? origin : null
    },
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)

// Health check
app.get('/health', (c) => c.json({ ok: true, service: 'framework-api', ts: Date.now() }))

// API v1 routes
app.route('/v1/auth', authRouter)
app.route('/v1/users', usersRouter)
app.route('/v1/projects', projectsRouter)
app.route('/v1/inspections', inspectionsRouter)
app.route('/v1/checklist-items', checklistRouter)
app.route('/v1/photos', photosRouter)
app.route('/v1/reports', reportsRouter)
app.route('/v1/compliance-rules', complianceRouter)
app.route('/v1/webhooks', webhooksRouter)
app.route('/v1/zoho', zohoRouter)

// 404
app.notFound((c) => c.json({ ok: false, error: { code: 'NOT_FOUND', message: 'Route not found', status: 404 } }, 404))

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json(
    { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error', status: 500 } },
    500
  )
})

export default app
