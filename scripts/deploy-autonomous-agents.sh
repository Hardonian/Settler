#!/bin/bash
# Deploy Autonomous Company Agents
# This script deploys all agent edge functions and sets up the database

set -e

echo "🚀 Deploying Autonomous Company Agents..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found. Please install it first:${NC}"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Supabase. Please run:${NC}"
    echo "   supabase login"
    exit 1
fi

echo -e "${GREEN}✓${NC} Supabase CLI found"

# Step 1: Deploy database migration
echo ""
echo "📦 Step 1: Deploying database migration..."
supabase db push

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Database migration deployed"
else
    echo -e "${RED}❌ Database migration failed${NC}"
    exit 1
fi

# Step 2: Deploy edge functions
echo ""
echo "📦 Step 2: Deploying edge functions..."

# Check for OpenAI API key
if [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  OPENAI_API_KEY not set${NC}"
    echo "   Agents will work but without AI-enhanced reasoning"
    echo "   Set OPENAI_API_KEY environment variable for full AI capabilities"
else
    echo -e "${GREEN}✓${NC} OPENAI_API_KEY found - AI features enabled"
fi

FUNCTIONS=(
    "strategic-governor-agent"
    "architecture-sentinel-agent"
    "user-intent-synthesizer-agent"
    "preemptive-support-agent"
    "organic-growth-agent"
    "autonomous-cfo-agent"
    "release-gatekeeper-agent"
    "agent-orchestrator"
)

for func in "${FUNCTIONS[@]}"; do
    echo "  Deploying $func..."
    
    # Deploy with secrets if OpenAI key is set
    if [ -n "$OPENAI_API_KEY" ]; then
        supabase secrets set OPENAI_API_KEY="$OPENAI_API_KEY" 2>/dev/null || true
    fi
    
    supabase functions deploy "$func" --no-verify-jwt
    
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✓${NC} $func deployed"
    else
        echo -e "  ${RED}❌ $func deployment failed${NC}"
        exit 1
    fi
done

echo ""
echo -e "${GREEN}✓${NC} All edge functions deployed"

# Step 3: Set up cron jobs (requires manual SQL execution)
echo ""
echo "📅 Step 3: Setting up cron jobs..."
echo -e "${YELLOW}⚠️  Cron jobs need to be set up manually via SQL${NC}"
echo "   Run the SQL from: supabase/migrations/20260127000001_agent_cron_jobs.sql"
echo "   Or execute it in your Supabase SQL editor"

# Step 4: Verify deployment
echo ""
echo "🔍 Step 4: Verifying deployment..."

# Get project URL and service role key from environment or config
SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${YELLOW}⚠️  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY not set${NC}"
    echo "   Skipping verification. Set these env vars to verify deployment."
else
    echo "  Testing agent orchestrator..."
    RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/agent-orchestrator" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        -d '{"action": "status"}')
    
    if echo "$RESPONSE" | grep -q "success"; then
        echo -e "  ${GREEN}✓${NC} Agent orchestrator responding"
    else
        echo -e "  ${YELLOW}⚠️  Agent orchestrator verification inconclusive${NC}"
        echo "   Response: $RESPONSE"
    fi
fi

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Set up cron jobs (see supabase/migrations/20260127000001_agent_cron_jobs.sql)"
echo "2. Monitor agents: scripts/monitor-agents.sh"
echo "3. Review documentation: docs/autonomous-company/"
