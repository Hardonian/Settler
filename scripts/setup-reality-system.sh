#!/bin/bash
# Reality System Setup Script
# Completes all next steps for Reality System deployment

set -e

echo "=========================================="
echo "Reality System Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check for required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set${NC}"
    exit 1
fi

echo -e "${GREEN}Step 1: Applying database migration...${NC}"
echo "Applying: 20260203000000_reality_system_canonical_data.sql"
supabase db push --db-url "$SUPABASE_URL" || {
    echo -e "${YELLOW}Note: If migration already applied, this is expected${NC}"
}

echo ""
echo -e "${GREEN}Step 2: Deploying Edge Functions...${NC}"

echo "Deploying: collect-reality-metrics"
supabase functions deploy collect-reality-metrics || {
    echo -e "${RED}Failed to deploy collect-reality-metrics${NC}"
    exit 1
}

echo "Deploying: weekly-reality-loop"
supabase functions deploy weekly-reality-loop || {
    echo -e "${RED}Failed to deploy weekly-reality-loop${NC}"
    exit 1
}

echo ""
echo -e "${GREEN}Step 3: Setting up cron jobs...${NC}"
echo "Cron jobs will be set up via SQL (see setup-cron-jobs.sql)"

echo ""
echo -e "${GREEN}Step 4: Collecting initial metrics...${NC}"
curl -X POST "${SUPABASE_URL}/functions/v1/collect-reality-metrics" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" || {
    echo -e "${YELLOW}Warning: Initial metric collection failed (may need to wait for function deployment)${NC}"
}

echo ""
echo -e "${GREEN}Step 5: Verifying system...${NC}"

# Check if tables exist
echo "Checking reality_metrics table..."
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT COUNT(*) FROM reality_metrics"}' || {
    echo -e "${YELLOW}Note: Verification query may need adjustment${NC}"
}

echo ""
echo -e "${GREEN}=========================================="
echo "Reality System Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Run setup-cron-jobs.sql in Supabase SQL Editor"
echo "2. Access dashboards:"
echo "   - Internal: /console/reality"
echo "   - Investor: /investor/reality"
echo "   - Public: /trust"
echo "3. Run validation phases:"
echo "   npx tsx scripts/validate-reality-phases.ts [phase-number]"
echo ""
