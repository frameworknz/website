import type { Env } from '../index'

export async function handleGenerateReport(
  payload: Record<string, unknown>,
  env: Env
): Promise<void> {
  const { reportId, inspectionId } = payload as { reportId: string; inspectionId: string }

  // Forward to PDF generator queue (or call the PDF worker service binding)
  await env.TASK_QUEUE.send({
    type: 'generate_report',
    payload: { reportId, inspectionId },
  })

  console.log(`Report generation queued: ${reportId}`)
}
