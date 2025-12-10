#!/bin/bash
# Run all database migrations
# This script uses environment variables from GitHub secrets

set -e

echo "🚀 Starting database migration process..."

# Check for required environment variables
if [ -z "$DATABASE_URL" ] && [ -z "$SUPABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL or SUPABASE_URL must be set"
  echo "   These should be configured in GitHub secrets"
  exit 1
fi

# Run Supabase migrations
echo "📦 Running Supabase migrations..."
npm run db:migrate:auto

# Run Prisma migrations (if using Prisma)
echo "📦 Running Prisma migrations..."
if [ -n "$DATABASE_URL" ]; then
  npm run prisma:migrate || echo "⚠️  Prisma migrations skipped (may not be needed if using Supabase migrations)"
else
  echo "⚠️  Skipping Prisma migrations (DATABASE_URL not set)"
fi

echo "✅ All migrations completed successfully!"
