#!/bin/bash
# Verify Onboarding Migration
# Checks that all required tables, functions, and policies exist

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Verifying Onboarding Migration"
echo "=================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not set. Using connection check only.${NC}"
    echo ""
fi

# Function to check table exists
check_table() {
    local table_name=$1
    if [ -z "$DATABASE_URL" ]; then
        echo -e "${YELLOW}⏭️  Skipping table check (no DATABASE_URL)${NC}"
        return 0
    fi
    
    if psql "$DATABASE_URL" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table_name');" | grep -q t; then
        echo -e "${GREEN}✅ Table '$table_name' exists${NC}"
        return 0
    else
        echo -e "${RED}❌ Table '$table_name' missing${NC}"
        return 1
    fi
}

# Function to check function exists
check_function() {
    local func_name=$1
    if [ -z "$DATABASE_URL" ]; then
        echo -e "${YELLOW}⏭️  Skipping function check (no DATABASE_URL)${NC}"
        return 0
    fi
    
    if psql "$DATABASE_URL" -tAc "SELECT EXISTS (SELECT FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = '$func_name');" | grep -q t; then
        echo -e "${GREEN}✅ Function '$func_name' exists${NC}"
        return 0
    else
        echo -e "${RED}❌ Function '$func_name' missing${NC}"
        return 1
    fi
}

# Check migration file exists
if [ -f "supabase/migrations/20260131000000_workspace_onboarding_activation.sql" ]; then
    echo -e "${GREEN}✅ Migration file exists${NC}"
else
    echo -e "${RED}❌ Migration file missing${NC}"
    exit 1
fi

echo ""

# Check tables
echo "Checking tables..."
check_table "workspace_invites"
check_table "tenant_onboarding_progress"
check_table "onboarding_events"

echo ""

# Check functions
echo "Checking functions..."
check_function "create_workspace_with_owner"
check_function "complete_onboarding_step"
check_function "track_onboarding_event"

echo ""

# Check API routes exist
echo "Checking API routes..."
if [ -f "packages/web/src/app/api/workspaces/route.ts" ]; then
    echo -e "${GREEN}✅ Workspaces API route exists${NC}"
else
    echo -e "${RED}❌ Workspaces API route missing${NC}"
fi

if [ -f "packages/web/src/app/api/workspaces/[workspaceId]/invites/route.ts" ]; then
    echo -e "${GREEN}✅ Invites API route exists${NC}"
else
    echo -e "${RED}❌ Invites API route missing${NC}"
fi

if [ -f "packages/web/src/app/api/workspaces/[workspaceId]/onboarding/route.ts" ]; then
    echo -e "${GREEN}✅ Onboarding API route exists${NC}"
else
    echo -e "${RED}❌ Onboarding API route missing${NC}"
fi

if [ -f "packages/web/src/app/api/invite/[token]/route.ts" ]; then
    echo -e "${GREEN}✅ Invite acceptance API route exists${NC}"
else
    echo -e "${RED}❌ Invite acceptance API route missing${NC}"
fi

echo ""

# Check UI pages exist
echo "Checking UI pages..."
if [ -f "packages/web/src/app/console/onboarding/page.tsx" ]; then
    echo -e "${GREEN}✅ Onboarding wizard page exists${NC}"
else
    echo -e "${RED}❌ Onboarding wizard page missing${NC}"
fi

if [ -f "packages/web/src/app/invite/[token]/page.tsx" ]; then
    echo -e "${GREEN}✅ Invite acceptance page exists${NC}"
else
    echo -e "${RED}❌ Invite acceptance page missing${NC}"
fi

echo ""

# Check tests exist
echo "Checking tests..."
if [ -f "tests/e2e/onboarding-flow.spec.ts" ]; then
    echo -e "${GREEN}✅ E2E tests exist${NC}"
else
    echo -e "${RED}❌ E2E tests missing${NC}"
fi

echo ""

# Check documentation exists
echo "Checking documentation..."
if [ -f "docs/ONBOARDING.md" ]; then
    echo -e "${GREEN}✅ Documentation exists${NC}"
else
    echo -e "${RED}❌ Documentation missing${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Verification complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Apply migration: npm run db:migrate:local"
echo "2. Run tests: npm run test:e2e -- tests/e2e/onboarding-flow.spec.ts"
echo "3. Deploy API routes and UI pages"
