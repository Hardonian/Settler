#!/bin/bash
# Apply Pending Migrations Safely (No Duplicates)
# This script checks which migrations are already applied and only applies pending ones

set -e

echo "🚀 Applying pending migrations (no duplicates)..."

# Load DATABASE_URL from .env.connection if available
if [ -f ".env.connection" ]; then
  echo "📋 Loading DATABASE_URL from .env.connection..."
  export $(cat .env.connection | grep -v '^#' | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL not set"
  echo "Please set DATABASE_URL or create .env.connection file"
  exit 1
fi

# Mask password in output
MASKED_URL=$(echo "$DATABASE_URL" | sed 's/:[^:@]*@/:****@/')
echo "   Connection: $MASKED_URL"
echo ""

# Check if we have the required tools
if command -v psql &> /dev/null; then
  echo "✅ Using psql directly..."
  
  # Create migrations table if it doesn't exist
  psql "$DATABASE_URL" -c "
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );
  " 2>&1 | grep -v "already exists" || true
  
  # Get list of applied migrations
  echo "📋 Checking applied migrations..."
  APPLIED=$(psql "$DATABASE_URL" -t -c "SELECT version FROM schema_migrations ORDER BY version;" 2>/dev/null | tr -d ' ' | grep -v '^$' || echo "")
  
  # Count applied
  APPLIED_COUNT=$(echo "$APPLIED" | grep -c . || echo "0")
  echo "   Found $APPLIED_COUNT applied migration(s)"
  
  # Get all migration files
  MIGRATION_FILES=$(ls -1 supabase/migrations/*.sql | grep -v rollback_template.sql | sort)
  TOTAL_COUNT=$(echo "$MIGRATION_FILES" | wc -l)
  
  echo "📦 Found $TOTAL_COUNT migration file(s) total"
  echo ""
  
  # Find and apply pending migrations
  PENDING_COUNT=0
  APPLIED_COUNT_NUM=0
  
  for MIGRATION_FILE in $MIGRATION_FILES; do
    FILENAME=$(basename "$MIGRATION_FILE")
    
    # Check if already applied
    if echo "$APPLIED" | grep -q "^$FILENAME$"; then
      echo "   ✅ $FILENAME (already applied)"
      APPLIED_COUNT_NUM=$((APPLIED_COUNT_NUM + 1))
    else
      echo "   ⏳ Applying: $FILENAME"
      
      # Apply migration
      if psql "$DATABASE_URL" -f "$MIGRATION_FILE" > /tmp/migration_output.log 2>&1; then
        # Mark as applied (ignore errors if already exists)
        psql "$DATABASE_URL" -c "INSERT INTO schema_migrations (version) VALUES ('$FILENAME') ON CONFLICT (version) DO NOTHING;" > /dev/null 2>&1 || true
        
        echo "      ✅ Applied successfully"
        PENDING_COUNT=$((PENDING_COUNT + 1))
        APPLIED_COUNT_NUM=$((APPLIED_COUNT_NUM + 1))
      else
        # Check if it's a harmless "already exists" error
        if grep -q "already exists\|duplicate\|already enabled" /tmp/migration_output.log; then
          # Mark as applied since objects exist
          psql "$DATABASE_URL" -c "INSERT INTO schema_migrations (version) VALUES ('$FILENAME') ON CONFLICT (version) DO NOTHING;" > /dev/null 2>&1 || true
          echo "      ✅ Applied (objects already exist)"
          PENDING_COUNT=$((PENDING_COUNT + 1))
          APPLIED_COUNT_NUM=$((APPLIED_COUNT_NUM + 1))
        else
          echo "      ❌ Failed:"
          cat /tmp/migration_output.log | head -5
          echo ""
          echo "   See /tmp/migration_output.log for full error"
          exit 1
        fi
      fi
    fi
  done
  
  echo ""
  echo "📊 Migration Summary:"
  echo "   Already applied: $((APPLIED_COUNT_NUM - PENDING_COUNT))"
  echo "   Newly applied: $PENDING_COUNT"
  echo "   Total applied: $APPLIED_COUNT_NUM/$TOTAL_COUNT"
  
  if [ $PENDING_COUNT -eq 0 ]; then
    echo ""
    echo "✅ All migrations are already applied!"
  else
    echo ""
    echo "✅ Successfully applied $PENDING_COUNT pending migration(s)!"
  fi
  
elif command -v npx &> /dev/null; then
  echo "📦 Using TypeScript migration script..."
  echo "   (This requires npm dependencies to be installed)"
  echo ""
  
  if [ -d "node_modules" ] || [ -d "packages/api/node_modules" ]; then
    npx tsx scripts/apply-migrations-with-check.ts
  else
    echo "⚠️  Dependencies not installed. Installing..."
    npm install --no-save pg dotenv tsx
    npx tsx scripts/apply-migrations-with-check.ts
  fi
else
  echo "❌ Error: Neither psql nor npx available"
  echo ""
  echo "Please install one of:"
  echo "  1. PostgreSQL client (psql)"
  echo "  2. Node.js with npm (for TypeScript script)"
  echo ""
  echo "Or apply migrations manually via Supabase Dashboard:"
  echo "  1. Go to Supabase Dashboard → SQL Editor"
  echo "  2. Copy contents of scripts/apply-migrations-supabase-dashboard.sql"
  echo "  3. Paste and run"
  exit 1
fi

echo ""
echo "✅ Migration process completed"
