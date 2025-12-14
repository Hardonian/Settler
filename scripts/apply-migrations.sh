#!/bin/bash
# Apply Supabase migrations automatically
# This script can be run manually or via git hooks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Applying Supabase migrations...${NC}"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Supabase CLI not found. Installing...${NC}"
    npm install -g supabase || {
        echo -e "${RED}❌ Failed to install Supabase CLI${NC}"
        echo "Please install manually: https://supabase.com/docs/guides/cli"
        exit 1
    }
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not set. Checking for .env file...${NC}"
    if [ -f .env ]; then
        export $(grep -v '^#' .env | xargs)
    elif [ -f .env.local ]; then
        export $(grep -v '^#' .env.local | xargs)
    else
        echo -e "${RED}❌ DATABASE_URL not found in environment or .env files${NC}"
        echo "Please set DATABASE_URL or create .env file"
        exit 1
    fi
fi

# Check if SUPABASE_PROJECT_REF is set (for linking)
if [ -n "$SUPABASE_PROJECT_REF" ] && [ -n "$SUPABASE_ACCESS_TOKEN" ]; then
    echo -e "${GREEN}🔗 Linking to Supabase project: $SUPABASE_PROJECT_REF${NC}"
    supabase link --project-ref "$SUPABASE_PROJECT_REF" || {
        echo -e "${YELLOW}⚠️  Failed to link project, continuing with direct connection...${NC}"
    }
fi

# Count migration files
MIGRATION_COUNT=$(find supabase/migrations -name "*.sql" -type f | wc -l)
echo -e "${GREEN}📦 Found $MIGRATION_COUNT migration file(s)${NC}"

if [ "$MIGRATION_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No migration files found in supabase/migrations/${NC}"
    exit 0
fi

# Apply migrations
echo -e "${GREEN}🔄 Applying migrations...${NC}"

if [ -n "$SUPABASE_PROJECT_REF" ] && [ -n "$SUPABASE_ACCESS_TOKEN" ]; then
    # Use Supabase CLI if linked
    supabase db push --include-all || {
        echo -e "${YELLOW}⚠️  db push failed, trying direct psql connection...${NC}"
        # Fallback: apply migrations directly via psql
        for file in supabase/migrations/*.sql; do
            if [ -f "$file" ]; then
                echo -e "${GREEN}Applying: $(basename $file)${NC}"
                psql "$DATABASE_URL" -f "$file" || {
                    echo -e "${RED}❌ Failed to apply $(basename $file)${NC}"
                    exit 1
                }
            fi
        done
    }
else
    # Use direct psql connection
    echo -e "${YELLOW}Using direct database connection...${NC}"
    for file in supabase/migrations/*.sql; do
        if [ -f "$file" ]; then
            echo -e "${GREEN}Applying: $(basename $file)${NC}"
            psql "$DATABASE_URL" -f "$file" || {
                echo -e "${RED}❌ Failed to apply $(basename $file)${NC}"
                exit 1
            }
        fi
    done
fi

echo -e "${GREEN}✅ Migrations applied successfully!${NC}"

# Verify migration status
if command -v supabase &> /dev/null && [ -n "$SUPABASE_PROJECT_REF" ]; then
    echo -e "${GREEN}🔍 Checking migration status...${NC}"
    supabase migration list || echo -e "${YELLOW}⚠️  Could not list migrations${NC}"
fi
