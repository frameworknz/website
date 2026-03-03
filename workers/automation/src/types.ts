export type TaskType =
  | 'generate_report'
  | 'send_report'
  | 'sync_zoho_contact'
  | 'upload_photos'
  | 'send_notification'
  | 'post_social'
  | 'trigger_invoice'

export interface Task {
  type: TaskType
  payload: Record<string, unknown>
}
