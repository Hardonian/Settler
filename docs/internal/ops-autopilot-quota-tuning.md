# Quota Tuning Guide

**Purpose:** Tune tenant quotas based on actual usage patterns

## Current Default Quotas

```typescript
{
  requestsPerMinute: 100,
  jobsPerHour: 50,
  maxConcurrentJobs: 5,
  maxRecordsPerRun: 10000,
  maxExportSizeMB: 100,
}
```

---

## Quota Analysis Process

### Step 1: Collect Usage Data

Query usage events to understand actual patterns:

```sql
-- Requests per minute per tenant (last 7 days)
SELECT 
  tenant_id,
  DATE_TRUNC('minute', created_at) as minute,
  COUNT(*) as requests
FROM ops_events
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND event_type = 'api_request'
GROUP BY tenant_id, minute
ORDER BY requests DESC;

-- Jobs per hour per tenant (last 7 days)
SELECT 
  tenant_id,
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as jobs
FROM jobs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY tenant_id, hour
ORDER BY jobs DESC;

-- Concurrent jobs per tenant
SELECT 
  tenant_id,
  COUNT(*) as concurrent_jobs
FROM jobs
WHERE status IN ('queued', 'running')
GROUP BY tenant_id
ORDER BY concurrent_jobs DESC;

-- Records per run (p95)
SELECT 
  tenant_id,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY record_count) as p95_records
FROM reconciliation_runs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY tenant_id;
```

### Step 2: Identify Patterns

Look for:
- **Peak usage times** - When do tenants use most resources?
- **Usage distribution** - Are quotas evenly distributed or skewed?
- **Burst patterns** - Do tenants have occasional spikes?
- **Resource-intensive operations** - Which operations consume most resources?

### Step 3: Set Tier-Based Quotas

Based on analysis, set quotas per subscription tier:

```typescript
// packages/web/src/lib/containment/tenant-quotas.ts

const TIER_QUOTAS = {
  base: {
    requestsPerMinute: 50,
    jobsPerHour: 20,
    maxConcurrentJobs: 3,
    maxRecordsPerRun: 5000,
    maxExportSizeMB: 50,
  },
  pro: {
    requestsPerMinute: 200,
    jobsPerHour: 100,
    maxConcurrentJobs: 10,
    maxRecordsPerRun: 50000,
    maxExportSizeMB: 500,
  },
  enterprise: {
    requestsPerMinute: 1000,
    jobsPerHour: 500,
    maxConcurrentJobs: 50,
    maxRecordsPerRun: 500000,
    maxExportSizeMB: 5000,
  },
};
```

---

## Quota Tuning Strategies

### 1. Requests Per Minute

**Considerations:**
- API rate limits from external services (Stripe, Shopify, etc.)
- Database connection pool limits
- Cost per request

**Tuning:**
- Start conservative (50-100 req/min)
- Monitor for 429 (rate limit) responses
- Increase if < 1% of requests hit limits
- Decrease if > 5% of requests hit limits

**Formula:**
```
Optimal = (P95 requests per minute) * 1.5
```

### 2. Jobs Per Hour

**Considerations:**
- Background job processing capacity
- Cost per job execution
- User expectations (how often can they run jobs?)

**Tuning:**
- Base tier: 20-50 jobs/hour (1 job every 1-3 minutes)
- Pro tier: 100-200 jobs/hour (1 job every 18-30 seconds)
- Enterprise: Unlimited or very high (500+)

**Formula:**
```
Optimal = (Average jobs per hour) * 2
```

### 3. Max Concurrent Jobs

**Considerations:**
- Worker capacity
- Database connection limits
- Memory usage per job

**Tuning:**
- Base tier: 3-5 concurrent jobs
- Pro tier: 10-20 concurrent jobs
- Enterprise: 50+ concurrent jobs

**Formula:**
```
Optimal = (Worker capacity) / (Number of tenants per worker) * 0.8
```

### 4. Max Records Per Run

**Considerations:**
- Memory usage (records in memory)
- Processing time
- Database query limits

**Tuning:**
- Base tier: 5,000-10,000 records
- Pro tier: 50,000-100,000 records
- Enterprise: 500,000+ records

**Formula:**
```
Optimal = (Available memory per job) / (Memory per record) * 0.8
```

### 5. Max Export Size

**Considerations:**
- Storage costs
- Download time
- Browser memory limits

**Tuning:**
- Base tier: 50-100 MB
- Pro tier: 500 MB - 1 GB
- Enterprise: 5 GB+

---

## Monitoring Quota Effectiveness

### Metrics to Track

1. **Quota Hit Rate**
   ```sql
   SELECT 
     COUNT(*) FILTER (WHERE status_code = 429) as quota_hits,
     COUNT(*) as total_requests,
     (COUNT(*) FILTER (WHERE status_code = 429)::float / COUNT(*)) * 100 as hit_rate_pct
   FROM api_call_logs
   WHERE created_at >= NOW() - INTERVAL '24 hours';
   ```

2. **Quota Distribution**
   ```sql
   SELECT 
     tenant_id,
     COUNT(*) as requests,
     COUNT(*) FILTER (WHERE status_code = 429) as quota_hits
   FROM api_call_logs
   WHERE created_at >= NOW() - INTERVAL '24 hours'
   GROUP BY tenant_id
   ORDER BY quota_hits DESC;
   ```

3. **Peak Usage Times**
   ```sql
   SELECT 
     DATE_TRUNC('hour', created_at) as hour,
     COUNT(*) as requests,
     COUNT(DISTINCT tenant_id) as active_tenants
   FROM api_call_logs
   WHERE created_at >= NOW() - INTERVAL '7 days'
   GROUP BY hour
   ORDER BY requests DESC;
   ```

### Alert Thresholds

- **Quota Hit Rate > 5%** - Quotas too restrictive, consider increasing
- **Quota Hit Rate < 0.1%** - Quotas too permissive, consider decreasing
- **Single tenant > 50% of quota** - Potential abuse or need for upgrade

---

## Quota Override System

Allow manual overrides for specific tenants:

```typescript
// packages/web/src/lib/containment/tenant-quotas.ts

async function getTenantQuota(tenantId: string): Promise<TenantQuota> {
  // Check for manual override
  const override = await prisma.quotaOverride.findUnique({
    where: { tenantId },
  });
  
  if (override) {
    return override.quota;
  }
  
  // Get tier-based quota
  const subscription = await getSubscription(tenantId);
  return TIER_QUOTAS[subscription.tier];
}
```

---

## Gradual Rollout Strategy

1. **Week 1:** Set quotas to 2x current usage (very permissive)
2. **Week 2:** Reduce to 1.5x current usage
3. **Week 3:** Reduce to 1.2x current usage
4. **Week 4:** Set to final quotas based on P95 usage

Monitor quota hit rates at each step and adjust if needed.

---

## Cost Optimization

Quotas help control costs by:
- Preventing runaway jobs
- Limiting expensive operations
- Encouraging efficient usage patterns

**Cost per operation estimates:**
- API request: $0.0001 (database query + compute)
- Job execution: $0.001 (background processing)
- Export generation: $0.01 per MB (storage + compute)

**Example cost calculation:**
```
Base tier (50 req/min * 60 min * 24 hours * 30 days) = 2,160,000 requests/month
Cost = 2,160,000 * $0.0001 = $216/month per tenant
```

Adjust quotas to align with pricing tiers.

---

## Next Steps

1. Collect 7 days of usage data
2. Analyze patterns and set initial quotas
3. Monitor quota hit rates
4. Adjust quotas based on feedback
5. Implement tier-based quotas
6. Set up quota override system for exceptions
