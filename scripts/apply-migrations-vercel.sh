#!/bin/bash
# Apply Migrations via Vercel Environment
# 
# This script can be run in Vercel build or via Vercel CLI
# It uses DATABASE_URL from Vercel environment variables

set -e

echo "🚀 Applying migrations via Vercel environment..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set"
    echo "   Set it in Vercel Dashboard → Project → Settings → Environment Variables"
    exit 1
fi

# Mask password in output
MASKED_URL=$(echo "$DATABASE_URL" | sed 's/:[^:@]*@/:****@/')
echo "   Connection: $MASKED_URL"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "⚠️  psql not found. Installing PostgreSQL client..."
    # Try to install (may not work in all environments)
    apt-get update && apt-get install -y postgresql-client || \
    brew install postgresql || \
    echo "Please install PostgreSQL client manually"
fi

# Get list of migrations
MIGRATIONS=$(ls -1 supabase/migrations/*.sql 2>/dev/null | grep -v rollback_template.sql | sort)

if [ -z "$MIGRATIONS" ]; then
    echo "⚠️  No migrations found"
    exit 0
fi

echo "Found $(echo "$MIGRATIONS" | wc -l) migration(s)"
echo ""

# Apply migrations
SUCCESS=0
FAILED=0

for migration in $MIGRATIONS; do
    migration_name=$(basename $migration)
    echo "📦 Applying: $migration_name"
    
    if psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration" 2>&1 | grep -q "ERROR"; then
        # Check if it's an "already exists" error (safe to ignore)
        if psql "$DATABASE_URL" -f "$migration" 2>&1 | grep -q "already exists\|duplicate"; then
            echo "   ⚠️  Already exists (safe to ignore)"
            ((SUCCESS++))
        else
            echo "   ❌ Failed"
            ((FAILED++))
        fi
    else
        echo "   ✅ Applied"
        ((SUCCESS++))
    fi
    echo ""
done

echo "📊 Summary:"
echo "   Successful: $SUCCESS"
echo "   Failed: $FAILED"

if [ $FAILED -gt 0 ]; then
    exit 1
fi

echo ""
echo "✅ All migrations applied successfully!"
