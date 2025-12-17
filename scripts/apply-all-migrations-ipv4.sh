#!/bin/bash
# Apply All Migrations via IPv4 Session Pooler
# This script applies all pending migrations using the IPv4 session pooler connection

set -e

echo "🚀 Applying all migrations via IPv4 session pooler..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  # Try to load from .env.connection
  if [ -f ".env.connection" ]; then
    echo "📋 Loading DATABASE_URL from .env.connection..."
    export $(cat .env.connection | grep -v '^#' | xargs)
  else
    echo "❌ Error: DATABASE_URL not set and .env.connection not found"
    echo "Please set DATABASE_URL or create .env.connection file"
    exit 1
  fi
fi

# Verify connection string format
if [[ ! "$DATABASE_URL" == *"pooler.supabase.com"* ]]; then
  echo "⚠️  Warning: Connection string doesn't appear to use session pooler"
  echo "Expected format: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
fi

# Mask password in output
MASKED_URL=$(echo "$DATABASE_URL" | sed 's/:[^:@]*@/:****@/')
echo "   Connection: $MASKED_URL"
echo ""

# Check if we can use the TypeScript script
if command -v tsx &> /dev/null || command -v npx &> /dev/null; then
  echo "📦 Using TypeScript migration script..."
  if command -v tsx &> /dev/null; then
    tsx scripts/apply-migrations-with-check.ts
  else
    npx tsx scripts/apply-migrations-with-check.ts
  fi
else
  echo "⚠️  tsx not available, attempting direct SQL approach..."
  echo ""
  echo "📋 Migration files to apply:"
  ls -1 supabase/migrations/*.sql | grep -v rollback_template.sql | sort
  
  echo ""
  echo "💡 To apply migrations manually:"
  echo "1. Copy the script from scripts/apply-migrations-supabase-dashboard.sql"
  echo "2. Paste into Supabase Dashboard → SQL Editor"
  echo "3. Run the script"
  echo ""
  echo "Or install dependencies and run:"
  echo "  npm install"
  echo "  npx tsx scripts/apply-migrations-with-check.ts"
fi

echo ""
echo "✅ Migration script completed"
