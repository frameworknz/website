# CLAUDE.md — Framework Project

**Version:** 1.0.0
**Classification:** Production
**Stack:** Cloudflare · Zoho · React/TypeScript · Hono · D1 · R2
**Domain:** Building Compliance — Qualified Person Inspection Platform

---

## 1. PROJECT OVERVIEW

### 1.1 System Identity

| Attribute | Value |
|-----------|-------|
| Project Name | Framework |
| Platform Type | Compliance SaaS + Marketing Engine |
| Primary User | Qualified Persons (QPs) — on-site building inspectors |
| Secondary Users | Building owners, developers, councils, project managers |
| Regulatory Alignment | NZ Building Act 2004, Building Code (NZBC), NZS 3604 |
| Infrastructure | Cloudflare (Workers, D1, R2, Pages, Queues) |
| CRM / Marketing | Zoho CRM, Zoho Campaigns, Zoho Social |
| Deployment Target | Cloudflare Pages (frontend) + Workers (backend) |

### 1.2 System Layers

```
┌─────────────────────────────────────────────────────┐
│  UI LAYER          React 18 + TypeScript + Tailwind  │
│                    Public Website + QP App Portal     │
├─────────────────────────────────────────────────────┤
│  INTELLIGENCE LAYER  Inspection Logic Engine          │
│                      Compliance Rule Evaluator        │
│                      Report Generator (PDF)           │
├─────────────────────────────────────────────────────┤
│  API LAYER           Cloudflare Workers (Hono)        │
│                      REST + Webhook endpoints         │
│                      Zoho CRM Integration             │
├─────────────────────────────────────────────────────┤
│  DATA LAYER          Cloudflare D1 (SQLite)           │
│                      Cloudflare R2 (docs/photos)      │
│                      KV (sessions, cache)             │
├─────────────────────────────────────────────────────┤
│  AUTOMATION LAYER    Cloudflare Queues + Cron         │
│                      Zoho Flow Triggers               │
│                      Social Media Scheduler           │
└─────────────────────────────────────────────────────┘
```

---

## 2. REPOSITORY STRUCTURE

```
framework/
├── CLAUDE.md                    ← This file
├── package.json
├── wrangler.toml                ← Cloudflare config
├── .dev.vars                    ← Local secrets (gitignored)
│
├── apps/
│   ├── web/                     ← Public marketing website
│   │   ├── src/
│   │   │   ├── pages/           ← Landing, About, Services, Pricing, Contact
│   │   │   ├── components/      ← Shared UI components
│   │   │   └── styles/
│   │   └── public/
│   │
│   └── portal/                  ← QP Compliance App (authenticated)
│       ├── src/
│       │   ├── pages/
│       │   │   ├── dashboard/
│       │   │   ├── inspections/
│       │   │   ├── reports/
│       │   │   ├── calendar/
│       │   │   └── settings/
│       │   ├── components/
│       │   │   ├── forms/       ← Inspection input forms
│       │   │   ├── checklist/   ← Compliance checklist engine
│       │   │   ├── camera/      ← Photo capture + R2 upload
│       │   │   └── signature/   ← Digital sign-off
│       │   └── lib/
│       │       ├── api.ts
│       │       ├── auth.ts
│       │       └── compliance/  ← Rule engine
│
├── workers/
│   ├── api/                     ← Main API Worker (Hono)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   │   ├── inspections.ts
│   │   │   │   ├── reports.ts
│   │   │   │   ├── users.ts
│   │   │   │   ├── zoho.ts
│   │   │   │   └── webhooks.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts
│   │   │   │   └── cors.ts
│   │   │   └── db/
│   │   │       ├── schema.sql
│   │   │       └── queries.ts
│   │
│   ├── pdf-generator/           ← Report PDF Worker
│   └── automation/              ← Cron + Queue consumer
│
├── database/
│   ├── schema.sql
│   ├── migrations/
│   └── seed.sql
│
├── docs/
│   ├── architecture.md
│   ├── api-spec.md
│   ├── compliance-rules.md
│   └── zoho-integration.md
│
└── scripts/
    ├── deploy.sh
    ├── db-migrate.sh
    └── zoho-sync.sh
```

---

## 3. ENVIRONMENT CONFIGURATION

### 3.1 wrangler.toml

