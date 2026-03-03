#!/usr/bin/env bash
# Apply D1 migrations
# Usage: ./scripts/db-migrate.sh [staging|production]

set -euo pipefail

ENV=${1:-staging}
DB_NAME="framework-db"
if [[ "$ENV" == "staging" ]]; then
  DB_NAME="framework-db-staging"
fi

echo "📦 Applying D1 migrations to $DB_NAME ($ENV)..."

# Apply each migration in order
for migration in database/migrations/*.sql; do
  echo "  → $migration"
  if [[ "$ENV" == "production" ]]; then
    npx wrangler d1 execute "$DB_NAME" --file="$migration"
  else
    npx wrangler d1 execute "$DB_NAME" --env staging --file="$migration"
  fi
done

echo "✅ Migrations applied to $DB_NAME"
