# Autonomous Company Setup Guide

This guide explains how to set up and operate Settler's autonomous company agents.

## Prerequisites

1. Supabase project with all migrations applied
2. Edge Functions deployed
3. Database tables created (from `20260127000000_autonomous_agents_schema.sql`)
4. Environment variables configured

## Database Setup

### 1. Run Migration

```bash
supabase db push
```

This creates all necessary tables:
- `agent_runs` - Tracks agent executions
- `strategic_backlog` - Strategic priorities
- `architecture_violations` - Code quality issues
- `user_intent_insights` - User behavior insights
- `preemptive_support_actions` - Proactive support
- `growth_content` - Generated content
- `financial_insights` - Financial analysis
- `release_safety_checks` - Release safety

### 2. Set Up Cron Jobs (Optional)

Use Supabase pg_cron extension to schedule agents:

```sql
-- Strategic Governor: Every Monday at 9 AM UTC
SELECT cron.schedule(
  'strategic-governor-weekly',
  '0 9 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/strategic-governor-agent',
    headers := jsonb_build_object('Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY')
  );
  $$
);

-- Architecture Sentinel: Daily at 2 AM UTC
SELECT cron.schedule(
  'architecture-sentinel-daily',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/architecture-sentinel-agent',
    headers := jsonb_build_object('Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY')
  );
  $$
);

-- User Intent Synthesizer: Daily at 3 AM UTC
SELECT cron.schedule(
  'user-intent-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/user-intent-synthesizer-agent',
    headers := jsonb_build_object('Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY')
  );
  $$
);

-- Preemptive Support: Daily at 4 AM UTC
SELECT cron.schedule(
  'preemptive-support-daily',
  '0 4 * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/preemptive-support-agent',
    headers := jsonb_build_object('Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY')
  );
  $$
);

-- Organic Growth: Weekly on Sunday at 10 AM UTC
SELECT cron.schedule(
  'organic-growth-weekly',
  '0 10 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/organic-growth-agent',
    headers := jsonb_build_object('Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY')
  );
  $$
);

-- Autonomous CFO: Daily at 5 AM UTC
SELECT cron.schedule(
  'autonomous-cfo-daily',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/autonomous-cfo-agent',
    headers := jsonb_build_object('Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY')
  );
  $$
);
```

## Deploy Edge Functions

Deploy all agent functions:

```bash
supabase functions deploy strategic-governor-agent
supabase functions deploy architecture-sentinel-agent
supabase functions deploy user-intent-synthesizer-agent
supabase functions deploy preemptive-support-agent
supabase functions deploy organic-growth-agent
supabase functions deploy autonomous-cfo-agent
supabase functions deploy release-gatekeeper-agent
supabase functions deploy agent-orchestrator
```

## Manual Testing

### Test Strategic Governor

```bash
curl -X POST https://your-project.supabase.co/functions/v1/strategic-governor-agent \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### Test Agent Orchestrator

```bash
# Get status of all agents
curl -X POST https://your-project.supabase.co/functions/v1/agent-orchestrator \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "status"}'

# Run all scheduled agents
curl -X POST https://your-project.supabase.co/functions/v1/agent-orchestrator \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "run"}'

# Run specific agent
curl -X POST https://your-project.supabase.co/functions/v1/agent-orchestrator \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "run", "agent_type": "strategic_governor"}'
```

## Monitoring

### View Agent Runs

```sql
SELECT 
  agent_type,
  status,
  started_at,
  completed_at,
  duration_ms,
  error_message
FROM agent_runs
ORDER BY started_at DESC
LIMIT 50;
```

### View Strategic Backlog

```sql
SELECT 
  priority,
  title,
  category,
  estimated_impact,
  estimated_effort,
  rationale
FROM strategic_backlog
WHERE status = 'proposed'
ORDER BY priority;
```

### View Architecture Violations

```sql
SELECT 
  violation_type,
  severity,
  violation_description,
  suggested_action
FROM architecture_violations
WHERE status = 'open'
ORDER BY 
  CASE severity 
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    ELSE 4
  END;
```

### View Financial Insights

```sql
SELECT 
  insight_type,
  title,
  urgency,
  recommended_action
FROM financial_insights
WHERE status = 'active'
ORDER BY 
  CASE urgency 
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    ELSE 4
  END;
```

## Kill Switches

### Disable an Agent

```bash
curl -X POST https://your-project.supabase.co/functions/v1/agent-orchestrator \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "disable", "agent_type": "strategic_governor"}'
```

### Enable an Agent

```bash
curl -X POST https://your-project.supabase.co/functions/v1/agent-orchestrator \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "enable", "agent_type": "strategic_governor"}'
```

## Integration with CI/CD

### Release Gatekeeper in GitHub Actions

```yaml
name: Release Safety Check

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  safety-check:
    runs-on: ubuntu-latest
    steps:
      - name: Run Release Gatekeeper
        run: |
          curl -X POST ${{ secrets.SUPABASE_FUNCTIONS_URL }}/release-gatekeeper-agent \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"release_id": "${{ github.sha }}", "check_type": "pre_merge"}'
```

## Troubleshooting

### Agent Not Running

1. Check agent status:
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/agent-orchestrator \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d '{"action": "status"}'
   ```

2. Check logs in Supabase dashboard
3. Verify cron jobs are scheduled correctly
4. Check if agent is disabled via kill switch

### Agent Failing

1. Check `agent_runs` table for error messages
2. Review function logs in Supabase dashboard
3. Verify database tables exist
4. Check environment variables

### High Error Rate

1. Review `architecture_violations` table
2. Check `error_logs` for patterns
3. Review `release_safety_checks` for recent deployments

## Next Steps

1. Review weekly strategy reports in `/docs/strategy/`
2. Approve/reject strategic backlog items
3. Review and publish growth content
4. Monitor financial insights
5. Review architecture violations

---

*Last updated: 2026-01-27*
