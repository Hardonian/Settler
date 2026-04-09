# Settler 24/7 Sub-Agent System

Autonomous agents for monitoring, deploying, maintaining, and securing Settler.

## Quick Start

```bash
# 1. Set environment variables
export NEXT_PUBLIC_SUPABASE_URL=your_url
export SUPABASE_SERVICE_ROLE_KEY=your_key
export SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# 2. Start the orchestrator (runs all agents)
node packages/agents/src/orchestrator-agent.js

# Or run individual agents
node packages/agents/src/monitor-agent.js
```

## Agents

### Monitor Agent
Continuous health monitoring with Slack alerts.

```bash
node packages/agents/src/monitor-agent.js
```

**Monitors:**
- Application health
- Database connectivity
- API latency
- Error rates

**Config:**
- `CHECK_INTERVAL=60000` - Check interval in ms
- `ALERT_THRESHOLD=10` - Error threshold before alerting

### Deploy Agent
Automated deployments with rollback capability.

```bash
# Deploy to production
node packages/agents/src/deploy-agent.js --env=production --ref=main

# Deploy specific PR
node packages/agents/src/deploy-agent.js --env=preview --ref=feature-branch
```

**Config:**
- `VERCEL_TOKEN` - Vercel API token
- `GITHUB_TOKEN` - GitHub API token

### Maintenance Agent
Automated cleanup and optimization.

```bash
# Run all maintenance tasks
node packages/agents/src/maintenance-agent.js

# Run specific task
node packages/agents/src/maintenance-agent.js --task=cleanup
```

**Tasks:**
- `cleanup` - Delete old logs (30-90 days)
- `update` - Check for package updates
- `optimize` - VACUUM/ANALYZE database tables
- `cache` - Clear expired cache entries

### Communication Agent
Multi-channel alerting and escalation.

```bash
node packages/agents/src/communication-agent.js --alert="DB down" --priority=critical
```

**Priorities:**
- `low` - Slack only
- `medium` - Slack + email
- `high` - Slack + email + on-call page
- `critical` - All channels + PagerDuty

**Config:**
- `PAGERDUTY_KEY` - PagerDuty integration key
- `ON_CALL="person1,person2,person3"` - On-call rotation

### Security Agent
Automated security scanning.

```bash
# Full security scan
node packages/agents/src/security-agent.js --scan=all

# Specific scan
node packages/agents/src/security-agent.js --scan=vulnerabilities
```

**Scans:**
- `vulnerabilities` - Dependabot alerts
- `secrets` - Secret leak detection
- `rls` - RLS policy verification
- `compliance` - Compliance checks

### Orchestrator Agent
Master controller that coordinates all agents.

```bash
node packages/agents/src/orchestrator-agent.js
```

**Schedule:**
- Monitor: Every minute
- Maintenance: Daily at 3 AM
- Security: Weekly on Sundays at 2 AM

## Database Tables

Create these tables for full functionality:

```sql
-- Agent status tracking
CREATE TABLE agent_status (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  agents JSONB NOT NULL
);

-- Monitoring alerts
CREATE TABLE monitoring_alerts (
  id BIGSERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  status JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deployment history
CREATE TABLE deploys (
  id BIGSERIAL PRIMARY KEY,
  env TEXT NOT NULL,
  commit TEXT NOT NULL,
  status TEXT NOT NULL,
  url TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security audits
CREATE TABLE security_audits (
  id BIGSERIAL PRIMARY KEY,
  scan_time TIMESTAMPTZ,
  issues JSONB,
  summary JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Optional
SLACK_WEBHOOK_URL=
PAGERDUTY_KEY=
VERCEL_TOKEN=
GITHUB_TOKEN=
EMAIL_WEBHOOK_URL=
ON_CALL="person1,person2"

# Tuning
CHECK_INTERVAL=60000
ALERT_THRESHOLD=10
```

## Architecture

```
Orchestrator Agent
    ├── Monitor Agent (every minute)
    ├── Maintenance Agent (daily 3am)
    └── Security Agent (weekly Sunday 2am)

Deploy Agent (on-demand)
Communication Agent (on-demand)
```

All agents use:
- Logger package for standardized logging
- Supabase for data storage
- Slack for notifications
- Database tables for history
