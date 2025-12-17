#!/bin/bash
# Console Backend Diagnostic Script (Shell version)
# Checks critical components without requiring tsx

set -e

echo "🔍 Console Backend Diagnostics"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
WARNINGS=0

check() {
    local name=$1
    local status=$2
    local message=$3
    
    if [ "$status" = "pass" ]; then
        echo -e "${GREEN}✅${NC} $name: $message"
        ((PASSED++))
    elif [ "$status" = "fail" ]; then
        echo -e "${RED}❌${NC} $name: $message"
        ((FAILED++))
    else
        echo -e "${YELLOW}⚠️${NC} $name: $message"
        ((WARNINGS++))
    fi
}

# Check 1: Environment Variables
echo "1. Checking Environment Variables..."
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -z "$SUPABASE_URL" ]; then
    check "Supabase URL" "fail" "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL"
else
    check "Supabase URL" "pass" "Set"
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ] && [ -z "$SUPABASE_ANON_KEY" ]; then
    check "Supabase Anon Key" "fail" "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY"
else
    check "Supabase Anon Key" "pass" "Set"
fi

if [ -z "$DATABASE_URL" ]; then
    check "Database URL" "fail" "Missing DATABASE_URL"
else
    check "Database URL" "pass" "Set"
fi

echo ""

# Check 2: Prisma Client
echo "2. Checking Prisma Client..."
if [ -d "packages/web/node_modules/.prisma/client" ]; then
    check "Prisma Client" "pass" "Generated client exists"
else
    check "Prisma Client" "fail" "Prisma client not generated (run: npm run prisma:generate)"
fi

if [ -f "packages/web/src/shared/db/prismaClient.ts" ]; then
    check "Prisma Client File" "pass" "prismaClient.ts exists"
else
    check "Prisma Client File" "fail" "prismaClient.ts missing"
fi

echo ""

# Check 3: Key Files
echo "3. Checking Key Files..."
if [ -f "packages/web/src/app/api/health/console/route.ts" ]; then
    check "Health Check Route" "pass" "Exists"
else
    check "Health Check Route" "fail" "Missing"
fi

if [ -f "packages/web/src/lib/api/unified-auth.ts" ]; then
    check "Unified Auth" "pass" "Exists"
else
    check "Unified Auth" "fail" "Missing"
fi

if [ -d "packages/web/src/app/api/console" ]; then
    CONSOLE_ROUTES=$(find packages/web/src/app/api/console -name "route.ts" | wc -l)
    check "Console Routes" "pass" "Found $CONSOLE_ROUTES route files"
else
    check "Console Routes" "fail" "Console routes directory missing"
fi

echo ""

# Check 4: Database Schema
echo "4. Checking Database Schema..."
if [ -f "prisma/schema.prisma" ]; then
    if grep -q "model BillingAccount" prisma/schema.prisma; then
        check "BillingAccount Model" "pass" "Defined in schema"
    else
        check "BillingAccount Model" "fail" "Not found in schema"
    fi
    
    if grep -q "model ApiKey\|model api_keys" prisma/schema.prisma; then
        check "ApiKey Model" "pass" "Defined in schema"
    else
        check "ApiKey Model" "warning" "Not found in schema (may use Supabase directly)"
    fi
else
    check "Prisma Schema" "fail" "schema.prisma missing"
fi

echo ""

# Check 5: Migrations
echo "5. Checking Migrations..."
if [ -d "supabase/migrations" ]; then
    MIGRATION_COUNT=$(find supabase/migrations -name "*.sql" | wc -l)
    check "Migration Files" "pass" "Found $MIGRATION_COUNT migration files"
    
    if [ -f "supabase/migrations/20260125000000_console_rls_fixes.sql" ]; then
        check "RLS Fixes Migration" "pass" "Exists"
    else
        check "RLS Fixes Migration" "warning" "Not found (may have different name)"
    fi
else
    check "Migrations Directory" "warning" "supabase/migrations not found"
fi

echo ""

# Check 6: Domain Functions
echo "6. Checking Domain Functions..."
if [ -f "packages/web/src/domain/console/apiKeys.ts" ]; then
    check "API Keys Domain" "pass" "Exists"
else
    check "API Keys Domain" "fail" "Missing"
fi

if [ -f "packages/web/src/domain/console/receipts.ts" ]; then
    check "Receipts Domain" "pass" "Exists"
else
    check "Receipts Domain" "fail" "Missing"
fi

echo ""

# Summary
echo "=================================="
echo "📊 Summary:"
echo ""
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ Critical issues found. Please fix failed checks.${NC}"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Warnings found. Review and fix if needed.${NC}"
    exit 0
else
    echo -e "${GREEN}✅ All checks passed!${NC}"
    exit 0
fi
