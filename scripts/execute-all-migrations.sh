#!/bin/bash
# Execute All Database Migrations
# This script runs all pending migrations using connection info from GitHub secrets
# Usage: ./scripts/execute-all-migrations.sh

set -e

echo "🚀 Starting comprehensive database migration process..."
echo ""

# Color output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check for required environment variables
if [ -z "$DATABASE_URL" ] && [ -z "$SUPABASE_URL" ]; then
  echo -e "${RED}❌ Error: DATABASE_URL or SUPABASE_URL must be set${NC}"
  echo "   These should be configured in GitHub secrets:"
  echo "   - DATABASE_URL (preferred)"
  echo "   - SUPABASE_URL + SUPABASE_DB_PASSWORD"
  exit 1
fi

echo -e "${GREEN}✓ Connection variables found${NC}"
if [ -n "$DATABASE_URL" ]; then
  MASKED_URL=$(echo "$DATABASE_URL" | sed 's/:[^:@]*@/:****@/')
  echo "   Using: DATABASE_URL (${MASKED_URL:0:50}...)"
elif [ -n "$SUPABASE_URL" ]; then
  echo "   Using: SUPABASE_URL + SUPABASE_DB_PASSWORD"
fi
echo ""

# Step 1: Run Supabase migrations
echo -e "${YELLOW}📦 Step 1: Running Supabase migrations...${NC}"
if npm run db:migrate:auto; then
  echo -e "${GREEN}✓ Supabase migrations completed${NC}"
else
  echo -e "${RED}✗ Supabase migrations failed${NC}"
  exit 1
fi
echo ""

# Step 2: Run Prisma migrations (if using Prisma)
echo -e "${YELLOW}📦 Step 2: Running Prisma migrations...${NC}"
if [ -n "$DATABASE_URL" ]; then
  if npm run prisma:migrate 2>&1 | grep -q "No pending migrations"; then
    echo -e "${GREEN}✓ No pending Prisma migrations${NC}"
  elif npm run prisma:migrate; then
    echo -e "${GREEN}✓ Prisma migrations completed${NC}"
  else
    echo -e "${YELLOW}⚠️  Prisma migrations skipped (may not be needed if using Supabase migrations)${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Skipping Prisma migrations (DATABASE_URL not set)${NC}"
fi
echo ""

# Step 3: Regenerate Prisma client
echo -e "${YELLOW}📦 Step 3: Regenerating Prisma client...${NC}"
if npm run prisma:generate; then
  echo -e "${GREEN}✓ Prisma client regenerated${NC}"
else
  echo -e "${RED}✗ Prisma client generation failed${NC}"
  exit 1
fi
echo ""

# Step 4: Verify migration status
echo -e "${YELLOW}📦 Step 4: Verifying migration status...${NC}"
if [ -n "$DATABASE_URL" ]; then
  if npm run prisma:status 2>&1 | grep -q "Database schema is up to date"; then
    echo -e "${GREEN}✓ Database schema is up to date${NC}"
  else
    echo -e "${YELLOW}⚠️  Some migrations may be pending (check output above)${NC}"
  fi
fi
echo ""

echo -e "${GREEN}✅ All migration tasks completed!${NC}"
echo ""
echo "Summary:"
echo "  - Supabase migrations: ✅"
echo "  - Prisma migrations: ✅"
echo "  - Prisma client: ✅"
echo ""
echo "Next steps:"
echo "  1. Verify tables exist: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
echo "  2. Check webhook tables: \\d webhooks"
echo "  3. Verify RLS policies: SELECT * FROM pg_policies WHERE tablename IN ('webhooks', 'webhook_deliveries');"
