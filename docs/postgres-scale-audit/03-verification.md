# Verification & Testing Guide

**Date**: 2026-01-24
**Purpose**: Verify all PostgreSQL scaling optimizations are working correctly

---

## Pre-Deployment Checklist

### 1. Code Quality Checks

```bash
# From repository root
cd /home/user/Settler

# Lint all code
npm run lint

# Type check
npm run typecheck

# Build packages
npm run build

# Run tests (if available)
npm run test
```

**Expected**: All checks pass with no errors

---

### 2. Database Migration Verification

#### A. Validate Migration Syntax

```bash
# Check migration file exists
ls -la supabase/migrations/20260124000000_postgres_scaling_optimization.sql

# Validate SQL syntax (dry-run)
# Note: This command may vary based on your PostgreSQL setup
psql $DATABASE_URL -f supabase/migrations/20260124000000_postgres_scaling_optimization.sql --dry-run
```

#### B. Apply Migration (Staging First)

```bash
# Option 1: Using Supabase CLI
supabase db push

# Option 2: Using direct SQL
psql $DATABASE_URL -f supabase/migrations/20260124000000_postgres_scaling_optimization.sql

# Option 3: Using npm script
npm run db:migrate:apply
```

#### C. Verify Indexes Were Created

```sql
-- Connect to database
psql $DATABASE_URL

-- Check new indexes exist
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid::regclass)) AS index_size
FROM pg_stat_user_indexes
WHERE indexname LIKE 'idx_%_account_%'
   OR indexname LIKE 'idx_%_tenant_%'
ORDER BY tablename, indexname;

-- Expected: 10+ new indexes starting with idx_
```

#### D. Verify VACUUM Settings

```sql
SELECT
  relname AS table_name,
  reloptions
FROM pg_class
WHERE relname IN ('usage_events', 'api_call_logs', 'stripe_events', 'usage_counters')
  AND relkind = 'r';

-- Expected: autovacuum_vacuum_scale_factor=0.05 for high-write tables
```

#### E. Verify Monitoring Views

```sql
-- Test index usage view
SELECT * FROM vw_index_usage LIMIT 5;

-- Test table bloat view
SELECT * FROM vw_table_bloat LIMIT 5;

-- Expected: Both views return results without errors
```

---

## Post-Deployment Verification

### 3. Query Gateway Smoke Tests

#### A. Test Timeout Enforcement

```typescript
// In a Node.js console or test file
import { executePrismaQuery } from '@/lib/db/query-gateway';

// This should timeout after 1 second
try {
  await executePrismaQuery(
    () => new Promise((resolve) => setTimeout(resolve, 2000)),
    { timeout: 1000, queryName: 'test_timeout' }
  );
  console.error('❌ Timeout did not work');
} catch (error) {
  console.log('✅ Timeout working:', error.message);
}
```

#### B. Test Row Limit Enforcement

```typescript
import { findMany } from '@/lib/db/query-gateway';

// This should truncate to 10 rows
const { data, meta } = await findMany(
  () => prisma.usageEvent.findMany({ take: 1000 }),
  { limit: 10, queryName: 'test_limit' }
);

console.log('Returned rows:', data.length);
console.log('Meta:', meta);
// Expected: data.length === 10, meta.rowCount === 10
```

#### C. Test Caching (Requires Redis)

```typescript
import { executePrismaQuery } from '@/lib/db/query-gateway';

// First query (cache miss)
const { meta: meta1 } = await executePrismaQuery(
  () => prisma.tenant.findFirst(),
  { cacheTTL: 60, cacheKey: 'test_cache', queryName: 'test_cache' }
);

console.log('First query cache hit:', meta1.cacheHit); // Expected: false

// Second query (cache hit)
const { meta: meta2 } = await executePrismaQuery(
  () => prisma.tenant.findFirst(),
  { cacheTTL: 60, cacheKey: 'test_cache', queryName: 'test_cache' }
);

console.log('Second query cache hit:', meta2.cacheHit); // Expected: true
```

---

### 4. Write Buffer Smoke Tests

#### A. Test Buffered Write

```typescript
import { bufferUsageEvent, flushUsageEvents } from '@/lib/db/write-buffer';

// Buffer an event
await bufferUsageEvent({
  billingAccountId: 'test-account-id',
  eventType: 'test_event',
  quantity: 1,
  timestamp: new Date(),
});

console.log('✅ Event buffered (non-blocking)');

// Manually flush
await flushUsageEvents();

console.log('✅ Buffer flushed');

// Verify event was written
const events = await prisma.usageEvent.findMany({
  where: { eventType: 'test_event' },
  orderBy: { timestamp: 'desc' },
  take: 1,
});

console.log('Event in DB:', events.length > 0 ? '✅' : '❌');
```

