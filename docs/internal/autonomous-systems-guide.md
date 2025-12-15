# Autonomous Systems Guide

**Last Updated:** 2026-01-27  
**Status:** Consolidated & Hardened

## Overview

Settler operates with **22 autonomous systems** (down from 43+) that handle strategic planning, architecture monitoring, financial analysis, support, growth, and operations without requiring constant human intervention.

## System Architecture

### Core Agents (7)

These agents replace human roles and compound value over time:

1. **Strategic Governor** (`strategic-governor-agent`)
   - **Schedule:** Weekly (Monday 9 AM UTC)
   - **Purpose:** CEO replacement - strategic planning and prioritization
   - **Outputs:** Prioritized backlog, weekly strategy reports
   - **Artifacts:** `/docs/strategy/weekly-{date}.md`, `strategic_backlog` table

2. **Architecture Sentinel** (`architecture-sentinel-agent`)
   - **Schedule:** Daily (2 AM UTC)
   - **Purpose:** CTO replacement - architecture monitoring
   - **Outputs:** Architecture violations, performance regressions
   - **Artifacts:** `architecture_violations` table, alerts

3. **Autonomous CFO** (`autonomous-cfo-agent`)
   - **Schedule:** Daily (5 AM UTC)
   - **Purpose:** Finance replacement - financial insights
   - **Outputs:** Runway estimates, cost anomalies, pricing pressure
   - **Artifacts:** `financial_insights` table, alerts

4. **Preemptive Support** (`preemptive-support-agent`)
   - **Schedule:** Daily (4 AM UTC) + Real-time
   - **Purpose:** Support replacement - proactive help
   - **Outputs:** In-app explanations, support actions
   - **Artifacts:** `preemptive_support_actions` table

5. **Organic Growth** (`organic-growth-agent`)
   - **Schedule:** Weekly (Sunday 10 AM UTC)
   - **Purpose:** Marketing replacement - content generation
   - **Outputs:** SEO content, changelogs, benchmarks
   - **Artifacts:** `growth_content` table

6. **User Intent Synthesizer** (`user-intent-synthesizer-agent`)
   - **Schedule:** Daily (3 AM UTC)
   - **Purpose:** PM replacement - user behavior analysis
   - **Outputs:** User intent insights, feature suggestions
   - **Artifacts:** `user_intent_insights` table

7. **Release Gatekeeper** (`release-gatekeeper-agent`)
   - **Schedule:** Real-time (on PR/commit)
   - **Purpose:** QA replacement - release safety
   - **Outputs:** Safety checks, deployment blocks
   - **Artifacts:** `release_safety_checks` table, PR comments

### Infrastructure Systems (4)

1. **Agent Orchestrator** (`agent-orchestrator`)
   - **Purpose:** Coordinates all agents, manages scheduling
   - **Endpoints:** `/functions/v1/agent-orchestrator`
   - **Actions:** `run`, `status`, `enable`, `disable`

2. **Agent Monitor** (`agent-monitor`)
   - **Schedule:** Every 30 minutes
   - **Purpose:** Dead-man switch monitoring
   - **Outputs:** Alerts for missed agent runs

3. **Automated Health Checks** (`automated-health-checks`)
   - **Schedule:** Every 5 minutes
   - **Purpose:** System health monitoring
   - **Outputs:** Health check results, alerts

4. **Automated Alerting** (`automated-alerting`)
   - **Purpose:** Centralized alerting system
   - **Actions:** `alert`, `digest`, `check_deadman`
   - **Outputs:** Email/Slack alerts, founder digests

### CI/CD Systems (3)

1. **Migration Guardian** (`.github/workflows/migration-guardian.yml`)
   - **Triggers:** Hourly cron, push to main, PR merge
   - **Purpose:** Safe database migrations
   - **Stages:** Detect → Validate → Staging → Production

2. **CI Pipeline** (`.github/workflows/ci.yml`)
   - **Triggers:** Push/PR to main/develop
   - **Purpose:** Continuous integration
   - **Stages:** Validate → Test → Build → Security Scan

3. **Production Deployment** (`.github/workflows/deploy-production.yml`)
   - **Triggers:** Push to main
   - **Purpose:** Production deployment
   - **Stages:** Validate → Test → Build → Deploy → Verify

## How to Use

### Manual Agent Triggers

```bash
# Run specific agent
curl -X POST https://your-project.supabase.co/functions/v1/agent-orchestrator \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"agent_type": "strategic_governor", "action": "run"}'

# Check agent status
curl -X POST https://your-project.supabase.co/functions/v1/agent-orchestrator \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "status"}'

# Disable agent (kill switch)
curl -X POST https://your-project.supabase.co/functions/v1/agent-orchestrator \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"agent_type": "strategic_governor", "action": "disable"}'
```

### Manual Migrations

