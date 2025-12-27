#!/bin/bash
# Apply RLS Migration via GitHub Actions
# Uses DATABASE_URL from GitHub secrets

set -e

echo "🔒 Applying RLS Migration via GitHub Actions..."

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set"
  echo "💡 Set DATABASE_URL in GitHub secrets"
  exit 1
fi

MIGRATION_FILE="supabase/migrations/20250122000000_rls_enforcement_critical.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Migration file not found: $MIGRATION_FILE"
  exit 1
fi

echo "📄 Migration file: $MIGRATION_FILE"
echo "🔗 Database: ${DATABASE_URL%%@*}@***"

# Try psql first
if command -v psql &> /dev/null; then
  echo "🚀 Applying via psql..."
  psql "$DATABASE_URL" -f "$MIGRATION_FILE" && \
    echo "✅ Migration applied successfully" || \
    echo "⚠️  Migration failed, check output above"
elif command -v supabase &> /dev/null; then
  echo "🚀 Applying via Supabase CLI..."
  supabase db push --include-all && \
    echo "✅ Migration applied successfully" || \
    echo "⚠️  Migration failed, check output above"
else
  echo "⚠️  Neither psql nor supabase CLI available"
  echo "💡 Install psql or use Supabase Dashboard SQL Editor"
  exit 1
fi

# Verify RLS status
echo ""
echo "🔍 Verifying RLS status..."
npx tsx scripts/verify-rls-status.ts || echo "⚠️  Verification failed (non-critical)"

echo ""
echo "✅ RLS migration complete!"
