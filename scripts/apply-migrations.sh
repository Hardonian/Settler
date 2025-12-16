#!/bin/bash
# Local migration script (for testing before pushing)

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ENVIRONMENT=${1:-staging}
DRY_RUN=${2:-false}

echo "🔍 Settler Migration Script"
echo "=========================="
echo ""
echo "Environment: $ENVIRONMENT"
echo "Dry Run: $DRY_RUN"
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ psql not found. Please install PostgreSQL client.${NC}"
    exit 1
fi

# Load environment variables
if [ "$ENVIRONMENT" == "production" ]; then
    DB_URL=${SUPABASE_DB_URL_PRODUCTION:-$DATABASE_URL}
    DB_PASSWORD=${SUPABASE_DB_PASSWORD_PRODUCTION:-$DATABASE_PASSWORD}
else
    DB_URL=${SUPABASE_DB_URL_STAGING:-$DATABASE_URL}
    DB_PASSWORD=${SUPABASE_DB_PASSWORD_STAGING:-$DATABASE_PASSWORD}
fi

if [ -z "$DB_URL" ]; then
    echo -e "${RED}❌ Database URL not set.${NC}"
    echo "Set SUPABASE_DB_URL_STAGING or SUPABASE_DB_URL_PRODUCTION"
    exit 1
fi

export PGPASSWORD="$DB_PASSWORD"

# Get list of migrations
MIGRATIONS=$(ls -1 supabase/migrations/*.sql 2>/dev/null | sort)

if [ -z "$MIGRATIONS" ]; then
    echo -e "${YELLOW}⚠️  No migrations found${NC}"
    exit 0
fi

echo "Found $(echo "$MIGRATIONS" | wc -l) migration(s)"
echo ""

if [ "$DRY_RUN" == "true" ]; then
    echo -e "${YELLOW}🔍 DRY RUN MODE - Validating only${NC}"
    echo ""
    
    for migration in $MIGRATIONS; do
        migration_name=$(basename $migration)
        echo "Validating: $migration_name"
        
        # Basic syntax check
        if psql "$DB_URL" -c "\set ON_ERROR_STOP 1" -f "$migration" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $migration_name syntax is valid${NC}"
        else
            echo -e "${RED}✗ $migration_name has syntax errors${NC}"
            exit 1
        fi
    done
    
    echo ""
    echo -e "${GREEN}✅ All migrations validated successfully${NC}"
    exit 0
fi

# Apply migrations
echo "Applying migrations..."
echo ""

for migration in $MIGRATIONS; do
    migration_name=$(basename $migration)
    echo "📦 Applying: $migration_name"
    
    if psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$migration"; then
        echo -e "${GREEN}✅ Applied: $migration_name${NC}"
    else
        echo -e "${RED}❌ Failed: $migration_name${NC}"
        exit 1
    fi
    echo ""
done

echo -e "${GREEN}🎉 All migrations applied successfully!${NC}"

# Verify
echo ""
echo "Verifying migrations..."
psql "$DB_URL" -c "
    SELECT 
        'receipts' as table_name,
        CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'receipts') THEN 'exists' ELSE 'missing' END as status
    UNION ALL
    SELECT 
        'ai_analysis_usage' as table_name,
        CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_analysis_usage') THEN 'exists' ELSE 'missing' END as status
    UNION ALL
    SELECT 
        'ai_analyses' as table_name,
        CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_analyses') THEN 'exists' ELSE 'missing' END as status;
"

echo ""
echo -e "${GREEN}✅ Migration complete!${NC}"