```bash
# Trigger migration guardian manually
gh workflow run migration-guardian.yml

# With specific environment
gh workflow run migration-guardian.yml -f environment=production -f force=false
```

### Founder Digest

```bash
# Generate daily digest
curl -X POST https://your-project.supabase.co/functions/v1/automated-alerting \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "digest", "type": "daily"}'

# Generate weekly digest
curl -X POST https://your-project.supabase.co/functions/v1/automated-alerting \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "digest", "type": "weekly"}'
```

## Monitoring

### Check Agent Status

```sql
-- View recent agent runs
SELECT 
  agent_type,
  status,
  started_at,
  completed_at,
  duration_ms,
  error_message
FROM agent_runs
ORDER BY started_at DESC
LIMIT 20;

-- Check for missed runs (dead-man switch)
SELECT 
  agent_type,
  MAX(started_at) as last_run,
  NOW() - MAX(started_at) as time_since_last_run
FROM agent_runs
WHERE status = 'completed'
GROUP BY agent_type;
```

### Check Alerts

```sql
-- View recent alerts
SELECT 
  severity,
  title,
  message,
  created_at
FROM alerts
ORDER BY created_at DESC
LIMIT 20;

-- Critical alerts only
SELECT * FROM alerts
WHERE severity = 'critical'
ORDER BY created_at DESC;
```

### Check Health Checks

```sql
-- View recent health checks
SELECT 
  overall_status,
  timestamp,
  results
FROM health_checks
ORDER BY timestamp DESC
LIMIT 10;
```

## Failure Modes & Mitigations

### Agent Failures

**Symptom:** Agent doesn't run on schedule  
**Detection:** Agent Monitor checks every 30 minutes  
**Mitigation:** Automatic alert sent to founder email/Slack  
**Resolution:** Check `agent_runs` table for error details

### Health Check Failures

**Symptom:** System health degrades  
**Detection:** Automated health checks every 5 minutes  
**Mitigation:** Automatic alert sent  
**Resolution:** Check `health_checks` table for details

### Migration Failures

**Symptom:** Migration fails  
**Detection:** Migration Guardian workflow fails  
**Mitigation:** GitHub issue created automatically  
**Resolution:** Review `MIGRATION_LOG.md`, fix issues, re-run

### Alerting System Failure

**Symptom:** Alerts not received  
**Detection:** Fallback direct email if alerting fails  
**Mitigation:** System attempts direct email to founder  
**Resolution:** Check Resend API key, Slack webhook

## Decision Authority

| Decision Domain | Authority System | Escalation |
|----------------|------------------|------------|
| **Migrations** | `migration-guardian.yml` | Manual override via GitHub Actions |
| **Deployments** | `deploy-production.yml` | Manual trigger |
| **Health Checks** | `automated-health-checks` | Founder dashboard |
| **Alerts** | `automated-alerting` | Founder email/Slack |
| **Agent Scheduling** | `agent-orchestrator` | Manual trigger |
| **Build Validation** | `ci.yml` | PR blocking |
| **Release Safety** | `release-gatekeeper-agent` | Blocks deployment |

## Adding New Agents

1. Create edge function in `supabase/functions/{agent-name}/`
2. Add to `agent-orchestrator` config
3. Add cron job in `supabase/migrations/20260127000002_enhanced_agent_cron_jobs.sql`
4. Add schedule to `agent-monitor` config
5. Document in this guide

## Troubleshooting

### Agent Not Running

1. Check cron job: `SELECT * FROM cron.job WHERE jobname = '{agent-name}';`
2. Check recent runs: `SELECT * FROM agent_runs WHERE agent_type = '{agent-type}' ORDER BY started_at DESC LIMIT 5;`
3. Check agent monitor: Look for alerts about missed runs
4. Manual trigger: Use agent-orchestrator API

### Alerts Not Received

1. Check `alerts` table for logged alerts
2. Verify `RESEND_API_KEY` is set
3. Verify `FOUNDER_EMAIL` is set
4. Check Resend dashboard for delivery status

### Migration Stuck

1. Check `MIGRATION_LOG.md` for details
2. Review GitHub Actions workflow run
3. Check database connectivity
4. Verify migration files are valid

## Best Practices

1. **Never bypass orchestrator** - Always route through `agent-orchestrator`
2. **Use centralized alerting** - All alerts go through `automated-alerting`
3. **Monitor dead-man switches** - Agent Monitor checks every 30 minutes
4. **Review founder digest** - Daily digest summarizes all activity
5. **Check before deploying** - Migration Guardian validates before production

## Support

For issues or questions:
1. Check this guide first
2. Review audit: `/docs/internal/autonomous-systems-governance-audit.md`
3. Check agent runs: `SELECT * FROM agent_runs ORDER BY started_at DESC LIMIT 20;`
4. Check alerts: `SELECT * FROM alerts ORDER BY created_at DESC LIMIT 20;`

---

*This guide is maintained as part of the autonomous systems governance audit.*