```toml
name = "framework-api"
main = "workers/api/src/index.ts"
compatibility_date = "2025-01-01"
node_compat = true

[[d1_databases]]
binding = "DB"
database_name = "framework-db"
database_id = "YOUR_D1_ID"

[[r2_buckets]]
binding = "STORAGE"
bucket_name = "framework-storage"

[[kv_namespaces]]
binding = "SESSIONS"
id = "YOUR_KV_ID"

[[queues.producers]]
binding = "TASK_QUEUE"
queue = "framework-tasks"

[[queues.consumers]]
queue = "framework-tasks"
max_batch_size = 10
max_batch_timeout = 30

[vars]
ENVIRONMENT = "production"
APP_URL = "https://framework.co.nz"
ZOHO_REGION = "com.au"

[[pages_deployment]]
# framework-web → apps/web
# framework-portal → apps/portal
```

### 3.2 Secrets (set via `wrangler secret put`)

```
ZOHO_CLIENT_ID
ZOHO_CLIENT_SECRET
ZOHO_REFRESH_TOKEN
JWT_SECRET
SENDGRID_API_KEY       # or use Zoho Mail
R2_PUBLIC_URL
```

---

## 4. DATABASE SCHEMA

```sql
-- schema.sql

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK(role IN ('qp', 'admin', 'viewer')) DEFAULT 'qp',
  licence_number TEXT,
  licence_expiry DATE,
  zoho_contact_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  address TEXT NOT NULL,
  council_ref TEXT,
  owner_name TEXT,
  owner_email TEXT,
  owner_phone TEXT,
  project_type TEXT CHECK(project_type IN ('residential', 'commercial', 'industrial')),
  status TEXT CHECK(status IN ('active', 'on_hold', 'complete', 'cancelled')) DEFAULT 'active',
  zoho_deal_id TEXT,
  assigned_qp_id TEXT REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inspections (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  qp_id TEXT REFERENCES users(id),
  inspection_type TEXT NOT NULL,     -- foundation, framing, pre-line, final, etc.
  scheduled_date DATE,
  conducted_date DATE,
  status TEXT CHECK(status IN ('scheduled', 'in_progress', 'submitted', 'approved', 'failed')) DEFAULT 'scheduled',
  weather_conditions TEXT,
  site_conditions TEXT,
  overall_result TEXT CHECK(overall_result IN ('pass', 'conditional_pass', 'fail', 'incomplete')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE checklist_items (
  id TEXT PRIMARY KEY,
  inspection_id TEXT REFERENCES inspections(id),
  category TEXT NOT NULL,           -- NZBC clause reference
  item_code TEXT NOT NULL,
  description TEXT NOT NULL,
  result TEXT CHECK(result IN ('pass', 'fail', 'n/a', 'pending')),
  notes TEXT,
  requires_remediation BOOLEAN DEFAULT 0,
  remediation_deadline DATE,
  sort_order INTEGER
);

CREATE TABLE inspection_photos (
  id TEXT PRIMARY KEY,
  inspection_id TEXT REFERENCES inspections(id),
  checklist_item_id TEXT REFERENCES checklist_items(id),
  r2_key TEXT NOT NULL,
  caption TEXT,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  inspection_id TEXT REFERENCES inspections(id),
  report_type TEXT CHECK(report_type IN ('inspection', 'remediation', 'final_sign_off')),
  r2_key TEXT,                      -- PDF stored in R2
  signed_by TEXT REFERENCES users(id),
  signed_at DATETIME,
  sent_to TEXT,                     -- JSON array of email recipients
  zoho_attachment_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE compliance_rules (
  id TEXT PRIMARY KEY,
  clause TEXT NOT NULL,             -- e.g. "B1", "E2", "H1"
  version TEXT,
  title TEXT NOT NULL,
  description TEXT,
  inspection_types TEXT,            -- JSON array
  is_active BOOLEAN DEFAULT 1,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata TEXT,                    -- JSON
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. API SPECIFICATION

### Base URL

```
Production: https://api.framework.co.nz/v1
Staging:    https://api-staging.framework.co.nz/v1
```

### Authentication

- JWT Bearer tokens (7-day expiry)
- Refresh via `/auth/refresh`
- QP licence validation on login

### Core Endpoints

```
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout

GET    /users/me
PATCH  /users/me

GET    /projects
POST   /projects
GET    /projects/:id
PATCH  /projects/:id

GET    /inspections
POST   /inspections
GET    /inspections/:id
PATCH  /inspections/:id
POST   /inspections/:id/submit
POST   /inspections/:id/sign-off

GET    /inspections/:id/checklist
POST   /inspections/:id/checklist
PATCH  /checklist-items/:id

POST   /inspections/:id/photos         ← multipart upload → R2
GET    /inspections/:id/photos

