#!/bin/bash
# Check which migrations have been applied
# This script helps identify pending migrations

set -e

echo "🔍 Checking migration status..."

if [ -z "$SUPABASE_PROJECT_REF" ] && [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: SUPABASE_PROJECT_REF or DATABASE_URL must be set"
  exit 1
fi

# Method 1: Use Supabase CLI
if [ -n "$SUPABASE_PROJECT_REF" ] && [ -n "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "Using Supabase CLI to check status..."
  supabase migration list --project-ref "$SUPABASE_PROJECT_REF"
  exit 0
fi

# Method 2: Direct database query
if [ -n "$DATABASE_URL" ]; then
  echo "Querying database directly..."
  
  echo ""
  echo "📊 Applied Migrations:"
  echo "----------------------"
  psql "$DATABASE_URL" -c "SELECT version, name, inserted_at FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 20;" || {
    echo "⚠️  Could not query migrations table"
    echo "This might mean migrations haven't been tracked yet"
  }
  
  echo ""
  echo "📁 Available Migration Files:"
  echo "-----------------------------"
  ls -1 supabase/migrations/*.sql 2>/dev/null | while read file; do
    filename=$(basename "$file")
    version=$(echo "$filename" | grep -oE '^[0-9]{14}' || echo "")
    if [ -n "$version" ]; then
      echo "  - $filename"
    fi
  done
  
  exit 0
fi

echo "❌ No valid connection method found"
exit 1
