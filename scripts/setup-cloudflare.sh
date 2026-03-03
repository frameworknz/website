#!/usr/bin/env bash
# One-time Cloudflare resource setup
# Creates D1 databases, R2 buckets, KV namespaces, and Queues
# Usage: ./scripts/setup-cloudflare.sh [staging|production]

set -euo pipefail

ENV=${1:-staging}
SUFFIX=""
if [[ "$ENV" == "staging" ]]; then SUFFIX="-staging"; fi

echo "⚙️  Setting up Cloudflare resources for: $ENV"
echo ""

echo "━━━ D1 Database ━━━"
npx wrangler d1 create "framework-db${SUFFIX}" || echo "  (may already exist)"

echo ""
echo "━━━ R2 Bucket ━━━"
npx wrangler r2 bucket create "framework-storage${SUFFIX}" || echo "  (may already exist)"

echo ""
echo "━━━ KV Namespace ━━━"
npx wrangler kv:namespace create "SESSIONS${SUFFIX}" || echo "  (may already exist)"

echo ""
echo "━━━ Queues ━━━"
npx wrangler queues create "framework-tasks${SUFFIX}" || echo "  (may already exist)"

echo ""
echo "━━━ Secrets ━━━"
echo "Now set the following secrets with: wrangler secret put <NAME>"
echo "  ZOHO_CLIENT_ID"
echo "  ZOHO_CLIENT_SECRET"
echo "  ZOHO_REFRESH_TOKEN"
echo "  JWT_SECRET"
echo "  SENDGRID_API_KEY"
echo "  R2_PUBLIC_URL"
echo "  TWILIO_ACCOUNT_SID"
echo "  TWILIO_AUTH_TOKEN"
echo "  TWILIO_PHONE_NUMBER"

echo ""
echo "⚠️  Update wrangler.toml with the IDs output above"
echo "✅ Cloudflare setup complete for $ENV"
