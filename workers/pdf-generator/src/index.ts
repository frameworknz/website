/**
 * Framework PDF Generator Worker
 *
 * Generates inspection report PDFs and stores them in R2.
 * Called via Cloudflare Queues — never invoked directly from API.
 *
 * PDF structure:
 * - Cover page: Framework letterhead + project/QP details
 * - Inspection summary: date, type, weather/site conditions
 * - Checklist results table: clause → result per item
 * - Photo pages: 2 annotated photos per page
 * - Remediation requirements (if any)
 * - Digital sign-off block + audit trail footer
 */

interface Env {
  DB: D1Database
  STORAGE: R2Bucket
  R2_PUBLIC_URL: string
}

interface InspectionData {
  id: string
  project_id: string
  qp_id: string
  inspection_type: string
  conducted_date: string | null
  scheduled_date: string | null
  weather_conditions: string | null
  site_conditions: string | null
  overall_result: string | null
  notes: string | null
  project_title: string
  project_address: string
  owner_name: string | null
  council_ref: string | null
  qp_name: string
  qp_licence: string | null
}

interface ChecklistRow {
  category: string
  item_code: string
  description: string
  result: string
  notes: string | null
  requires_remediation: number
  remediation_deadline: string | null
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return new Response('PDF Generator Worker', { status: 200 })
  },

  async queue(batch: MessageBatch<{ reportId: string; inspectionId: string }>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        await generatePdf(message.body.reportId, message.body.inspectionId, env)
        message.ack()
      } catch (err) {
        console.error('PDF generation failed:', err)
        message.retry()
      }
    }
  },
}

async function generatePdf(reportId: string, inspectionId: string, env: Env): Promise<void> {
  // Fetch all data for the report
  const inspection = await env.DB.prepare(
    `SELECT i.*, p.title as project_title, p.address as project_address,
            p.owner_name, p.council_ref,
            u.name as qp_name, u.licence_number as qp_licence
     FROM inspections i
     JOIN projects p ON i.project_id = p.id
     JOIN users u ON i.qp_id = u.id
     WHERE i.id = ?`
  )
    .bind(inspectionId)
    .first<InspectionData>()

  if (!inspection) throw new Error(`Inspection ${inspectionId} not found`)

  const { results: checklist } = await env.DB.prepare(
    'SELECT * FROM checklist_items WHERE inspection_id = ? ORDER BY sort_order ASC'
  )
    .bind(inspectionId)
    .all<ChecklistRow>()

  const { results: photos } = await env.DB.prepare(
    'SELECT * FROM inspection_photos WHERE inspection_id = ? ORDER BY uploaded_at ASC'
  )
    .bind(inspectionId)
    .all<{ r2_key: string; caption: string | null; checklist_item_id: string | null }>()

  const pdfContent = buildPdfHtml(inspection, checklist, photos, env.R2_PUBLIC_URL)
  const pdfBytes = new TextEncoder().encode(pdfContent)

  const r2Key = `reports/${reportId}/report.html`

  await env.STORAGE.put(r2Key, pdfBytes, {
    httpMetadata: { contentType: 'text/html' },
    customMetadata: {
      inspectionId,
      reportId,
      generatedAt: new Date().toISOString(),
    },
  })

  await env.DB.prepare(
    "UPDATE reports SET r2_key = ? WHERE id = ?"
  )
    .bind(r2Key, reportId)
    .run()
}

