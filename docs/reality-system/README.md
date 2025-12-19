# Reality System

The Reality System is a closed-loop truth-tracking and governance system that measures, exposes, and enforces execution across all aspects of the Settler SaaS platform.

## Philosophy

**NO CLAIM IS TRUE WITHOUT EVIDENCE.**
**ANY UNPROVEN AREA MUST BE LABELED AS SUCH.**
**EVERY CLAIM MUST MAP TO A METRIC, EVENT, LOG, OR TRANSACTION.**
**THE SAME DATA MUST POWER INTERNAL, BOARD, AND EXTERNAL VIEWS.**

## Architecture

### Canonical Data Layer

All reality metrics are stored in four canonical tables:

1. **reality_metrics** - Single source of truth for all metrics
   - `category`: revenue, user, tenant_isolation, failure, deployment, gtm, admin
   - `name`: specific metric name (e.g., 'mrr', 'dau', 'rls_violations')
   - `value`: JSONB flexible value storage
   - `status`: 'proven', 'assumed', or 'broken'
   - `source`: where the metric comes from
   - `last_updated`: timestamp

2. **reality_events** - Canonical log of all reality-impacting events
   - `category`: event category
   - `event_name`: specific event name
   - `severity`: 'critical', 'warning', 'info'
   - `meta`: event-specific data

3. **audit_logs** - Canonical audit trail for all actions
   - Enhanced with tenant_id, actor_id, action, target, meta

4. **weekly_snapshots** - Weekly snapshots for trend analysis
   - `week_start`: Monday of the week
   - `summary`: summary statistics
   - `metrics_snapshot`: full snapshot of all metrics
   - `delta_summary`: week-over-week changes
   - `risks`: identified risks
   - `required_actions`: actions for next week

### Dashboards

1. **Reality Dashboard** (`/console/reality`)
   - Internal ops view
   - Shows all metrics with PROVEN/ASSUMED/BROKEN status
   - Admin-only access

2. **Board/Investor Dashboard** (`/investor/reality`)
   - Executive-level KPIs
   - High signal, low noise
   - Suitable for investor presentations
   - Read-only, privileged access

3. **Public Trust Page** (`/trust`)
   - Public-facing trust metrics
   - Reads from canonical data
   - Shows uptime, incidents, compliance actions
   - Never claims compliance without evidence

### Automated Jobs

1. **collect-reality-metrics** (Supabase Edge Function)
   - Runs periodically (hourly recommended)
   - Collects metrics from actual data sources
   - Updates reality_metrics table
   - Marks metrics as PROVEN when backed by real data

2. **weekly-reality-loop** (Supabase Edge Function)
   - Runs weekly (Monday mornings)
   - Snapshots all metrics
   - Calculates week-over-week deltas
   - Flags risks and regressions
   - Generates WEEKLY_REALITY_REPORT.md
   - Stores snapshot in weekly_snapshots table

## Status Values

- **PROVEN**: Metric is backed by real data from verified sources
- **ASSUMED**: Metric is estimated or placeholder (needs verification)
- **BROKEN**: Data source failed or metric cannot be calculated

## Invariants

These invariants MUST be true at all times:

1. No internal links or routes may fail silently
2. `/console` and `/playground` must NEVER hard-500 in preview or production
3. Public minimal mode must work without auth or env stability
4. Authenticated mode must elevate cleanly
5. Paid mode must gate features AND survive billing failures
6. Tenant isolation must be enforced at the database (RLS), not assumed
7. One canonical data source powers all dashboards
8. Any metric without data must be explicitly labeled UNPROVEN
9. Weekly execution must occur automatically or be flagged as BROKEN

## Usage

### Viewing Metrics

- Internal ops: Navigate to `/console/reality` (admin required)
- Board/Investor: Navigate to `/investor/reality` (privileged access)
- Public: Navigate to `/trust` (public access)

### Collecting Metrics

Metrics are collected automatically via the `collect-reality-metrics` function. To trigger manually:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/collect-reality-metrics \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Running Weekly Loop

The weekly loop runs automatically via cron. To trigger manually:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/weekly-reality-loop \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Adding New Metrics

To add a new metric, use the `upsert_reality_metric` function:

```sql
SELECT upsert_reality_metric(
  'category',           -- e.g., 'revenue', 'user'
  'metric_name',        -- e.g., 'mrr', 'dau'
  'value'::jsonb,       -- the metric value
  'proven',             -- or 'assumed' or 'broken'
  'data_source',        -- where this comes from
  '{}'::jsonb           -- optional metadata
);
```

### Recording Events

To record a reality event:

```sql
SELECT record_reality_event(
  'category',           -- e.g., 'failure', 'security'
  'event_name',         -- e.g., 'safe_mode_activated'
  'severity',           -- 'critical', 'warning', or 'info'
  '{}'::jsonb           -- optional metadata
);
```

## Validation Phases

The Reality System includes validation phases to prove various aspects:

- Phase 5: Money Reality (Stripe lifecycle)
- Phase 6: User Reality (onboarding, time-to-value)
- Phase 7: Tenant Isolation (attack tests)
- Phase 8: Failure Injection (degraded mode)
- Phase 9: Deployment Reality (multi-platform)
- Phase 10: Admin Self-Sufficiency
- Phase 11: Economic Reality (unit economics)
- Phase 12: Legal & Risk Reality (compliance)
- Phase 13: GTM Reality (conversion flow)
- Phase 14: Competitive & Defensibility
- Phase 15: Investor Hostile Review

See individual phase documentation in `/docs/reality-system/phases/`.

## Files

- `/supabase/migrations/20260203000000_reality_system_canonical_data.sql` - Database schema
- `/supabase/functions/collect-reality-metrics/index.ts` - Metric collection function
- `/supabase/functions/weekly-reality-loop/index.ts` - Weekly snapshot function
- `/packages/web/src/app/console/reality/page.tsx` - Internal dashboard
- `/packages/web/src/app/investor/reality/page.tsx` - Investor dashboard
- `/packages/web/src/app/trust/page.tsx` - Public trust page
- `/packages/web/src/app/api/console/reality/route.ts` - Internal API
- `/packages/web/src/app/api/investor/reality/route.ts` - Investor API
- `/packages/web/src/app/api/public/reality/route.ts` - Public API

## Status

The Reality System is operational. Metrics are being collected and dashboards are available. Some metrics are still marked as ASSUMED and will be updated as validation phases complete.
