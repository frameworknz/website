import type { Env } from '../index'

export async function handleTriggerInvoice(
  payload: Record<string, unknown>,
  env: Env
): Promise<void> {
  const { projectId } = payload as { projectId: string }

  const project = await env.DB.prepare(
    'SELECT * FROM projects WHERE id = ?'
  )
    .bind(projectId)
    .first<{ id: string; title: string; zoho_deal_id: string | null }>()

  if (!project?.zoho_deal_id) {
    console.warn(`Project ${projectId} has no Zoho deal — skipping invoice`)
    return
  }

  // Update deal stage to trigger Zoho Flow → Zoho Books invoice
  const token = await env.SESSIONS.get('zoho_access_token')
  if (!token) {
    console.warn('No Zoho token for invoice trigger')
    return
  }

  await fetch(`https://www.zohoapis.${env.ZOHO_REGION}/crm/v3/Deals/${project.zoho_deal_id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: [{ Stage: 'Closed Won' }] }),
  })

  console.log(`Invoice triggered for project ${projectId} via Zoho deal ${project.zoho_deal_id}`)
}
