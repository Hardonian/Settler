#!/bin/bash
# Run Prisma migration with environment variables from GitHub Actions secrets
# This script is designed to work in CI/CD environments

set -e

echo "🔄 Running Ingestion Pipeline Migration..."
echo "=========================================="

# Check if DATABASE_URL is set (from GitHub Actions secrets)
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not found in environment"
  echo "Attempting to construct from DB_* variables..."
  
  if [ -z "$DB_HOST" ] && [ -z "$POSTGRES_HOST" ]; then
    echo "❌ ERROR: Neither DATABASE_URL nor DB_HOST/POSTGRES_HOST is set"
    echo "Please set DATABASE_URL or provide DB connection details"
    exit 1
  fi
  
  # Use POSTGRES_* vars if available (common in GitHub Actions)
  DB_HOST=${POSTGRES_HOST:-${DB_HOST:-localhost}}
  DB_PORT=${POSTGRES_PORT:-${DB_PORT:-5432}}
  DB_NAME=${POSTGRES_DB:-${DB_NAME:-settler}}
  DB_USER=${POSTGRES_USER:-${DB_USER:-postgres}}
  DB_PASSWORD=${POSTGRES_PASSWORD:-${DB_PASSWORD:-postgres}}
  
  # Construct DATABASE_URL
  export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
  echo "✅ Constructed DATABASE_URL from environment variables"
else
  echo "✅ Using DATABASE_URL from environment"
fi

# Mask password in logs
MASKED_URL=$(echo "$DATABASE_URL" | sed 's/:[^@]*@/:***@/')
echo "Database: $MASKED_URL"

# Navigate to workspace root
cd "$(dirname "$0")/.."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Install API dependencies
if [ ! -d "packages/api/node_modules" ]; then
  echo "📦 Installing API dependencies..."
  npm install --workspace=packages/api
fi

# Check Prisma CLI
if ! command -v npx &> /dev/null; then
  echo "❌ ERROR: npx not found. Please install Node.js"
  exit 1
fi

echo ""
echo "🔍 Checking Prisma migration status..."
npx prisma migrate status --schema=prisma/schema.prisma || {
  echo "⚠️  Migration status check failed (may be expected if no migrations exist)"
}

echo ""
echo "🚀 Running Prisma migration..."
npx prisma migrate dev --schema=prisma/schema.prisma --name ingestion_pipeline --create-only || {
  echo "⚠️  Migration creation failed, trying deploy instead..."
  npx prisma migrate deploy --schema=prisma/schema.prisma
}

echo ""
echo "📦 Generating Prisma Client..."
npx prisma generate --schema=prisma/schema.prisma

echo ""
echo "✅ Migration completed successfully!"
echo ""
echo "📊 Verification:"
npx prisma migrate status --schema=prisma/schema.prisma