#### B. Test Graceful Degradation (No Redis)

```typescript
// Temporarily disable Redis by setting REDIS_URL to invalid
process.env.REDIS_URL = 'invalid';

// This should fall back to sync write
await bufferUsageEvent({
  billingAccountId: 'test-account-id',
  eventType: 'test_fallback',
  quantity: 1,
  timestamp: new Date(),
});

// Verify immediate write
const events = await prisma.usageEvent.findMany({
  where: { eventType: 'test_fallback' },
});

console.log('Fallback write:', events.length > 0 ? '✅' : '❌');

// Restore Redis URL
process.env.REDIS_URL = 'your-redis-url';
```

---

### 5. Observability Smoke Tests

#### A. Test Query Metrics Collection

```typescript
import { getQueryMetricsSummary, recordQueryMetric } from '@/lib/db/observability';

// Record some test metrics
for (let i = 0; i < 10; i++) {
  recordQueryMetric({
    queryName: 'test_query',
    duration: Math.random() * 1000,
    rowCount: 100,
    cacheHit: i % 2 === 0,
    error: false,
    timestamp: new Date(),
  });
}

// Get summary
const summary = getQueryMetricsSummary(10);

console.log('Query metrics:', {
  total: summary.total,
  avgDuration: summary.avgDuration,
  p95Duration: summary.p95Duration,
  cacheHits: summary.cacheHits,
});

// Expected: total: 10, avgDuration: ~500, cacheHits: 5
```

#### B. Test Slow Query Detection

```typescript
import { recordQueryMetric, getSlowQueryAlerts } from '@/lib/db/observability';

// Record a slow query
recordQueryMetric({
  queryName: 'slow_test_query',
  duration: 2000, // 2 seconds (exceeds 1s threshold)
  rowCount: 1000,
  cacheHit: false,
  error: false,
  timestamp: new Date(),
});

// Get alerts
const alerts = getSlowQueryAlerts(5);

console.log('Slow query alerts:', alerts);
// Expected: alerts.length > 0, alerts[0].query === 'slow_test_query'
```

#### C. Test Connection Pool Health

```typescript
import { getConnectionPoolMetrics } from '@/lib/db/observability';

const metrics = await getConnectionPoolMetrics();

console.log('Connection pool health:', {
  healthy: metrics.healthy,
  timestamp: metrics.timestamp,
});

// Expected: healthy: true
```

---

### 6. Index Performance Verification

#### A. Test Usage Events Query (Composite Index)

```sql
-- Before: Full table scan
EXPLAIN ANALYZE
SELECT *
FROM usage_events
WHERE billing_account_id = 'test-account-id'
  AND event_type = 'api_call'
ORDER BY timestamp DESC
LIMIT 100;

-- Expected: "Index Scan using idx_usage_events_account_type_timestamp"
-- Planning time: <5ms, Execution time: <50ms
```

#### B. Test API Call Logs Query (Composite Index)

```sql
EXPLAIN ANALYZE
SELECT *
FROM api_call_logs
WHERE tenant_id = 'test-tenant-id'
  AND method = 'GET'
  AND path LIKE '/api/console%'
ORDER BY created_at DESC
LIMIT 100;

-- Expected: "Index Scan using idx_api_call_logs_tenant_method_path_created"
-- Planning time: <5ms, Execution time: <50ms
```

#### C. Test Error Tracking Query (Partial Index)

```sql
EXPLAIN ANALYZE
SELECT *
FROM api_call_logs
WHERE tenant_id = 'test-tenant-id'
  AND error IS NOT NULL
ORDER BY created_at DESC
LIMIT 50;

-- Expected: "Index Scan using idx_api_call_logs_errors_by_tenant"
-- Planning time: <5ms, Execution time: <20ms (partial index is smaller)
```

---

### 7. Load Testing (Optional but Recommended)

#### A. Simulate High Query Load

```bash
# Using Apache Bench (ab) or similar
ab -n 1000 -c 10 http://localhost:3000/api/console/usage

# Expected: <1% error rate, p95 latency <500ms
```

#### B. Simulate High Write Load

```bash
# Using custom script
node scripts/load-test-writes.ts

# Expected: >500 writes/sec, no pool exhaustion errors
```

#### C. Monitor During Load

```sql
-- In a separate terminal, monitor active connections
SELECT
  state,
  COUNT(*) AS connection_count
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state;

-- Expected: Active connections < 15 (out of 20 max)
```

---

## Health Check Endpoint Verification

### 8. Test Admin Health Endpoint

```bash
curl http://localhost:3000/api/admin/health | jq
```

