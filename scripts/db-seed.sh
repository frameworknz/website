#!/usr/bin/env bash
# Seed the D1 database with compliance rules
# Usage: ./scripts/db-seed.sh [staging|production]

set -euo pipefail

ENV=${1:-staging}
DB_NAME="framework-db"
if [[ "$ENV" == "staging" ]]; then
  DB_NAME="framework-db-staging"
fi

echo "🌱 Seeding $DB_NAME ($ENV) with compliance rules..."

if [[ "$ENV" == "production" ]]; then
  npx wrangler d1 execute "$DB_NAME" --file="database/seed.sql"
else
  npx wrangler d1 execute "$DB_NAME" --env staging --file="database/seed.sql"
fi

echo "✅ Seed data applied"
