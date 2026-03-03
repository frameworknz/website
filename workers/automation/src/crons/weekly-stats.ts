import type { Env } from '../index'

export async function runWeeklyStats(env: Env): Promise<void> {
  const stats = await env.DB.prepare(`
    SELECT
      COUNT(DISTINCT p.id) as total_projects,
      COUNT(DISTINCT i.id) as total_inspections,
      COUNT(DISTINCT CASE WHEN i.status = 'approved' THEN i.id END) as approved_inspections,
      COUNT(DISTINCT CASE WHEN i.overall_result = 'pass' THEN i.id END) as passed_inspections,
      COUNT(DISTINCT CASE WHEN i.overall_result = 'fail' THEN i.id END) as failed_inspections,
      COUNT(DISTINCT r.id) as total_reports
    FROM projects p
    LEFT JOIN inspections i ON i.project_id = p.id
    LEFT JOIN reports r ON r.inspection_id = i.id
    WHERE p.created_at >= datetime('now', '-7 days')
  `).first()

  const content = `📊 Framework Weekly Stats (${new Date().toLocaleDateString('en-NZ')})

New this week:
• Projects: ${(stats as Record<string, number>)?.total_projects ?? 0}
• Inspections completed: ${(stats as Record<string, number>)?.approved_inspections ?? 0}
• Pass rate: ${calculatePassRate((stats as Record<string, number>))}%
• Reports issued: ${(stats as Record<string, number>)?.total_reports ?? 0}

#BuildingCompliance #QualifiedPerson #NZBC`

  // Queue social post
  await env.TASK_QUEUE.send({
    type: 'post_social',
    payload: {
      content,
      platforms: ['linkedin'],
      scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    },
  })

  console.log('Weekly stats processed:', stats)
}

function calculatePassRate(stats: Record<string, number> | null): string {
  if (!stats) return '0'
  const total = (stats.passed_inspections ?? 0) + (stats.failed_inspections ?? 0)
  if (total === 0) return '0'
  return ((stats.passed_inspections / total) * 100).toFixed(0)
}
