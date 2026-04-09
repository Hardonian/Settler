# Admin Analytics Studio Runbook

## Overview

The Admin Analytics Studio provides Tableau-style pivot dashboards with self-fueling cost & usage intelligence. All metrics are derived from existing telemetry data without requiring paid APIs or manual data entry.

## Architecture

### Data Flow

1. **Telemetry Ingestion**: `ops_events` table captures all operational events
2. **Cost Derivation**: Cost Signal Engine derives cost estimates from events
3. **Daily Rollups**: Scheduled jobs aggregate data into daily rollups
4. **Analytics Queries**: Pivot Engine executes validated pivot queries
5. **Visualization**: Analytics Studio UI displays results

### Key Components

- **Cost Signal Engine** (`lib/services/cost-signal-engine.ts`): Derives cost estimates from telemetry
- **Triage Engine** (`lib/services/triage-engine.ts`): Automatically triages support tickets
- **Pivot Engine** (`lib/services/pivot-engine.ts`): Executes pivot queries with validation
- **Analytics Studio** (`components/console/AnalyticsStudio.tsx`): UI for pivot dashboards

## Cost Derivation Methodology

### Principles

1. **Never depend on paid APIs**: All costs are derived from existing telemetry
2. **Transparent heuristics**: Every estimate includes methodology and confidence
3. **Graceful degradation**: UI explains when data is unavailable or inferred

### Cost Sources

#### Vercel (Infrastructure)

- **Edge Requests**: Counted from `ops_events` where `event_type = 'api_request'` and `category = 'infrastructure'`
- **Cost**: $0.10 per million requests (baseline in `ops/cost_baselines.ts`)
- **Confidence**: 0.7 (estimated from Vercel pricing)
- **Method**: `request_count_from_ops_events`

#### Supabase (Database)

- **Queries**: Estimated as ~5 queries per API request
- **Cost**: $0.001 per 1000 queries (estimated)
- **Confidence**: 0.6 (lower due to estimation)
- **Method**: `estimated_query_count_from_api_requests`

#### Webhooks

- **Deliveries**: Counted from `ops_events` where `event_type = 'webhook_delivery'`
- **Cost**: $0.00001 per delivery (mostly compute)
- **Confidence**: 0.6
- **Method**: `webhook_count_from_ops_events`

#### Email

- **Sends**: Counted from email service logs (if available)
- **Cost**: $0.0001 per email (e.g., SendGrid, Resend)
- **Confidence**: 0.8
- **Method**: `email_count_from_logs`

### Confidence Levels

- **0.9-1.0**: Direct measurement from billing APIs
- **0.7-0.8**: Estimated from known pricing with good accuracy
- **0.5-0.6**: Estimated from heuristics (e.g., queries per request)
- **0.0-0.4**: Very rough estimates or missing data

### Updating Baselines

Edit `ops/cost_baselines.ts` to update cost estimates. Baselines are version-controlled and should be updated when:

- Actual billing data becomes available
- Pricing changes are announced
- More accurate measurement methods are implemented

## Daily Rollup Process

### Schedule

The daily rollup runs automatically via cron job at `/api/cron/daily-cost-rollup`.

### Process

1. **Derive Cost Inputs**: Process `ops_events` for the target date
2. **Calculate Rollups**: Aggregate costs by source and category
3. **Store Results**: Save to `ops_cost_daily_rollups` and `ops_usage_daily_rollups`

### Manual Trigger

```bash
curl -X POST https://your-domain.com/api/cron/daily-cost-rollup \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-02-01"}'
```

## Analytics Datasets

### Usage Dataset

- **Source**: `ops_usage_daily_rollups`, `ops_events`
- **Dimensions**: date, org, route, user, category
- **Measures**: requests, jobs, events, errors, response_time
- **Confidence**: High (direct measurement)

### Support Dataset

- **Source**: `ops_support_tickets`, `support_ticket_triage`
- **Dimensions**: date, org, severity, status, category
- **Measures**: tickets, triage_score, resolution_time
- **Confidence**: High (direct measurement)

### Cost Dataset

- **Source**: `ops_cost_daily_rollups`
- **Dimensions**: date, source, org
- **Measures**: total_cost, infra_cost, data_cost, messaging_cost
- **Confidence**: Variable (see derivation methodology)
- **Indicator**: Shows "Derived" badge in UI

### Revenue Dataset

- **Source**: Stripe webhooks or `ops_revenue_inputs`
- **Dimensions**: date, org, source
- **Measures**: amount, mrr, arr
- **Confidence**: High if from Stripe, Medium if manual

### Efficiency Dataset

- **Source**: Joins of usage + cost + support
- **Dimensions**: date, org
- **Measures**: cost_per_org, cost_per_user, cost_per_request, tickets_per_org
- **Confidence**: Inherits from source datasets

## Support Autopilot

### Triage Rules

The triage engine applies deterministic rules:

1. **Critical**: Related to critical system errors
2. **High**: Contains urgent keywords or related to failed webhooks
3. **Medium**: Related to recent errors or user has multiple tickets
4. **Low**: Default fallback

### Correlation

Tickets are automatically correlated with:

- Recent errors (`ops_errors`)
- Failed jobs (`ops_jobs`)
- Failed webhooks (`ops_webhooks`)
- User history

### Manual Override

Admins can manually triage tickets via `/console/support`.

## Troubleshooting

### No Cost Data

**Symptom**: Cost rollups show $0 or missing data

**Causes**:

- No `ops_events` data for the date
- Rollup job hasn't run
- Cost derivation failed

**Solutions**:

1. Check `ops_events` table for data
2. Manually trigger rollup: `/api/cron/daily-cost-rollup`
3. Check logs for derivation errors

### Low Confidence Scores

**Symptom**: Cost estimates show low confidence (<0.5)

**Causes**:

- Using estimated heuristics (e.g., queries per request)
- Missing source data

**Solutions**:

1. Improve telemetry coverage
2. Update baselines with actual billing data
3. Implement direct measurement where possible

### Pivot Query Errors

**Symptom**: "Invalid dimension" or "Invalid measure" errors

**Causes**:

- Dimension/measure not in dataset schema
- Too many dimensions (>2 rows or >2 columns)

**Solutions**:

1. Check dataset schema: `/api/console/analytics/datasets`
2. Reduce number of dimensions
3. Verify dimension/measure names match schema

## Security

### RLS Policies

All analytics tables enforce Row Level Security:

- Admin-only access for cost/usage data
- Users can view their own tickets
- Saved views scoped by creator or public flag

### API Security

- All analytics endpoints require admin authentication
- Pivot queries validated server-side
- Parameterized queries prevent SQL injection

## Monitoring

### Key Metrics

- Daily rollup success rate
- Cost derivation confidence scores
- Pivot query performance
- Support ticket triage accuracy

### Alerts

Set up alerts for:

- Rollup job failures
- Cost derivation errors
- High error rates in triage

## Future Enhancements

- Direct Stripe integration for revenue
- Real-time cost derivation (not just daily)
- ML-based triage improvements
- Advanced chart visualizations
- Custom dataset definitions
