#!/bin/bash
# Run Prisma migration for ingestion pipeline
# Uses DATABASE_URL from environment (GitHub Actions secrets) or constructs from DB_* vars

set -e

echo "🔄 Running ingestion pipeline migration..."

# Setup DATABASE_URL if not set
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not set, attempting to construct from DB_* variables..."
  source "$(dirname "$0")/setup-database-url.sh"
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL is required but not set"
  echo "Please set DATABASE_URL or DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD"
  exit 1
fi

# Check Prisma is available
if ! command -v npx &> /dev/null; then
  echo "❌ ERROR: npx not found. Please install Node.js and npm"
  exit 1
fi

# Navigate to workspace root
cd "$(dirname "$0")/.."

echo "📦 Installing dependencies..."
npm install --workspace=packages/api

echo "🔍 Checking Prisma migration status..."
npx prisma migrate status --schema=prisma/schema.prisma || echo "⚠️  Status check failed (may be expected)"

echo "🚀 Running Prisma migration..."
npx prisma migrate dev --schema=prisma/schema.prisma --name ingestion_pipeline

echo "✅ Migration completed successfully!"

echo "📦 Generating Prisma Client..."
npx prisma generate --schema=prisma/schema.prisma

echo "✅ All done!"
