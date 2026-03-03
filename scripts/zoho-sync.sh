#!/usr/bin/env bash
# Sync compliance rules to Zoho CRM custom module
# Usage: ./scripts/zoho-sync.sh

set -euo pipefail

API_URL=${API_URL:-"https://api.framework.co.nz/v1"}
ADMIN_TOKEN=${ADMIN_TOKEN:-""}

if [[ -z "$ADMIN_TOKEN" ]]; then
  echo "❌ ADMIN_TOKEN environment variable required"
  exit 1
fi

echo "🔄 Syncing compliance rules to Zoho CRM..."

curl -s -X POST "$API_URL/zoho/sync/rules" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"

echo ""
echo "✅ Zoho sync triggered"
