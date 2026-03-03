import type { Env } from '../index'

export async function handleSendReport(
  payload: Record<string, unknown>,
  env: Env
): Promise<void> {
  const { reportId, recipients } = payload as { reportId: string; recipients: string[] }

  const report = await env.DB.prepare(
    `SELECT r.r2_key, i.project_id, p.title as project_title, u.name as qp_name
     FROM reports r
     JOIN inspections i ON r.inspection_id = i.id
     JOIN projects p ON i.project_id = p.id
     JOIN users u ON i.qp_id = u.id
     WHERE r.id = ?`
  )
    .bind(reportId)
    .first<{ r2_key: string | null; project_title: string; qp_name: string }>()

  if (!report?.r2_key) {
    console.warn(`Report ${reportId} has no PDF yet`)
    return
  }

  const reportUrl = `${env.R2_PUBLIC_URL}/${report.r2_key}`

  const emailBody = {
    personalizations: recipients.map((to) => ({
      to: [{ email: to }],
      subject: `Framework Inspection Report — ${report.project_title}`,
    })),
    from: { email: 'reports@framework.co.nz', name: 'Framework Compliance' },
    content: [
      {
        type: 'text/html',
        value: `
          <p>Dear Client,</p>
          <p>Your building inspection report prepared by ${report.qp_name} is now available.</p>
          <p><a href="${reportUrl}" style="background:#2D7D52;color:white;padding:10px 20px;border-radius:4px;text-decoration:none">Download Report</a></p>
          <p style="font-size:12px;color:#6b7280">This report must be retained for a minimum of 7 years as per the NZ Building Act 2004.</p>
          <p>— Framework Compliance Team</p>
        `,
      },
    ],
  }

  const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailBody),
  })

  if (!resp.ok) {
    throw new Error(`SendGrid error: ${resp.status}`)
  }

  console.log(`Report ${reportId} sent to ${recipients.join(', ')}`)
}
