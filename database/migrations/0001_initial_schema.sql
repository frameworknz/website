-- Migration: 0001_initial_schema
-- Description: Initial database schema for Framework platform
-- Date: 2025-01-01

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('qp', 'admin', 'viewer')) DEFAULT 'qp',
  licence_number TEXT,
  licence_expiry DATE,
  phone TEXT,
  zoho_contact_id TEXT,
  mfa_secret TEXT,
  mfa_enabled BOOLEAN DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  address TEXT NOT NULL,
  suburb TEXT,
  city TEXT,
  postcode TEXT,
  council_ref TEXT,
  owner_name TEXT,
  owner_email TEXT,
  owner_phone TEXT,
  project_type TEXT CHECK(project_type IN ('residential', 'commercial', 'industrial')),
  status TEXT CHECK(status IN ('active', 'on_hold', 'complete', 'cancelled')) DEFAULT 'active',
  zoho_deal_id TEXT,
  assigned_qp_id TEXT REFERENCES users(id),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inspections (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  qp_id TEXT REFERENCES users(id),
  inspection_type TEXT NOT NULL,
  scheduled_date DATE,
  conducted_date DATE,
  status TEXT CHECK(status IN ('scheduled', 'in_progress', 'submitted', 'approved', 'failed', 'requires_remediation')) DEFAULT 'scheduled',
  weather_conditions TEXT,
  site_conditions TEXT,
  overall_result TEXT CHECK(overall_result IN ('pass', 'conditional_pass', 'fail', 'incomplete')),
  notes TEXT,
  zoho_activity_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS checklist_items (
  id TEXT PRIMARY KEY,
  inspection_id TEXT REFERENCES inspections(id),
  category TEXT NOT NULL,
  item_code TEXT NOT NULL,
  description TEXT NOT NULL,
  result TEXT CHECK(result IN ('pass', 'fail', 'n/a', 'pending')) DEFAULT 'pending',
  notes TEXT,
  requires_remediation BOOLEAN DEFAULT 0,
  remediation_deadline DATE,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS inspection_photos (
  id TEXT PRIMARY KEY,
  inspection_id TEXT REFERENCES inspections(id),
  checklist_item_id TEXT REFERENCES checklist_items(id),
  r2_key TEXT NOT NULL,
  caption TEXT,
  file_size INTEGER,
  content_type TEXT DEFAULT 'image/jpeg',
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  inspection_id TEXT REFERENCES inspections(id),
  report_type TEXT CHECK(report_type IN ('inspection', 'remediation', 'final_sign_off')),
  r2_key TEXT,
  signed_by TEXT REFERENCES users(id),
  signed_at DATETIME,
  sent_to TEXT,
  zoho_attachment_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS compliance_rules (
  id TEXT PRIMARY KEY,
  clause TEXT NOT NULL,
  version TEXT,
  title TEXT NOT NULL,
  description TEXT,
  inspection_types TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  refresh_token_hash TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_qp ON projects(assigned_qp_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_inspections_project ON inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_inspections_qp ON inspections(qp_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_checklist_inspection ON checklist_items(inspection_id);
CREATE INDEX IF NOT EXISTS idx_photos_inspection ON inspection_photos(inspection_id);
CREATE INDEX IF NOT EXISTS idx_reports_inspection ON reports(inspection_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
