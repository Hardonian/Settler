#!/bin/bash
# Apply Supabase migrations via Pooler connection
# Usage: ./scripts/apply-migrations-pooler.sh [DATABASE_URL]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get DATABASE_URL from argument or environment
DATABASE_URL="${1:-${DATABASE_URL}}"

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL not provided${NC}"
    echo "Usage: $0 [DATABASE_URL]"
    echo "Or set DATABASE_URL environment variable"
    echo ""
    echo "Example pooler URL format:"
    echo "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[HOST].pooler.supabase.com:5432/postgres"
    exit 1
fi

# Check if DATABASE_URL contains pooler
if [[ "$DATABASE_URL" != *"pooler"* ]]; then
    echo -e "${YELLOW}Warning: DATABASE_URL doesn't appear to be a pooler connection${NC}"
    echo "Pooler URLs typically contain 'pooler.supabase.com'"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${GREEN}Applying migrations via Pooler connection...${NC}"
echo ""

# Get list of enterprise migrations
MIGRATIONS_DIR="supabase/migrations"
MIGRATIONS=(
    "20251219001646_enterprise_multi_tenant_core.sql"
    "20251219001647_enterprise_cms_tables.sql"
    "20251219001648_enterprise_rls_policies.sql"
)

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql not found${NC}"
    echo "Install PostgreSQL client:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql-client"
    echo "  Or use Docker: docker run --rm -it postgres:15 psql"
    exit 1
fi

# Test connection
echo -e "${YELLOW}Testing connection...${NC}"
if ! psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${RED}Error: Failed to connect to database${NC}"
    echo "Please check your DATABASE_URL"
    exit 1
fi
echo -e "${GREEN}✓ Connection successful${NC}"
echo ""

# Create migrations table if it doesn't exist
echo -e "${YELLOW}Setting up migrations tracking...${NC}"
psql "$DATABASE_URL" <<EOF
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    inserted_at TIMESTAMP DEFAULT NOW()
);
EOF
echo -e "${GREEN}✓ Migrations table ready${NC}"
echo ""

# Apply each migration
SUCCESS_COUNT=0
FAILED_COUNT=0

for migration in "${MIGRATIONS[@]}"; do
    MIGRATION_FILE="$MIGRATIONS_DIR/$migration"
    MIGRATION_VERSION=$(basename "$migration" .sql)
    
    if [ ! -f "$MIGRATION_FILE" ]; then
        echo -e "${RED}✗ Migration file not found: $MIGRATION_FILE${NC}"
        FAILED_COUNT=$((FAILED_COUNT + 1))
        continue
    fi
    
    # Check if migration already applied
    if psql "$DATABASE_URL" -tAc "SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '$MIGRATION_VERSION'" | grep -q 1; then
        echo -e "${YELLOW}⊘ Migration already applied: $migration${NC}"
        continue
    fi
    
    echo -e "${YELLOW}Applying: $migration${NC}"
    
    # Apply migration
    if psql "$DATABASE_URL" -f "$MIGRATION_FILE" > /tmp/migration_${MIGRATION_VERSION}.log 2>&1; then
        # Record migration
        psql "$DATABASE_URL" -c "INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('$MIGRATION_VERSION', '$migration') ON CONFLICT (version) DO NOTHING;" > /dev/null 2>&1
        echo -e "${GREEN}✓ Successfully applied: $migration${NC}"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo -e "${RED}✗ Failed to apply: $migration${NC}"
        echo "Check /tmp/migration_${MIGRATION_VERSION}.log for details"
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi
    echo ""
done

# Summary
echo "=========================================="
echo -e "${GREEN}Migrations Summary:${NC}"
echo "  Success: $SUCCESS_COUNT"
echo "  Failed:  $FAILED_COUNT"
echo "  Skipped: $((3 - SUCCESS_COUNT - FAILED_COUNT))"
echo "=========================================="

if [ $FAILED_COUNT -gt 0 ]; then
    echo -e "${RED}Some migrations failed. Please review the logs.${NC}"
    exit 1
fi

echo -e "${GREEN}All migrations applied successfully!${NC}"