POST   /reports/generate/:inspection_id
GET    /reports/:id
POST   /reports/:id/send

GET    /compliance-rules
GET    /compliance-rules/:clause

POST   /webhooks/zoho                  ← incoming Zoho triggers
```

---

## 6. COMPLIANCE APP — CORE MODULES

### 6.1 Inspection Workflow

```
State Machine:

SCHEDULED → IN_PROGRESS → SUBMITTED → APPROVED
                   ↘           ↘
                    FAILED      REQUIRES_REMEDIATION
                                    ↓
                               RE_INSPECTION
```

### 6.2 Inspection Types & NZBC Clauses

| Inspection Stage | Key Clauses |
|------------------|-------------|
| Site/Foundation | B1, B2, E1 |
| Subfloor Framing | B1, H1 |
| Pre-Wrap | B2, E2 |
| Framing | B1, C, F6 |
| Pre-Line (Insulation) | H1, F2 |
| Wet Area Pre-Line | E3, B2 |
| Pre-Plaster | E2 |
| Final Inspection | All clauses |

### 6.3 Offline Capability

- Service Worker caches inspection forms
- IndexedDB queues photo uploads when offline
- Auto-sync on reconnect via background sync API
- Conflict resolution: server timestamp wins

### 6.4 Photo Capture Module

```typescript
// workers/api/src/routes/photos.ts
// Client uploads to signed R2 URL — Worker never proxies binary data

POST /inspections/:id/photos/presign
→ Returns: { uploadUrl: string, key: string, expiresIn: 300 }

Client uploads directly to R2 presigned URL
Client confirms: POST /inspections/:id/photos { key, caption, checklistItemId }
```

### 6.5 PDF Report Generation

```typescript
// workers/pdf-generator/src/index.ts
// Uses @react-pdf/renderer compiled to WASM-compatible format

Report includes:
- Framework letterhead
- QP licence details + signature
- Project + site details
- Checklist results table (pass/fail/n/a per clause)
- Annotated photos (max 2 per page)
- Remediation requirements (if any)
- Digital sign-off block
- Audit trail footer
```

---

## 7. ZOHO INTEGRATION

### 7.1 Module Mapping

| Framework Entity | Zoho Module |
|-----------------|-------------|
| User (client) | Contact |
| Project | Deal |
| Inspection | Activity / Custom Module |
| Report sent | Attachment + Email log |
| Invoice trigger | Zoho Books (via Flow) |

### 7.2 Sync Logic

```typescript
// workers/api/src/routes/zoho.ts

// On new project creation:
1. Create/find Contact in Zoho CRM
2. Create Deal linked to Contact
3. Store zoho_deal_id on project record
4. Tag deal stage: "Inspection Scheduled"

// On inspection submitted:
1. Update Deal stage
2. Attach PDF report to Deal
3. Trigger Zoho Flow → send client notification email

// On final sign-off:
1. Update Deal stage: "Complete"
2. Trigger Zoho Books → create invoice
3. Mark deal Closed Won
```

### 7.3 Zoho OAuth Flow

```typescript
// Token refresh via Cloudflare KV (cache refresh tokens)
// Refresh 5 minutes before expiry using Cron Trigger

// wrangler.toml
[triggers]
crons = ["*/55 * * * *"]  // Every 55 min — refresh Zoho token
```

### 7.4 Zoho Campaigns — Automation Sequences

| Trigger | Sequence |
|---------|----------|
| New lead (web form) | Welcome → Services overview → Case study → Book call |
| Quote sent | Follow-up D+2 → D+5 → Final D+10 |
| Inspection complete | Satisfaction survey → Review request → Referral ask |
| Licence expiry (QP) | 60-day warning → 30-day → 7-day |
| Project dormant 30d | Re-engagement sequence |

---

## 8. PUBLIC WEBSITE — PAGES & CONTENT STRATEGY

### 8.1 Site Structure

```
/                    ← Hero + trust signals + CTA
/services            ← Inspection types, compliance consulting
/qualified-persons   ← For QPs: platform features, onboarding
/pricing             ← Tiered plans
/case-studies        ← Project examples (anonymised)
/resources           ← NZBC guides, checklists (gated PDF downloads)
/blog                ← SEO content
/contact             ← Zoho CRM form integration
/book                ← Calendly / Zoho Bookings embed
```

### 8.2 Design Direction

| Property | Value |
|----------|-------|
| Aesthetic | Authoritative + Modern Professional |
| Palette | Deep slate `#1E2A38`, warm white `#F8F5F0`, compliance green `#2D7D52`, amber accent `#E6A817` |
| Typography | Display: "Canela" or "Freight Display" · Body: "Söhne" or "GT Walsheim" |
| Tone | Precise. Trusted. Qualified. |

