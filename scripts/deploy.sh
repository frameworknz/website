#!/usr/bin/env bash
# Framework deployment script
# Usage: ./scripts/deploy.sh [staging|production]

set -euo pipefail

ENV=${1:-staging}
echo "🚀 Deploying Framework to: $ENV"

if [[ "$ENV" != "staging" && "$ENV" != "production" ]]; then
  echo "❌ Invalid environment: $ENV (must be 'staging' or 'production')"
  exit 1
fi

WRANGLER_ENV=""
VITE_API_URL="https://api.framework.co.nz/v1"
if [[ "$ENV" == "staging" ]]; then
  WRANGLER_ENV="--env staging"
  VITE_API_URL="https://api-staging.framework.co.nz/v1"
fi

echo ""
echo "━━━ Step 1: TypeScript checks ━━━"
npx tsc --noEmit -p workers/api/tsconfig.json
npx tsc --noEmit -p apps/web/tsconfig.json
npx tsc --noEmit -p apps/portal/tsconfig.json
echo "✅ TypeScript OK"

echo ""
echo "━━━ Step 2: Deploy Workers ━━━"
npx wrangler deploy $WRANGLER_ENV workers/api/src/index.ts
echo "✅ API Worker deployed"

npx wrangler deploy $WRANGLER_ENV workers/pdf-generator/src/index.ts
echo "✅ PDF Generator deployed"

npx wrangler deploy $WRANGLER_ENV workers/automation/src/index.ts
echo "✅ Automation Worker deployed"

echo ""
echo "━━━ Step 3: Build & Deploy frontend ━━━"
VITE_API_URL=$VITE_API_URL npm run build:web
PAGES_BRANCH="main"
if [[ "$ENV" == "staging" ]]; then PAGES_BRANCH="staging"; fi
npx wrangler pages deploy apps/web/dist --project-name=framework-web --branch=$PAGES_BRANCH
echo "✅ Public website deployed"

VITE_API_URL=$VITE_API_URL npm run build:portal
npx wrangler pages deploy apps/portal/dist --project-name=framework-portal --branch=$PAGES_BRANCH
echo "✅ Portal deployed"

echo ""
echo "━━━ Step 4: Run DB migrations ━━━"
bash scripts/db-migrate.sh $ENV
echo "✅ Migrations applied"

echo ""
echo "✅ Deploy to $ENV complete!"
if [[ "$ENV" == "production" ]]; then
  echo "   🌐 Website: https://framework.co.nz"
  echo "   🔐 Portal:  https://portal.framework.co.nz"
  echo "   🔌 API:     https://api.framework.co.nz"
else
  echo "   🌐 Website: https://staging.framework.co.nz"
  echo "   🔐 Portal:  https://staging-portal.framework.co.nz"
  echo "   🔌 API:     https://api-staging.framework.co.nz"
fi
