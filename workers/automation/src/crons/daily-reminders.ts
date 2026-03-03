import type { Env } from '../index'

export async function runDailyReminders(env: Env): Promise<void> {
  // Find inspections scheduled for today
  const today = new Date().toISOString().slice(0, 10)

  const { results: todayInspections } = await env.DB.prepare(`
    SELECT i.id, i.inspection_type, i.scheduled_date,
           u.name as qp_name, u.phone as qp_phone,
           p.title as project_title, p.address as project_address
    FROM inspections i
    JOIN users u ON i.qp_id = u.id
    JOIN projects p ON i.project_id = p.id
    WHERE i.scheduled_date = ? AND i.status = 'scheduled'
  `)
    .bind(today)
    .all<{
      id: string; inspection_type: string; qp_name: string;
      qp_phone: string | null; project_title: string; project_address: string
    }>()

  for (const inspection of todayInspections) {
    const message = `Framework reminder: You have a ${inspection.inspection_type.replace(/_/g, ' ')} inspection today at ${inspection.project_address}. Open the app to begin: ${env.APP_URL}/portal`

    if (inspection.qp_phone) {
      await env.TASK_QUEUE.send({
        type: 'send_notification',
        payload: { type: 'sms', phone: inspection.qp_phone, message },
      })
    }
  }

  console.log(`Daily reminders sent for ${todayInspections.length} inspections`)
}