### 8.3 Trust Signal Elements

- NZ Licensed Building Practitioner (LBP) badges
- NZBC clause coverage matrix (visual)
- Inspection count statistics (live from D1)
- Council acceptance rate
- Client testimonials (Zoho CRM sourced)

---

## 9. SOCIAL MEDIA AUTOMATION

### 9.1 Platform Strategy

| Platform | Purpose | Cadence |
|----------|---------|---------|
| LinkedIn | B2B authority, QP recruitment | 4x/week |
| Facebook | Local community trust, homeowners | 3x/week |
| Instagram | Site photo highlights, process visuals | 3x/week |
| Google Business | Reviews + local SEO posts | 2x/week |

### 9.2 Zoho Social Integration

```
Content Types:
├── Educational       ← NZBC clause explainers
├── Case Study        ← Anonymised inspection wins
├── Compliance Alert  ← Code updates, industry news
├── Behind the Scenes ← QP on-site (with permission)
└── Social Proof      ← Client testimonials, stats

Automation Rules:
- New blog post → auto-schedule to all platforms
- Inspection milestone (e.g., 100th report) → auto-post
- Compliance rule update → alert post via Zoho Social
- Weekly stats digest → auto-generated from D1 query
```

### 9.3 Content Pipeline

```
Worker Cron (weekly) → Query D1 stats →
  Format social copy → Push to Zoho Social queue →
    Zoho Social schedules → Posts at optimal times
```

---

## 10. AUTOMATION ARCHITECTURE

### 10.1 Cloudflare Cron Triggers

```toml
[triggers]
crons = [
  "0 6 * * 1",        # Mon 6am: weekly stats report
  "0 8 * * *",        # Daily 8am: inspection reminders
  "*/55 * * * *",     # Every 55min: Zoho token refresh
  "0 0 1 * *",        # Monthly: licence expiry check
  "30 17 * * 5"       # Fri 5:30pm: social content queue fill
]
```

### 10.2 Queue Workers

```typescript
// Task types processed via Cloudflare Queues:
type TaskType =
  | 'generate_report'        // PDF generation
  | 'send_report'            // Email delivery
  | 'sync_zoho_contact'      // CRM sync
  | 'upload_photos'          // R2 batch upload
  | 'send_notification'      // Push/email
  | 'post_social'            // Social media post
  | 'trigger_invoice'        // Zoho Books
```

### 10.3 Notification Stack

```
In-App    → Cloudflare KV pub/sub (SSE endpoint)
Email     → Zoho Mail (transactional)
SMS       → Twilio (inspection day reminders)
Push      → Web Push API (service worker)
```

---

## 11. DEPLOYMENT PIPELINE

### 11.1 Environments

| Env | Branch | URL |
|-----|--------|-----|
| Development | `feature/*` | localhost |
| Staging | `develop` | staging.framework.co.nz |
| Production | `main` | framework.co.nz |

### 11.2 GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main, develop]

jobs:
  test:
    - Run TypeScript typecheck
    - Run Vitest unit tests
    - Run D1 migration dry-run

  deploy-workers:
    - wrangler deploy workers/api
    - wrangler deploy workers/pdf-generator
    - wrangler deploy workers/automation

  deploy-web:
    - Build apps/web → wrangler pages deploy
    - Build apps/portal → wrangler pages deploy

  post-deploy:
    - Run D1 migrations
    - Notify Zoho CRM webhook (deploy logged)
    - Purge Cloudflare cache
```

### 11.3 Deploy Command Reference

```bash
# Local dev
npm run dev:web         # Vite dev server — public site
npm run dev:portal      # Vite dev server — QP portal
npm run dev:worker      # wrangler dev

# Database
npm run db:migrate      # Apply pending migrations
npm run db:seed         # Seed compliance rules

# Deploy
npm run deploy:staging
npm run deploy:production

# Zoho sync
npm run zoho:sync-rules   # Sync compliance rules to Zoho custom module
```

---

## 12. SECURITY & COMPLIANCE

### 12.1 Auth Model

```
QP Users:
- JWT (HS256, 7-day expiry)
- Licence number validated on account creation
- MFA required for report sign-off actions

