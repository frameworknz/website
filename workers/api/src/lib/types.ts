// Shared types for API Worker

export type Result<T, E = ApiError> =
  | { ok: true; data: T }
  | { ok: false; error: E }

export interface ApiError {
  code: string
  message: string
  status: number
}

export interface Env {
  DB: D1Database
  STORAGE: R2Bucket
  SESSIONS: KVNamespace
  TASK_QUEUE: Queue
  ENVIRONMENT: string
  APP_URL: string
  ZOHO_REGION: string
  ZOHO_CLIENT_ID: string
  ZOHO_CLIENT_SECRET: string
  ZOHO_REFRESH_TOKEN: string
  JWT_SECRET: string
  SENDGRID_API_KEY: string
  R2_PUBLIC_URL: string
  TWILIO_ACCOUNT_SID: string
  TWILIO_AUTH_TOKEN: string
  TWILIO_PHONE_NUMBER: string
}

export interface JwtPayload {
  sub: string
  email: string
  role: 'qp' | 'admin' | 'viewer'
  iat: number
  exp: number
}

export type UserRole = 'qp' | 'admin' | 'viewer'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  licence_number: string | null
  licence_expiry: string | null
  phone: string | null
  zoho_contact_id: string | null
  mfa_enabled: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  title: string
  address: string
  suburb: string | null
  city: string | null
  postcode: string | null
  council_ref: string | null
  owner_name: string | null
  owner_email: string | null
  owner_phone: string | null
  project_type: 'residential' | 'commercial' | 'industrial'
  status: 'active' | 'on_hold' | 'complete' | 'cancelled'
  zoho_deal_id: string | null
  assigned_qp_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type InspectionStatus = 'scheduled' | 'in_progress' | 'submitted' | 'approved' | 'failed' | 'requires_remediation'
export type InspectionResult = 'pass' | 'conditional_pass' | 'fail' | 'incomplete'

export interface Inspection {
  id: string
  project_id: string
  qp_id: string
  inspection_type: string
  scheduled_date: string | null
  conducted_date: string | null
  status: InspectionStatus
  weather_conditions: string | null
  site_conditions: string | null
  overall_result: InspectionResult | null
  notes: string | null
  zoho_activity_id: string | null
  created_at: string
  updated_at: string
}

export type ChecklistResult = 'pass' | 'fail' | 'n/a' | 'pending'

export interface ChecklistItem {
  id: string
  inspection_id: string
  category: string
  item_code: string
  description: string
  result: ChecklistResult
  notes: string | null
  requires_remediation: boolean
  remediation_deadline: string | null
  sort_order: number
}

export interface InspectionPhoto {
  id: string
  inspection_id: string
  checklist_item_id: string | null
  r2_key: string
  caption: string | null
  file_size: number | null
  content_type: string
  uploaded_at: string
}

export type ReportType = 'inspection' | 'remediation' | 'final_sign_off'

export interface Report {
  id: string
  inspection_id: string
  report_type: ReportType
  r2_key: string | null
  signed_by: string | null
  signed_at: string | null
  sent_to: string | null
  zoho_attachment_id: string | null
  created_at: string
}

export interface ComplianceRule {
  id: string
  clause: string
  version: string | null
  title: string
  description: string | null
  inspection_types: string | null
  is_active: boolean
  updated_at: string
}

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
