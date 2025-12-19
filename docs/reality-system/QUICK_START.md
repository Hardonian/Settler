# Reality System Quick Start

## Overview

The Reality System is now operational. Here's how to use it.

## Access Dashboards

1. **Internal Ops Dashboard** (Admin only)
   - URL: `/console/reality`
   - Shows all metrics with PROVEN/ASSUMED/BROKEN status
   - All 7 sections: Revenue, User, Tenant Isolation, Failure, Deployment, GTM, Admin

2. **Board/Investor Dashboard** (Privileged access)
   - URL: `/investor/reality`
   - Executive-level KPIs
   - Suitable for investor presentations

3. **Public Trust Page**
   - URL: `/trust`
   - Public-facing trust metrics
   - Reads from canonical reality data

## Collect Metrics

Metrics are collected automatically, but you can trigger manually:

```bash
# Using Supabase CLI
supabase functions invoke collect-reality-metrics

# Or via HTTP
curl -X POST https://your-project.supabase.co/functions/v1/collect-reality-metrics \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Run Weekly Loop

The weekly loop runs automatically on Mondays, but you can trigger manually:

```bash
# Using Supabase CLI
supabase functions invoke weekly-reality-loop

# Or via HTTP
curl -X POST https://your-project.supabase.co/functions/v1/weekly-reality-loop \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Run Validation Phases

Execute validation phases to prove various aspects:

```bash
# Phase 5: Money Reality
npx tsx scripts/validate-reality-phases.ts 5

# Phase 6: User Reality
npx tsx scripts/validate-reality-phases.ts 6

# Phase 7: Tenant Isolation
npx tsx scripts/validate-reality-phases.ts 7
```

Evidence files will be written to `docs/reality-system/evidence/`.

## View Metrics in Database

```sql
-- View all metrics
SELECT * FROM reality_metrics ORDER BY category, name;

-- View metrics by status
SELECT category, name, value, status, source 
FROM reality_metrics 
WHERE status = 'assumed';

-- View recent events
SELECT * FROM reality_events 
ORDER BY created_at DESC 
LIMIT 20;

-- View latest weekly snapshot
SELECT * FROM weekly_snapshots 
ORDER BY week_start DESC 
LIMIT 1;
```

## Update Metrics Manually

```sql
-- Update a metric
SELECT upsert_reality_metric(
  'revenue',           -- category
  'mrr',              -- name
  1000,               -- value
  'proven',           -- status
  'stripe_api',       -- source
  '{}'::jsonb         -- metadata
);

-- Record an event
SELECT record_reality_event(
  'failure',                    -- category
  'safe_mode_activated',        -- event_name
  'warning',                     -- severity
  '{"reason": "db_timeout"}'::jsonb  -- meta
);
```

## Schedule Automated Jobs

### Using Supabase Cron

Add to your Supabase dashboard under Database > Cron Jobs:

```sql
-- Collect metrics every hour
SELECT cron.schedule(
  'collect-reality-metrics',
  '0 * * * *',  -- Every hour
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/collect-reality-metrics',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
  );
  $$
);

-- Weekly loop every Monday at 9 AM UTC
SELECT cron.schedule(
  'weekly-reality-loop',
  '0 9 * * 1',  -- Monday at 9 AM
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/weekly-reality-loop',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
  );
  $$
);
```

### Using GitHub Actions

Create `.github/workflows/reality-system.yml`:

```yaml
name: Reality System

on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:

jobs:
  collect-metrics:
    runs-on: ubuntu-latest
    steps:
      - name: Collect Reality Metrics
        run: |
          curl -X POST ${{ secrets.SUPABASE_FUNCTION_URL }}/collect-reality-metrics \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

## Next Steps

1. ✅ System is operational
2. ⏳ Run `collect-reality-metrics` to populate initial metrics
3. ⏳ Execute validation phases 5-15
4. ⏳ Run weekly loop to generate first snapshot
5. ⏳ Review REALITY_REPORT.md for status

## Troubleshooting

### Metrics not updating

- Check that `collect-reality-metrics` function is running
- Verify database connection
- Check function logs in Supabase dashboard

### Weekly loop not running

- Verify cron job is scheduled
- Check function logs
- Manually trigger to test

### Dashboard shows ASSUMED metrics

- This is expected initially
- Run validation phases to prove metrics
- Metrics will update to PROVEN as evidence is collected

## Support

See `/docs/reality-system/README.md` for full documentation.
