import type { Env } from '../index'

async function getZohoToken(env: Env): Promise<string | null> {
  const cached = await env.SESSIONS.get('zoho_access_token')
  if (cached) return cached

  const resp = await fetch(
    `https://accounts.zoho.${env.ZOHO_REGION}/oauth/v2/token?refresh_token=${env.ZOHO_REFRESH_TOKEN}&client_id=${env.ZOHO_CLIENT_ID}&client_secret=${env.ZOHO_CLIENT_SECRET}&grant_type=refresh_token`,
    { method: 'POST' }
  )
  const data = await resp.json() as { access_token?: string }
  if (!data.access_token) return null

  await env.SESSIONS.put('zoho_access_token', data.access_token, { expirationTtl: 3300 })
  return data.access_token
}

async function zohoApi(env: Env, method: string, path: string, body?: unknown): Promise<unknown> {
  const token = await getZohoToken(env)
  if (!token) throw new Error('No Zoho token')

  const resp = await fetch(`https://www.zohoapis.${env.ZOHO_REGION}/crm/v3/${path}`, {
    method,
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  return resp.json()
}

export async function handleSyncZoho(
  payload: Record<string, unknown>,
  env: Env
): Promise<void> {
  const { projectId, inspectionId, status } = payload

  if (projectId) {
    const project = await env.DB.prepare(
      `SELECT p.*, u.email as qp_email, u.name as qp_name
       FROM projects p LEFT JOIN users u ON p.assigned_qp_id = u.id
       WHERE p.id = ?`
    )
      .bind(projectId)
      .first<{
        id: string; title: string; owner_name: string | null; owner_email: string | null;
        zoho_deal_id: string | null; project_type: string; status: string
      }>()

    if (!project) return

    // Upsert contact in Zoho
    if (project.owner_email) {
      const contactResp = await zohoApi(env, 'POST', 'Contacts/upsert', {
        data: [{ Email: project.owner_email, Last_Name: project.owner_name ?? 'Unknown' }],
        duplicate_check_fields: ['Email'],
      }) as { data?: [{ details?: { id: string } }] }

      const contactId = contactResp?.data?.[0]?.details?.id
      if (!contactId) return

      // Create or update Deal
      const dealData = {
        Deal_Name: project.title,
        Account_Name: { id: contactId },
        Stage: project.status === 'complete' ? 'Closed Won' : 'Inspection Scheduled',
        Type: project.project_type,
      }

      if (project.zoho_deal_id) {
        await zohoApi(env, 'PUT', `Deals/${project.zoho_deal_id}`, { data: [dealData] })
      } else {
        const dealResp = await zohoApi(env, 'POST', 'Deals', { data: [dealData] }) as
          { data?: [{ details?: { id: string } }] }
        const dealId = dealResp?.data?.[0]?.details?.id
        if (dealId) {
          await env.DB.prepare('UPDATE projects SET zoho_deal_id = ? WHERE id = ?')
            .bind(dealId, projectId)
            .run()
        }
      }
    }
  }

  if (inspectionId && status) {
    const inspection = await env.DB.prepare(
      'SELECT project_id FROM inspections WHERE id = ?'
    )
      .bind(inspectionId)
      .first<{ project_id: string }>()

    if (!inspection) return

    const project = await env.DB.prepare('SELECT zoho_deal_id FROM projects WHERE id = ?')
      .bind(inspection.project_id)
      .first<{ zoho_deal_id: string | null }>()

    if (project?.zoho_deal_id) {
      const stage = status === 'approved' ? 'Inspection Complete' :
                    status === 'failed' ? 'Remediation Required' :
                    'Inspection In Progress'

      await zohoApi(env, 'PUT', `Deals/${project.zoho_deal_id}`, {
        data: [{ Stage: stage }],
      })
    }
  }

  console.log('Zoho sync completed', payload)
}
