#!/bin/bash
# Apply pending Supabase migrations
# This script checks for unapplied migrations and applies them

set -e

echo "🔍 Checking for pending migrations..."

# Check required environment variables
if [ -z "$SUPABASE_PROJECT_REF" ] && [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: SUPABASE_PROJECT_REF or DATABASE_URL must be set"
  exit 1
fi

# Method 1: Use Supabase CLI (preferred)
if [ -n "$SUPABASE_PROJECT_REF" ] && [ -n "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "Using Supabase CLI..."
  
  # Link project if not already linked
  if [ ! -f ".supabase/config.toml" ] || ! grep -q "project_id = \"$SUPABASE_PROJECT_REF\"" .supabase/config.toml 2>/dev/null; then
    echo "Linking Supabase project..."
    supabase link --project-ref "$SUPABASE_PROJECT_REF"
  fi
  
  # Push all migrations
  echo "Applying migrations..."
  supabase db push --include-all
  
  echo "✅ Migrations applied successfully"
  exit 0
fi

# Method 2: Direct database connection
if [ -n "$DATABASE_URL" ]; then
  echo "Using direct database connection..."
  
  # Check if migrations table exists
  MIGRATIONS_TABLE_EXISTS=$(psql "$DATABASE_URL" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'supabase_migrations' AND table_name = 'schema_migrations');" 2>/dev/null || echo "false")
  
  if [ "$MIGRATIONS_TABLE_EXISTS" != "t" ]; then
    echo "⚠️  Migrations table not found. Creating..."
    psql "$DATABASE_URL" -c "CREATE SCHEMA IF NOT EXISTS supabase_migrations;" || true
    psql "$DATABASE_URL" -c "CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (version TEXT PRIMARY KEY, name TEXT, inserted_at TIMESTAMPTZ DEFAULT NOW());" || true
  fi
  
  # Get list of applied migrations
  APPLIED=$(psql "$DATABASE_URL" -tAc "SELECT version FROM supabase_migrations.schema_migrations;" 2>/dev/null || echo "")
  
  # Apply each migration file
  for migration_file in supabase/migrations/*.sql; do
    if [ ! -f "$migration_file" ]; then
      continue
    fi
    
    filename=$(basename "$migration_file")
    # Extract version from filename (format: YYYYMMDDHHMMSS_description.sql)
    version=$(echo "$filename" | grep -oE '^[0-9]{14}' || echo "")
    
    if [ -z "$version" ]; then
      echo "⚠️  Skipping invalid migration filename: $filename"
      continue
    fi
    
    # Check if already applied
    if echo "$APPLIED" | grep -q "$version"; then
      echo "⏭️  Skipping already applied: $filename"
      continue
    fi
    
    echo "🔄 Applying: $filename"
    if psql "$DATABASE_URL" -f "$migration_file"; then
      # Record migration
      psql "$DATABASE_URL" -c "INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('$version', '$filename') ON CONFLICT (version) DO NOTHING;" || true
      echo "✅ Applied: $filename"
    else
      echo "❌ Failed to apply: $filename"
      exit 1
    fi
  done
  
  echo "✅ All migrations applied successfully"
  exit 0
fi

echo "❌ No valid database connection method found"
exit 1