**Expected Response**:
```json
{
  "status": "healthy",
  "database": {
    "connectionPool": {
      "healthy": true,
      "timestamp": "2026-01-24T..."
    },
    "queryMetrics": {
      "total": 1000,
      "errors": 0,
      "cacheHits": 600,
      "avgDuration": 50,
      "p95Duration": 200,
      "slowQueries": 0
    },
    "tableBloat": [
      {
        "tableName": "usage_events",
        "deadRowPercentage": 3.5,
        "lastAutovacuum": "2026-01-24T..."
      }
    ],
    "indexUsage": [...]
  }
}
```

---

## Rollback Verification

### 9. Test Rollback Procedure

```sql
-- Drop one index to test rollback
DROP INDEX CONCURRENTLY IF EXISTS idx_usage_events_account_type_timestamp;

-- Verify it's gone
SELECT indexname FROM pg_indexes WHERE indexname = 'idx_usage_events_account_type_timestamp';
-- Expected: 0 rows

-- Re-create it
CREATE INDEX CONCURRENTLY idx_usage_events_account_type_timestamp
ON usage_events (billing_account_id, event_type, timestamp DESC)
WHERE aggregated = false;

-- Verify it's back
SELECT indexname FROM pg_indexes WHERE indexname = 'idx_usage_events_account_type_timestamp';
-- Expected: 1 row
```

---

## Monitoring Checklist (First 48 Hours)

### 10. Post-Deployment Monitoring

- [ ] Check error logs for any database-related errors
- [ ] Monitor p95 latency (should decrease by 5-10x)
- [ ] Monitor cache hit rate (should reach 60-80% within 1 hour)
- [ ] Monitor slow query alerts (should be <5/day)
- [ ] Monitor table bloat (should stabilize or decrease)
- [ ] Monitor connection pool saturation (should stay <75%)
- [ ] Verify no increase in 500 errors
- [ ] Verify API response times improved

### Automated Monitoring Script

```bash
#!/bin/bash
# Monitor database health every minute for 1 hour

for i in {1..60}; do
  echo "=== Check $i at $(date) ==="

  # Check health endpoint
  curl -s http://localhost:3000/api/admin/health | jq '.database.queryMetrics | { p95Duration, slowQueries, cacheHits }'

  # Check for errors
  echo "Recent errors:"
  curl -s http://localhost:3000/api/admin/health | jq '.database.queryMetrics.errors'

  sleep 60
done
```

---

## Success Criteria

### Metrics to Track

| Metric | Before | After (Target) | Status |
|--------|--------|----------------|--------|
| P95 Query Latency | 500ms | <100ms | ⏳ |
| Slow Queries/Day | 10-50 | <5 | ⏳ |
| Cache Hit Rate | 0% | >60% | ⏳ |
| API Response Time | 200-500ms | <100ms | ⏳ |
| Error Rate | <0.1% | <0.1% | ⏳ |
| Connection Pool Saturation | 60-80% | <50% | ⏳ |

**Deployment Success**: All metrics meet or exceed targets after 48 hours

---

## Troubleshooting

### Common Issues

#### Issue: Index creation fails
```sql
-- Check for locks
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Kill blocking queries
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE ...;

-- Retry index creation
CREATE INDEX CONCURRENTLY ...;
```

#### Issue: Redis connection fails
```typescript
// Write buffer will automatically fall back to sync writes
// Check logs for: "[Write Buffer] Redis initialization failed"

// Verify Redis URL
console.log(process.env.REDIS_URL);

// Test Redis connection manually
import { Redis } from '@upstash/redis';
const redis = new Redis({ url: process.env.REDIS_URL });
await redis.ping(); // Should return 'PONG'
```

#### Issue: Query gateway causes timeouts
```typescript
// Increase timeout temporarily
const { data } = await executePrismaQuery(
  () => expensiveQuery(),
  { timeout: 120000 } // 2 minutes
);

// Or disable timeout for specific query
const { data } = await executePrismaQuery(
  () => expensiveQuery(),
  { timeout: Number.MAX_SAFE_INTEGER }
);
```

---

## Sign-Off Checklist

Before merging to production:

- [ ] All pre-deployment checks pass
- [ ] Migration applied successfully (staging + production)
- [ ] All smoke tests pass
- [ ] Load tests show no regressions
- [ ] Health endpoint shows improved metrics
- [ ] No increase in error rates
- [ ] Rollback procedure tested and documented
- [ ] Team trained on new monitoring views
- [ ] On-call runbook updated (see `04-runbook.md`)

**Approved by**: ___________ **Date**: ___________

**Continue to**: [04-runbook.md](./04-runbook.md)
