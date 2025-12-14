# Autonomous Agents Deployment Checklist

Use this checklist to ensure complete deployment of the autonomous company system.

## Pre-Deployment

- [ ] Supabase CLI installed (`supabase --version`)
- [ ] Logged in to Supabase (`supabase login`)
- [ ] Project linked (`supabase link --project-ref your-project-ref`)
- [ ] Environment variables set:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Database backup created (recommended)

## Database Setup

- [ ] Migration `20260127000000_autonomous_agents_schema.sql` applied
  ```bash
  supabase db push
  ```
- [ ] Verify tables created:
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN (
    'agent_runs', 'strategic_backlog', 'architecture_violations',
    'user_intent_insights', 'preemptive_support_actions',
    'growth_content', 'financial_insights', 'release_safety_checks'
  );
  ```

## Edge Functions Deployment

- [ ] Strategic Governor Agent deployed
- [ ] Architecture Sentinel Agent deployed
- [ ] User Intent Synthesizer Agent deployed
- [ ] Preemptive Support Agent deployed
- [ ] Organic Growth Agent deployed
- [ ] Autonomous CFO Agent deployed
- [ ] Release Gatekeeper Agent deployed
- [ ] Agent Orchestrator deployed

**Quick deploy all:**
```bash
./scripts/deploy-autonomous-agents.sh
```

## Cron Jobs Setup

- [ ] pg_cron extension enabled
  ```sql
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  ```
- [ ] Environment variables set in database:
  ```sql
  ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project.supabase.co';
  ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key';
  ```
- [ ] Cron jobs created from `20260127000001_agent_cron_jobs.sql`
- [ ] Verify cron jobs:
  ```sql
  SELECT jobid, schedule, command FROM cron.job;
  ```

## Verification

- [ ] Run setup verification:
  ```bash
  npx tsx scripts/setup-autonomous-agents.ts
  ```
- [ ] Test agent orchestrator:
  ```bash
  curl -X POST $SUPABASE_URL/functions/v1/agent-orchestrator \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d '{"action": "status"}'
  ```
- [ ] Test individual agent:
  ```bash
  npx tsx scripts/run-agent.ts strategic_governor
  ```
- [ ] Check agent runs table:
  ```sql
  SELECT * FROM agent_runs ORDER BY started_at DESC LIMIT 5;
  ```

## CI/CD Integration (Optional)

- [ ] Release Gatekeeper integrated into GitHub Actions
- [ ] Pre-merge checks configured
- [ ] Post-deploy checks configured

See `.github/workflows/release-safety-check.yml` for example.

## Monitoring Setup

- [ ] Monitoring script executable: `./scripts/monitor-agents.sh`
- [ ] Dashboard access configured (if using)
- [ ] Alert notifications set up (email/webhook)

## Documentation

- [ ] Team members have access to:
  - [ ] Role Replacement Map
  - [ ] Setup Guide
  - [ ] Quick Start Guide
  - [ ] Verification Report template

## Post-Deployment

- [ ] First Strategic Governor run completed (wait for Monday)
- [ ] First Architecture Sentinel run completed (wait for next day)
- [ ] Review initial strategic backlog items
- [ ] Review initial architecture violations
- [ ] Set up weekly review process

## Weekly Review Checklist

- [ ] Review strategic backlog items
- [ ] Approve/reject priorities
- [ ] Review architecture violations
- [ ] Review user insights
- [ ] Review financial insights
- [ ] Approve growth content for publishing
- [ ] Update verification metrics

## Troubleshooting

If something fails:

1. **Check agent runs table:**
   ```sql
   SELECT * FROM agent_runs 
   WHERE status = 'failed' 
   ORDER BY started_at DESC LIMIT 10;
   ```

2. **Check function logs** in Supabase dashboard

3. **Verify cron jobs:**
   ```sql
   SELECT * FROM cron.job_run_details 
   ORDER BY start_time DESC LIMIT 20;
   ```

4. **Test agent manually:**
   ```bash
   npx tsx scripts/run-agent.ts <agent-type>
   ```

## Success Criteria

After deployment, you should see:

- ✅ All 7 agents running on schedule
- ✅ Strategic backlog items generated weekly
- ✅ Architecture violations detected daily
- ✅ User insights generated daily
- ✅ Support actions taken proactively
- ✅ Content generated weekly
- ✅ Financial insights generated daily
- ✅ Release safety checks on PR/deploy

---

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Notes:** _______________
