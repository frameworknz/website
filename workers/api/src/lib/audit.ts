import type { D1Database } from '@cloudflare/workers-types'
import { generateId } from './id'

export async function writeAuditLog(
  db: D1Database,
  params: {
    userId: string | null
    action: string
    entityType?: string
    entityId?: string
    metadata?: Record<string, unknown>
    ipAddress?: string
    userAgent?: string
  }
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, metadata, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      generateId('log'),
      params.userId,
      params.action,
      params.entityType ?? null,
      params.entityId ?? null,
      params.metadata ? JSON.stringify(params.metadata) : null,
      params.ipAddress ?? null,
      params.userAgent ?? null
    )
    .run()
}