Admin Users:
- Separate admin JWT scope
- Cloudflare Access (Zero Trust) on admin routes
```

### 12.2 Data Governance

| Data Type | Policy |
|-----------|--------|
| Personal data | Encrypted at rest (D1 + R2) |
| Photo metadata | Stripped of device EXIF before R2 storage |
| Audit log | Immutable — append only, no DELETE permitted |
| Report PDFs | R2 private bucket — access via signed URLs only |
| Retention | 7 years (NZ Building Act requirement) |

### 12.3 NZ Regulatory Alignment

- Building Act 2004, s.7 (meaning of building work)
- Building Consent Authority (BCA) submission compatibility
- LBP licence validation against MBIE register
- NZBC clause version tracking (amendments logged)
- Privacy Act 2020 — data minimisation + access rights

---

## 13. PRICING MODEL

| Plan | Target | Key Features | Monthly |
|------|--------|-------------|---------|
| Solo | Independent QP | 10 inspections, PDF reports, mobile app | $79 |
| Practice | Small firm (2–5 QPs) | Unlimited inspections, Zoho CRM sync, team dashboard | $249 |
| Enterprise | Large firm / Council | White-label, custom rules, API access, SLA | POA |

**Billing:** Zoho Subscriptions → Zoho Books → Stripe (NZ GST compliant)

---

## 14. DEVELOPMENT CONVENTIONS

### 14.1 TypeScript Standards

```typescript
// Strict mode enabled
// tsconfig.json: "strict": true, "noUncheckedIndexedAccess": true

// All DB queries typed via generated types (D1 schema → TypeScript)
// All API responses use shared Result<T, E> type
type Result<T, E = ApiError> =
  | { ok: true; data: T }
  | { ok: false; error: E }
```

### 14.2 Error Handling

```typescript
// Workers: never throw — always return structured errors
// Client: toast notifications for user-facing errors
// Critical errors: logged to audit_log + Cloudflare Logpush
```

### 14.3 Naming Conventions

| Scope | Convention |
|-------|-----------|
| Files | `kebab-case` |
| Components | `PascalCase` |
| Functions | `camelCase` |
| DB columns | `snake_case` |
| ENV vars | `SCREAMING_SNAKE_CASE` |
| Routes | `/kebab-case/:param` |

---

## 15. ROADMAP

### Phase 1 — Foundation (Weeks 1–4)

- [ ] D1 schema + migrations
- [ ] Auth Worker (JWT)
- [ ] Core API routes (projects, inspections, checklist)
- [ ] Public website (static, Cloudflare Pages)
- [ ] Zoho CRM base integration

### Phase 2 — QP Portal (Weeks 5–8)

- [ ] React portal app (authenticated)
- [ ] Inspection form engine
- [ ] Photo capture + R2 upload
- [ ] PDF report generator
- [ ] Digital signature module

### Phase 3 — Automation (Weeks 9–11)

- [ ] Zoho Campaigns sequences
- [ ] Social media automation (Zoho Social)
- [ ] Cron triggers (reminders, reports, token refresh)
- [ ] Notification stack (email + push)

### Phase 4 — Scale (Weeks 12+)

- [ ] Offline mode (PWA)
- [ ] Council submission exports
- [ ] Zoho Books billing integration
- [ ] White-label config (Enterprise)
- [ ] Mobile app wrapper (Capacitor)

---

## 16. AGENT INSTRUCTIONS FOR CLAUDE

When working on this project, always follow these rules:

1. **Schema changes require migrations** — Never modify `schema.sql` without creating a corresponding migration file in `database/migrations/`
2. **Use `Result<T>` on all API routes** — No raw throws; always return structured `{ ok: true, data }` or `{ ok: false, error }`
3. **R2 uploads use presigned URLs** — Workers must never proxy binary data; always return a presigned URL for direct client upload
4. **Zoho sync is always async** — Enqueue via Cloudflare Queues; never block the request thread with CRM calls
5. **Compliance rules are versioned** — Never delete a rule; deprecate only with `is_active = 0`
6. **Signed reports are immutable** — No `PATCH` permitted on any report where `signed_at IS NOT NULL`
7. **All QP actions write to `audit_log`** — This is a legal requirement under the NZ Building Act
8. **No hardcoded secrets** — All credentials must come from env bindings or `wrangler secret`
9. **Parameterise all D1 queries** — No string interpolation in SQL; use `?` placeholders
10. **Queue social content; never post directly** — All automated social posts must go through Zoho Social queue

---

*Framework — Built for the qualified people who make buildings safe.*
*CLAUDE.md maintained as living architecture document — update on every structural change.*
