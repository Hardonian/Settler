#!/bin/bash
# Verify Setup Script
# Checks that all setup steps have been completed

set -e

echo "🔍 Verifying setup..."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Supabase CLI
echo -n "Checking Supabase CLI... "
if command -v supabase &> /dev/null; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${YELLOW}⚠️  Not installed${NC}"
    echo "  Install with: npm install -g supabase"
fi

# Check 2: Node version
echo -n "Checking Node.js version... "
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 24 ]; then
    echo -e "${GREEN}✅${NC} ($(node -v))"
else
    echo -e "${RED}❌${NC} ($(node -v))"
    echo "  Required: Node.js >= 24.0.0"
fi

# Check 3: npm version
echo -n "Checking npm version... "
NPM_VERSION=$(npm -v | cut -d'.' -f1)
if [ "$NPM_VERSION" -ge 10 ]; then
    echo -e "${GREEN}✅${NC} ($(npm -v))"
else
    echo -e "${RED}❌${NC} ($(npm -v))"
    echo "  Required: npm >= 10.0.0"
fi

# Check 4: Dependencies installed
echo -n "Checking dependencies... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${YELLOW}⚠️  Not installed${NC}"
    echo "  Run: npm ci"
fi

# Check 5: Repository integrity
echo -n "Running repository integrity check... "
if npm run repo-integrity &> /dev/null; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
    echo "  Run: npm run repo-integrity"
fi

# Check 6: Vercel parity
echo -n "Checking Vercel parity... "
if npm run vercel:parity &> /dev/null; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${YELLOW}⚠️  Check manually${NC}"
fi

# Check 7: Migration file exists
echo -n "Checking migration file... "
if [ -f "supabase/migrations/20250127000000_create_ops_tables.sql" ]; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
    echo "  Migration file not found"
fi

# Check 8: CI workflow exists
echo -n "Checking CI workflow... "
if [ -f ".github/workflows/ci.yml" ]; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi

# Check 9: vercel.json exists
echo -n "Checking vercel.json... "
if [ -f "vercel.json" ]; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi

echo ""
echo "📋 Manual Checks Required:"
echo "  [ ] Database migration applied (supabase db push)"
echo "  [ ] GitHub branch protection configured"
echo "  [ ] Vercel settings match vercel.json"
echo "  [ ] Ops dashboard accessible (/console/ops)"
echo "  [ ] Support autopilot tested"

echo ""
echo "✅ Setup verification complete!"
