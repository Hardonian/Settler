# Quick Start Guide

Get your autonomous agents running in 5 minutes.

## Prerequisites

- Supabase CLI installed: `npm install -g supabase`
- Logged in: `supabase login`
- Project linked: `supabase link --project-ref your-project-ref`

## Step 1: Deploy Database Schema

```bash
supabase db push
```

This creates all necessary tables for the autonomous agents.

## Step 2: Deploy Edge Functions

Use the automated deployment script:

```bash
./scripts/deploy-autonomous-agents.sh
```

Or deploy manually:

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

## Step 3: Set Up Cron Jobs

1. Open your Supabase SQL Editor
2. Run the SQL from `supabase/migrations/20260127000001_agent_cron_jobs.sql`
3. Update the URLs and service role keys in the cron jobs

Or set environment variables first:

```sql
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key';
```

## Step 4: Verify Setup

Run the verification script:

```bash
export SUPABASE_URL='https://your-project.supabase.co'
export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'
npx tsx scripts/setup-autonomous-agents.ts
```

## Step 5: Test an Agent

Run an agent manually:

```bash
npx tsx scripts/run-agent.ts strategic_governor
```

## Step 6: Monitor Agents

Check agent status:

```bash
./scripts/monitor-agents.sh
```

Or query the database:

```sql
SELECT 
  agent_type,
  status,
  started_at,
  completed_at,
  duration_ms
FROM agent_runs
ORDER BY started_at DESC
LIMIT 20;
```

## What Happens Next?

- **Strategic Governor** runs every Monday, generating prioritized backlog
- **Architecture Sentinel** runs daily, detecting code quality issues
- **User Intent Synthesizer** runs daily, analyzing user behavior
- **Preemptive Support** runs daily, proactively resolving issues
- **Organic Growth** runs weekly, generating content
- **Autonomous CFO** runs daily, tracking finances
- **Release Gatekeeper** runs on PR/deploy events

## Troubleshooting

### Functions not deploying

Check Supabase CLI version:
```bash
supabase --version
```

Update if needed:
```bash
npm install -g supabase@latest
```

### Cron jobs not running

1. Verify pg_cron extension is enabled
2. Check cron job status: `SELECT * FROM cron.job;`
3. Check cron logs: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;`

### Agents failing

1. Check agent runs table for error messages
2. Review function logs in Supabase dashboard
3. Verify environment variables are set correctly

## Next Steps

- Review [Role Replacement Map](./role-replacement-map.md) to understand what each agent does
- Check [Setup Guide](./setup-guide.md) for detailed configuration
- Monitor [Verification Report](./verification-report.md) weekly

---

*Need help? Check the full [Setup Guide](./setup-guide.md)*
