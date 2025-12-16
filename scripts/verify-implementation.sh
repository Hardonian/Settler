#!/bin/bash
# Verification script for Settler implementation

set -e

echo "🔍 Settler Implementation Verification"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "packages/web/package.json" ]; then
    echo -e "${RED}❌ Error: Must run from workspace root${NC}"
    exit 1
fi

echo "📦 Step 1: Checking dependencies..."
cd packages/web
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dependencies not installed. Installing...${NC}"
    pnpm install
else
    echo -e "${GREEN}✅ Dependencies installed${NC}"
fi

echo ""
echo "🔷 Step 2: TypeScript compilation check..."
if pnpm typecheck 2>&1 | grep -q "error TS"; then
    echo -e "${RED}❌ TypeScript errors found${NC}"
    pnpm typecheck
    exit 1
else
    echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
fi

echo ""
echo "🔍 Step 3: Linting check..."
if pnpm lint 2>&1 | grep -q "error"; then
    echo -e "${YELLOW}⚠️  Linting warnings found (non-blocking)${NC}"
else
    echo -e "${GREEN}✅ Linting passed${NC}"
fi

echo ""
echo "📁 Step 4: Checking file structure..."
cd ../..

# Check core files
FILES=(
    "packages/web/src/lib/domain/types.ts"
    "packages/web/src/lib/judgment/rules.ts"
    "packages/web/src/lib/server/settler/index.ts"
    "packages/web/src/lib/flags/registry.ts"
    "supabase/migrations/20260130000000_settler_receipts_hash_chain.sql"
    "packages/web/src/components/console/MeaningfulChangesFeed.tsx"
    "packages/web/src/components/console/ReconciliationView.tsx"
    "packages/web/src/components/console/ReceiptsHashView.tsx"
    "packages/web/src/components/console/AlertsView.tsx"
    "packages/web/src/components/console/FeatureFlagsPolicy.tsx"
)

MISSING_FILES=()
for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "${RED}❌ Missing files:${NC}"
    for file in "${MISSING_FILES[@]}"; do
        echo "   - $file"
    done
    exit 1
else
    echo -e "${GREEN}✅ All core files present${NC}"
fi

echo ""
echo "🗄️  Step 5: Checking database migrations..."
MIGRATIONS=(
    "supabase/migrations/20260130000000_settler_receipts_hash_chain.sql"
    "supabase/migrations/20260130000001_settler_tenant_context_helper.sql"
    "supabase/migrations/20260130000002_settler_rls_hardening.sql"
)

MISSING_MIGRATIONS=()
for migration in "${MIGRATIONS[@]}"; do
    if [ ! -f "$migration" ]; then
        MISSING_MIGRATIONS+=("$migration")
    fi
done

if [ ${#MISSING_MIGRATIONS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Missing migrations:${NC}"
    for migration in "${MISSING_MIGRATIONS[@]}"; do
        echo "   - $migration"
    done
    exit 1
else
    echo -e "${GREEN}✅ All migrations present${NC}"
fi

echo ""
echo "🧪 Step 6: Checking integration tests..."
if [ -f "tests/integration/rls-policies.test.ts" ]; then
    echo -e "${GREEN}✅ Integration tests present${NC}"
else
    echo -e "${YELLOW}⚠️  Integration tests not found${NC}"
fi

echo ""
echo "📚 Step 7: Checking documentation..."
DOCS=(
    "NOTES.md"
    "VERIFY.md"
    "IMPLEMENTATION_SUMMARY.md"
    "MIGRATION_NOTES.md"
    "COMPLETE_IMPLEMENTATION.md"
)

MISSING_DOCS=()
for doc in "${DOCS[@]}"; do
    if [ ! -f "$doc" ]; then
        MISSING_DOCS+=("$doc")
    fi
done

if [ ${#MISSING_DOCS[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Missing documentation:${NC}"
    for doc in "${MISSING_DOCS[@]}"; do
        echo "   - $doc"
    done
else
    echo -e "${GREEN}✅ All documentation present${NC}"
fi

echo ""
echo "======================================"
echo -e "${GREEN}✅ Verification complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Apply database migrations: supabase migration up"
echo "2. Start dev server: cd packages/web && pnpm dev"
echo "3. Test UI components at /console/changes, /console/reconciliation-view, etc."
echo ""
