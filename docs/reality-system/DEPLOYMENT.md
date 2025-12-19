# Reality System Deployment Guide

Complete step-by-step guide to deploy the Reality System.

## Prerequisites

- Supabase project configured
- Environment variables set:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL` (for web app)
- Supabase CLI installed (optional, for local development)

## Step 1: Apply Database Migration

### Option A: Via Supabase Dashboard

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/20260203000000_reality_system_canonical_data.sql`
3. Paste and execute
4. Verify tables created:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('reality_metrics', 'reality_events', 'weekly_snapshots');
   ```

### Option B: Via Supabase CLI

```bash
supabase db push
```

### Option C: Via Script

```bash
./scripts/setup-reality-system.sh
```

## Step 2: Deploy Edge Functions

### Option A: Via Supabase Dashboard

1. Open Supabase Dashboard → Edge Functions
2. Create new function: `collect-reality-metrics`
   - Copy contents of `supabase/functions/collect-reality-metrics/index.ts`
   - Deploy
3. Create new function: `weekly-reality-loop`
   - Copy contents of `supabase/functions/weekly-reality-loop/index.ts`
   - Deploy

### Option B: Via Supabase CLI

```bash
supabase functions deploy collect-reality-metrics
supabase functions deploy weekly-reality-loop
```

### Option C: Via Script

```bash
./scripts/setup-reality-system.sh
```

## Step 3: Set Up Cron Jobs

### Option A: Via Supabase Dashboard (pg_cron)

1. Open Supabase Dashboard → SQL Editor
2. Execute `supabase/migrations/20260203000001_reality_system_cron_jobs.sql`
3. Verify jobs scheduled:
   ```sql
   SELECT * FROM cron.job WHERE jobname IN ('collect-reality-metrics', 'weekly-reality-loop');
   ```

### Option B: Via GitHub Actions

1. Add secrets to GitHub repository:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. The workflow `.github/workflows/reality-system.yml` is already configured
3. It will run automatically on schedule

### Option C: External Scheduler

Use any cron service (e.g., cron-job.org) to call:

```
POST https://your-project.supabase.co/functions/v1/collect-reality-metrics
Authorization: Bearer YOUR_SERVICE_ROLE_KEY
```

## Step 4: Collect Initial Metrics

### Via HTTP Request

```bash
curl -X POST "https://your-project.supabase.co/functions/v1/collect-reality-metrics" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Via Supabase Dashboard

1. Open Edge Functions → `collect-reality-metrics`
2. Click "Invoke"
3. Check logs for results

### Via Script

```bash
./scripts/setup-reality-system.sh
```

## Step 5: Verify Deployment

### Check Tables

```sql
-- Check metrics exist
SELECT COUNT(*) FROM reality_metrics;

-- Check initial metrics
SELECT category, name, value, status FROM reality_metrics ORDER BY category, name;
```

### Check Functions

```sql
-- Test helper functions
SELECT upsert_reality_metric('test', 'test_metric', '100'::jsonb, 'proven', 'manual');
SELECT record_reality_event('test', 'test_event', 'info', '{}'::jsonb);
```

### Check Dashboards

1. **Internal Dashboard**: Navigate to `/console/reality` (admin required)
2. **Investor Dashboard**: Navigate to `/investor/reality` (privileged access)
3. **Public Trust Page**: Navigate to `/trust` (public)

## Step 6: Run Validation Phases

Execute validation phases to prove various aspects:

```bash
# Single phase
npx tsx scripts/validate-reality-phases.ts 5

# All phases
npx tsx scripts/validate-reality-phases.ts all
```

Evidence files will be written to `docs/reality-system/evidence/`.

## Troubleshooting

### Migration Fails

- Check if tables already exist
- Verify database permissions
- Check migration file syntax

### Functions Fail to Deploy

- Verify Supabase CLI is authenticated: `supabase login`
- Check function syntax
- Review function logs in Supabase Dashboard

### Cron Jobs Not Running

- Verify pg_cron extension is enabled
- Check cron job exists: `SELECT * FROM cron.job;`
- Review cron logs: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`

### Metrics Not Updating

- Verify function is being called (check logs)
- Check database connection
- Verify helper functions exist: `SELECT proname FROM pg_proc WHERE proname LIKE '%reality%';`

### Dashboards Show Errors

- Verify API routes are deployed
- Check authentication/authorization
- Review browser console for errors
- Check API route logs

## Post-Deployment Checklist

- [ ] Migration applied successfully
- [ ] Edge functions deployed
- [ ] Cron jobs scheduled (or GitHub Actions configured)
- [ ] Initial metrics collected
- [ ] All three dashboards accessible
- [ ] Validation phases can run
- [ ] Evidence documents being generated

## Monitoring

### Check Function Logs

Supabase Dashboard → Edge Functions → [Function Name] → Logs

### Check Cron Job Runs

```sql
SELECT 
  jobid,
  jobname,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

### Check Metrics Status

```sql
SELECT 
  category,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'proven') as proven,
  COUNT(*) FILTER (WHERE status = 'assumed') as assumed,
  COUNT(*) FILTER (WHERE status = 'broken') as broken
FROM reality_metrics
GROUP BY category
ORDER BY category;
```

## Next Steps

After deployment:

1. Run validation phases 5-15
2. Review REALITY_REPORT.md
3. Set up alerts for broken metrics
4. Schedule regular reviews of weekly snapshots
5. Update metrics as new data sources become available

## Support

See `/docs/reality-system/README.md` for full documentation.