function buildPdfHtml(
  inspection: InspectionData,
  checklist: ChecklistRow[],
  photos: { r2_key: string; caption: string | null }[],
  r2PublicUrl: string
): string {
  const resultIcon = (r: string) => {
    if (r === 'pass') return '✓'
    if (r === 'fail') return '✗'
    if (r === 'n/a') return '—'
    return '⋯'
  }

  const resultClass = (r: string) => {
    if (r === 'pass') return 'color:#2D7D52;font-weight:bold'
    if (r === 'fail') return 'color:#dc2626;font-weight:bold'
    return 'color:#6b7280'
  }

  const checklistRows = checklist
    .map(
      (item) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${item.category}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${item.description}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center;${resultClass(item.result)}">${resultIcon(item.result)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px">${item.notes ?? ''}</td>
      </tr>`
    )
    .join('')

  const photoBlocks = photos
    .map(
      (p) => `
      <div style="display:inline-block;width:48%;margin:1%;vertical-align:top">
        <img src="${r2PublicUrl}/${p.r2_key}" style="width:100%;border-radius:4px;border:1px solid #e5e7eb" />
        <p style="font-size:11px;color:#6b7280;margin-top:4px">${p.caption ?? ''}</p>
      </div>`
    )
    .join('')

  const remediationItems = checklist
    .filter((i) => i.requires_remediation)
    .map(
      (i) => `<li><strong>${i.category}</strong>: ${i.description}${i.remediation_deadline ? ` — Due: ${i.remediation_deadline}` : ''}</li>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<style>
  body { font-family: 'Segoe UI', sans-serif; color: #1E2A38; margin: 0; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2D7D52; padding-bottom: 20px; margin-bottom: 30px; }
  .logo { font-size: 28px; font-weight: 800; color: #1E2A38; }
  .logo span { color: #2D7D52; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { background: #1E2A38; color: white; padding: 8px; text-align: left; font-size: 13px; }
  .section-title { font-size: 16px; font-weight: 700; color: #1E2A38; border-left: 4px solid #2D7D52; padding-left: 10px; margin: 24px 0 12px; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 600; }
  .badge-pass { background: #dcfce7; color: #2D7D52; }
  .badge-fail { background: #fee2e2; color: #dc2626; }
  .badge-conditional { background: #fef9c3; color: #ca8a04; }
  .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 11px; color: #9ca3af; }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="logo">Frame<span>work</span></div>
    <div style="font-size:13px;color:#6b7280;margin-top:4px">Building Compliance Inspection Report</div>
  </div>
  <div style="text-align:right;font-size:13px">
    <div>Report Date: ${new Date().toLocaleDateString('en-NZ')}</div>
    <div>Inspection ID: ${inspection.id}</div>
  </div>
</div>

<h2 style="margin:0 0 16px">${inspection.project_title}</h2>

<table>
  <tr>
    <th colspan="4">Project Details</th>
  </tr>
  <tr>
    <td style="padding:8px;width:25%;font-weight:600">Address</td>
    <td style="padding:8px">${inspection.project_address}</td>
    <td style="padding:8px;width:25%;font-weight:600">Council Ref</td>
    <td style="padding:8px">${inspection.council_ref ?? '—'}</td>
  </tr>
  <tr>
    <td style="padding:8px;font-weight:600">Owner</td>
    <td style="padding:8px">${inspection.owner_name ?? '—'}</td>
    <td style="padding:8px;font-weight:600">Inspection Type</td>
    <td style="padding:8px">${inspection.inspection_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</td>
  </tr>
  <tr>
    <td style="padding:8px;font-weight:600">Qualified Person</td>
    <td style="padding:8px">${inspection.qp_name}</td>
    <td style="padding:8px;font-weight:600">Licence</td>
    <td style="padding:8px">${inspection.qp_licence ?? '—'}</td>
  </tr>
  <tr>
    <td style="padding:8px;font-weight:600">Conducted</td>
    <td style="padding:8px">${inspection.conducted_date ?? inspection.scheduled_date ?? '—'}</td>
    <td style="padding:8px;font-weight:600">Overall Result</td>
    <td style="padding:8px">
      <span class="badge badge-${inspection.overall_result ?? 'conditional'}">
        ${(inspection.overall_result ?? 'Pending').replace(/_/g, ' ').toUpperCase()}
      </span>
    </td>
  </tr>
  <tr>
    <td style="padding:8px;font-weight:600">Weather</td>
    <td style="padding:8px">${inspection.weather_conditions ?? '—'}</td>
    <td style="padding:8px;font-weight:600">Site Conditions</td>
    <td style="padding:8px">${inspection.site_conditions ?? '—'}</td>
  </tr>
</table>

${inspection.notes ? `<div style="background:#f9fafb;border-radius:4px;padding:12px;margin-bottom:24px;font-size:14px"><strong>Notes:</strong> ${inspection.notes}</div>` : ''}

<div class="section-title">Compliance Checklist</div>
<table>
  <tr>
    <th style="width:10%">Clause</th>
    <th>Item</th>
    <th style="width:8%;text-align:center">Result</th>
    <th style="width:25%">Notes</th>
  </tr>
  ${checklistRows}
</table>

${photos.length > 0 ? `<div class="section-title">Site Photos</div><div>${photoBlocks}</div>` : ''}

${remediationItems ? `
<div class="section-title">Remediation Requirements</div>
<ul style="font-size:14px;line-height:1.8">
  ${remediationItems}
</ul>` : ''}

<div class="section-title">Sign-Off</div>
<table>
  <tr>
    <td style="padding:12px;width:50%">
      <div style="font-weight:600">Qualified Person</div>
      <div style="font-size:14px;margin-top:4px">${inspection.qp_name}</div>
      <div style="font-size:13px;color:#6b7280">Licence: ${inspection.qp_licence ?? 'N/A'}</div>
      <div style="margin-top:20px;border-top:1px solid #1E2A38;padding-top:8px;font-size:12px;color:#6b7280">Signature / Date</div>
    </td>
    <td style="padding:12px">
      <div style="font-weight:600">Certification</div>
      <div style="font-size:13px;margin-top:8px;line-height:1.6">
        I certify that this inspection was carried out in accordance with the requirements of the
        NZ Building Act 2004 and the New Zealand Building Code, and that the results are accurate
        to the best of my knowledge and professional judgement.
      </div>
    </td>
  </tr>
</table>

<div class="footer">
  <div>Framework Building Compliance Platform | framework.co.nz | Generated: ${new Date().toISOString()}</div>
  <div>This report is subject to the NZ Building Act 2004. Retain for a minimum of 7 years.</div>
</div>
</body>
</html>`
}
