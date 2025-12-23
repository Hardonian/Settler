# Ops Autopilot Monitoring Guide

**Purpose:** Set up monitoring and alerting for reliability metrics

## Monitoring Endpoints

### 1. Console Health (`/api/console/health`)

**Access:** Authenticated users  
**Purpose:** General system health

```bash
curl https://your-domain.com/api/console/health
```

**Response:**
```json
{
  "health": {
    "overall": "healthy",
    "checks": [
      { "service": "supabase", "status": "healthy", "latency": 45 },
      { "service": "database", "status": "healthy", "latency": 120 },
      ...
    ],
    "timestamp": "2025-01-27T12:00:00Z"
  },
  "alerts": [],
  "activeAlerts": []
}
```

### 2. Admin Health (`/api/admin/monitoring/health`)

**Access:** Super admin only  
**Purpose:** Detailed reliability metrics

```bash
curl https://your-domain.com/api/admin/monitoring/health \
  -H "Authorization: Bearer <admin-token>"
```

**Response:**
```json
{
  "status": "healthy",
  "metrics": {
    "active_customers": 150,
    "active_subscriptions": 120,
    "open_support_tickets": 3,
    "sla_violations": 0
  },
  "reliability": {
    "operationStats": [
      {
        "operation": "sync:stripe",
        "totalRequests": 1000,
        "successCount": 980,
        "failureCount": 20,
        "successRate": 0.98,
        "avgDurationMs": 450,
        "p95DurationMs": 1200,
        "retryCount": 15,
        "deadLetterCount": 2
      },
      ...
    ],
    "adapterErrorRates": [
      { "adapterType": "stripe", "errorRate": 0.02, "totalRequests": 500 },
      { "adapterType": "shopify", "errorRate": 0.01, "totalRequests": 300 }
    ],
    "deadLetterCount": 5,
    "latestFailures": [
      {
        "operation": "sync:stripe",
        "error": "Rate limit exceeded",
        "timestamp": "2025-01-27T11:55:00Z"
      },
      ...
    ]
  }
}
```

---

## Key Metrics to Monitor

### 1. Success Rates

**Threshold:** < 95% success rate = degraded  
**Alert:** High priority

Monitor per operation:
- `sync:stripe`
- `sync:shopify`
- `receipt:parse`
- `reconciliation:run`
- `export:generate`

### 2. Dead-Letter Jobs

**Threshold:** > 0 dead-letter jobs = degraded  
**Alert:** Medium priority

Dead-letter jobs indicate permanent failures that need manual intervention.

### 3. Adapter Error Rates

**Threshold:** > 10% error rate = degraded  
**Alert:** High priority

Monitor external adapter health (Stripe, Shopify, etc.).

### 4. Retry Counts

**Threshold:** > 5% retry rate = warning  
**Alert:** Low priority

High retry rates indicate transient failures or rate limiting.

### 5. P95 Duration

**Threshold:** > 5 seconds = degraded  
**Alert:** Medium priority

Slow operations degrade user experience.

### 6. Stuck Jobs

**Threshold:** > 5 stuck jobs (>10 minutes) = degraded  
**Alert:** High priority

Stuck jobs indicate worker issues or deadlocks.

---

## Alerting Setup

### Option 1: Webhook-Based Alerts

Create a webhook endpoint that receives health check results:

```typescript
// packages/web/src/app/api/webhooks/health-alert/route.ts
export async function POST(request: NextRequest) {
  const health = await performHealthCheck();
  
  if (health.overall === 'unhealthy') {
    // Send alert to Slack, PagerDuty, etc.
    await sendAlert({
      severity: 'critical',
      message: 'System health degraded',
      details: health,
    });
  }
  
  return NextResponse.json({ received: true });
}
```

### Option 2: Scheduled Health Checks

Set up a cron job to check health periodically:

```typescript
// packages/web/src/app/api/cron/health-check/route.ts
export async function POST(request: NextRequest) {
  const health = await performHealthCheck();
  const reliability = await getReliabilityMetrics();
  
  // Check thresholds
  const hasHighErrorRate = reliability.operationStats.some(
    (stats) => stats.successRate < 0.95
  );
  
  if (hasHighErrorRate) {
    await sendAlert({
      severity: 'high',
      message: 'High error rate detected',
      details: reliability,
    });
  }
  
  return NextResponse.json({ checked: true });
}
```

### Option 3: External Monitoring (Recommended)

Use external monitoring services:

**Vercel Cron:**
```json
{
  "crons": [
    {
      "path": "/api/cron/health-check",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Uptime Robot / Pingdom:**
- Monitor `/api/console/health` endpoint
- Alert on non-200 responses
- Alert on degraded health status

**Datadog / New Relic:**
- Monitor custom metrics
- Set up dashboards for reliability metrics
- Configure alerts based on thresholds

---

## Dashboard Setup

### Admin Dashboard

Create an admin dashboard page that displays reliability metrics:

```typescript
// packages/web/src/app/admin/reliability/page.tsx
export default async function ReliabilityPage() {
  const health = await fetch('/api/admin/monitoring/health');
  const data = await health.json();
  
  return (
    <div>
      <h1>Reliability Metrics</h1>
      <OperationStatsTable stats={data.reliability.operationStats} />
      <AdapterErrorRatesChart rates={data.reliability.adapterErrorRates} />
      <DeadLetterJobsList count={data.reliability.deadLetterCount} />
      <LatestFailuresList failures={data.reliability.latestFailures} />
    </div>
  );
}
```

### Grafana Dashboard (Optional)

If using Grafana, create a dashboard with:

1. **Success Rate Panel**
   - Query: `avg(success_rate) by (operation)`
   - Threshold: < 0.95

2. **Dead-Letter Jobs Panel**
   - Query: `sum(dead_letter_count)`
   - Threshold: > 0

3. **Adapter Error Rates Panel**
   - Query: `avg(error_rate) by (adapter_type)`
   - Threshold: > 0.10

4. **P95 Duration Panel**
   - Query: `p95(duration_ms) by (operation)`
   - Threshold: > 5000ms

---

## Alert Thresholds Summary

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Success Rate | < 98% | < 95% | Investigate failures |
| Dead-Letter Jobs | > 0 | > 10 | Manual intervention |
| Adapter Error Rate | > 5% | > 10% | Check external API |
| Retry Rate | > 3% | > 5% | Check rate limits |
| P95 Duration | > 3s | > 5s | Optimize operations |
| Stuck Jobs | > 3 | > 5 | Restart workers |

---

## Log Aggregation

### Structured Logging

All logs include:
- `correlationId` - Request trace ID
- `tenantId` - Tenant identifier
- `operation` - Operation name
- `durationMs` - Request duration
- `status` - Success/failure status

### Log Storage Options

1. **Console Logging** (default)
   - JSON-structured logs
   - Can be collected by log aggregation services

2. **Database Storage** (optional)
   - Store in `ops_events` table
   - Queryable for analysis

3. **External Services**
   - Sentry (errors)
   - Datadog (metrics)
   - Logtail / LogDNA (logs)

---

## Next Steps

1. Set up external monitoring (Uptime Robot, etc.)
2. Configure alerting channels (Slack, PagerDuty, email)
3. Create admin dashboard for reliability metrics
4. Set up log aggregation service
5. Configure Grafana dashboards (optional)
