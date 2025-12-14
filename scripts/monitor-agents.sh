#!/bin/bash
# Monitor Autonomous Agents
# Displays status and metrics for all autonomous agents

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set${NC}"
    echo "   export SUPABASE_URL='https://your-project.supabase.co'"
    echo "   export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'"
    exit 1
fi

echo -e "${BLUE}📊 Autonomous Agents Status${NC}"
echo "=================================="
echo ""

# Get agent status from orchestrator
STATUS_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/agent-orchestrator" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d '{"action": "status"}')

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to connect to agent orchestrator${NC}"
    exit 1
fi

# Parse and display status (simplified - would need jq for full parsing)
echo "$STATUS_RESPONSE" | grep -q "success" && echo -e "${GREEN}✓${NC} Orchestrator responding" || echo -e "${RED}✗${NC} Orchestrator error"

echo ""
echo -e "${BLUE}Recent Agent Runs (last 24 hours):${NC}"
echo ""

# Query database for recent runs (requires psql or API access)
# For now, show instructions
echo "To view detailed metrics, run this SQL query:"
echo ""
echo "SELECT"
echo "  agent_type,"
echo "  status,"
echo "  started_at,"
echo "  completed_at,"
echo "  duration_ms,"
echo "  CASE WHEN error_message IS NOT NULL THEN 'ERROR' ELSE 'OK' END as result"
echo "FROM agent_runs"
echo "WHERE started_at >= NOW() - INTERVAL '24 hours'"
echo "ORDER BY started_at DESC"
echo "LIMIT 20;"
echo ""

echo -e "${BLUE}Agent Health Summary:${NC}"
echo ""

# Check each agent type
AGENTS=(
    "strategic_governor"
    "architecture_sentinel"
    "user_intent_synthesizer"
    "preemptive_support"
    "organic_growth"
    "autonomous_cfo"
    "release_gatekeeper"
)

for agent in "${AGENTS[@]}"; do
    # In a real implementation, would query database
    echo -e "  ${agent}: ${GREEN}●${NC} (check database for details)"
done

echo ""
echo -e "${BLUE}Quick Actions:${NC}"
echo ""
echo "1. View all agent runs:"
echo "   SELECT * FROM agent_runs ORDER BY started_at DESC LIMIT 50;"
echo ""
echo "2. View strategic backlog:"
echo "   SELECT * FROM strategic_backlog WHERE status = 'proposed' ORDER BY priority;"
echo ""
echo "3. View architecture violations:"
echo "   SELECT * FROM architecture_violations WHERE status = 'open' ORDER BY severity;"
echo ""
echo "4. View financial insights:"
echo "   SELECT * FROM financial_insights WHERE status = 'active' ORDER BY urgency;"
echo ""
