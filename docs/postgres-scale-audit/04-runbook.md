# PostgreSQL Scaling Operations Runbook

**Date**: 2026-01-24
**Audience**: On-call engineers, DevOps, SREs
**Purpose**: Operational playbook for database performance incidents

---

## Quick Reference

### Emergency Contacts

- **Database Admin**: Check Supabase dashboard
- **On-Call**: Check PagerDuty/Opsgenie
- **Escalation**: CTO/Tech Lead

### Key Endpoints

- **Health Check**: `/api/admin/health`
- **Metrics**: `/api/admin/metrics`
- **Database Dashboard**: Supabase Dashboard → Database

### Key Metrics

- **P95 Query Latency**: Target <100ms, Alert >500ms
- **Connection Pool Saturation**: Target <75%, Alert >90%
- **Slow Queries**: Target <5/day, Alert >20/day
- **Cache Hit Rate**: Target >60%, Alert <30%
- **Error Rate**: Target <0.1%, Alert >1%

---

## Incident Response Procedures

### 1. Database Slow / High Latency

**Symptoms**:

- API response times >2s
- Users reporting slow page loads
- P95 latency >1s

**Triage Steps**:

```bash
# 1. Check health endpoint
curl https://api.settler.dev/api/admin/health | jq '.database'

# 2. Check for slow queries
curl https://api.settler.dev/api/admin/health | jq '.database.slowQueries'

# 3. Check connection pool saturation
# (Note: Limited visibility in Prisma, check Supabase dashboard)
```

**Diagnosis**:

| Symptom                                | Likely Cause                | Action                                       |
| -------------------------------------- | --------------------------- | -------------------------------------------- |
| Many slow queries (>20)                | N+1 query regression        | Identify query, optimize or add index        |
| High p95 latency, low cache hit (<30%) | Cache not working           | Check Redis connection, restart if needed    |
| High connection pool usage (>90%)      | Connection leak or storm    | Restart app, investigate connection handling |
| Specific query consistently slow       | Missing index or table scan | Run EXPLAIN ANALYZE, add index               |

**Resolution Steps**:

#### A. Identify Slow Query

```sql
-- Connect to database
psql $DATABASE_URL

-- Check pg_stat_statements (if enabled)
SELECT
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check monitoring views
SELECT * FROM vw_index_usage WHERE usage_category = 'UNUSED';
```

#### B. Optimize Query

```sql
-- Run EXPLAIN ANALYZE on slow query
EXPLAIN ANALYZE SELECT ...;

-- Look for:
-- - "Seq Scan" (bad, should be "Index Scan")
-- - "Execution Time" >1000ms
-- - "Planning Time" >100ms

-- Add missing index
CREATE INDEX CONCURRENTLY idx_new_index ON table_name (column_name);
```

#### C. Restart Services (if needed)

```bash
# Restart Next.js app (Vercel)
vercel redeploy --force

# Restart background workers (if applicable)
# ... depends on your setup
```

---

### 2. Connection Pool Exhausted

**Symptoms**:

- Errors: "Connection pool timeout"
- Errors: "Too many connections"
- API returning 500 errors

**Triage Steps**:

```bash
# 1. Check active connections
psql $DATABASE_URL -c "
SELECT
  state,
  COUNT(*) AS count
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state;
"

# 2. Check for long-running queries
psql $DATABASE_URL -c "
SELECT
  pid,
  state,
  query,
  NOW() - query_start AS duration
FROM pg_stat_activity
WHERE state = 'active'
  AND NOW() - query_start > INTERVAL '5 minutes'
ORDER BY duration DESC;
"
```

**Resolution Steps**:

#### A. Kill Long-Running Queries

```sql
-- Identify long-running queries
SELECT
  pid,
  usename,
  application_name,
  state,
  query,
  NOW() - query_start AS duration
FROM pg_stat_activity
WHERE state = 'active'
  AND NOW() - query_start > INTERVAL '5 minutes'
ORDER BY duration DESC;

-- Kill specific query
SELECT pg_terminate_backend(pid);

-- Kill all idle connections (use with caution)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND NOW() - state_change > INTERVAL '10 minutes';
```

#### B. Increase Connection Limit (Temporary)

```typescript
// In prisma/schema.prisma
datasource db {
  url = env("DATABASE_URL")
  // Add: ?connection_limit=30 (increase from 20)
}

// Restart app
```

#### C. Identify Connection Leak

```bash
# Check for leaked connections in code
grep -r "prisma\." packages/web/src | grep -v "prisma\.\$" | wc -l

# Look for missing try/finally blocks or unhandled promises
```

---

### 3. High Write Pressure / MVCC Bloat

**Symptoms**:

- Queries getting slower over time
- Table sizes growing rapidly
- Dead row percentage >20%

**Triage Steps**:

```sql
-- Check table bloat
SELECT * FROM vw_table_bloat ORDER BY dead_row_percentage DESC;

-- Check VACUUM status
SELECT
  schemaname,
  relname,
  last_vacuum,
  last_autovacuum,
  n_dead_tup,
  n_live_tup,
  ROUND((n_dead_tup::NUMERIC / NULLIF(n_live_tup, 0)) * 100, 2) AS dead_pct
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND n_dead_tup > 1000
ORDER BY dead_pct DESC;
```

**Resolution Steps**:

#### A. Manual VACUUM (if needed)

```sql
-- Run VACUUM on bloated table
VACUUM (VERBOSE, ANALYZE) usage_events;

-- If table is severely bloated (>50% dead rows), use VACUUM FULL
-- WARNING: VACUUM FULL locks the table
VACUUM FULL usage_events;
```

#### B. Check Write Buffer Status

```bash
# Check if write buffer is working
curl https://api.settler.dev/api/admin/health | jq '.database.writeBuffer'

# Check Redis connection
redis-cli -u $REDIS_URL ping
# Expected: PONG
```

#### C. Disable Write Buffering (if causing issues)

```typescript
// Temporarily disable in lib/db/write-buffer.ts
const BUFFER_CONFIG = {
  enabled: false, // Falls back to sync writes
  ...
};
```

---

### 4. Cache Not Working / Low Hit Rate

**Symptoms**:

- Cache hit rate <30%
- High query load despite caching
- Redis errors in logs

**Triage Steps**:

```bash
# 1. Check Redis connection
redis-cli -u $REDIS_URL ping

# 2. Check cache hit rate
curl https://api.settler.dev/api/admin/health | jq '.database.queryMetrics.cacheHits'

# 3. Check Redis memory usage
redis-cli -u $REDIS_URL INFO memory
```

**Resolution Steps**:

#### A. Verify Redis Configuration

```bash
# Check environment variables
echo $REDIS_URL
echo $UPSTASH_REDIS_REST_TOKEN

# Test connection
node -e "
const { Redis } = require('@upstash/redis');
const redis = new Redis({ url: process.env.REDIS_URL });
redis.ping().then(console.log);
"
# Expected: 'PONG'
```

#### B. Clear Cache (if corrupted)

```bash
# Flush all cache keys (use with caution)
redis-cli -u $REDIS_URL FLUSHDB

# Or clear specific keys
redis-cli -u $REDIS_URL --scan --pattern 'query:*' | xargs redis-cli -u $REDIS_URL DEL
```

#### C. Increase Cache TTL (if too aggressive)

```typescript
// In lib/db/query-gateway.ts
const CACHE_CONFIG = {
  defaultTTL: 120, // Increase from 60 to 120 seconds
  ...
};
```

---

### 5. Index Not Being Used

**Symptoms**:

- Query still slow after adding index
- EXPLAIN shows "Seq Scan" instead of "Index Scan"

**Triage Steps**:

```sql
-- Check if index exists
SELECT * FROM pg_indexes WHERE indexname = 'idx_name';

-- Check index usage stats
SELECT * FROM vw_index_usage WHERE indexname = 'idx_name';

-- Run EXPLAIN on query
EXPLAIN SELECT ...;
```

**Resolution Steps**:

#### A. Verify Query Uses Index

```sql
-- Check if query matches index columns
-- Index: (tenant_id, created_at DESC)
-- Query MUST have: WHERE tenant_id = ? ORDER BY created_at DESC

-- If not matching, rewrite query or add different index
```

#### B. Update Table Statistics

```sql
-- Force ANALYZE to update query planner stats
ANALYZE usage_events;

-- Retry query
EXPLAIN SELECT ...;
-- Should now show "Index Scan"
```

#### C. Check Index Bloat

```sql
-- If index is bloated, REINDEX
REINDEX INDEX CONCURRENTLY idx_name;
```

---

## Monitoring Dashboards

### Key Queries for Monitoring

#### A. Check Slow Queries (Last Hour)

```typescript
// GET /api/admin/health
const { database } = await fetch("/api/admin/health").then((r) => r.json());
console.log(database.slowQueries); // Last 20 slow queries
```

#### B. Check Connection Pool Health

```typescript
const { database } = await fetch("/api/admin/health").then((r) => r.json());
console.log(database.connectionPool.healthy); // true/false
```

#### C. Check Table Bloat

```sql
SELECT * FROM vw_table_bloat WHERE dead_row_percentage > 10;
```

#### D. Check Index Usage

```sql
SELECT * FROM vw_index_usage WHERE usage_category = 'UNUSED';
```

---

## Preventive Maintenance

### Weekly Tasks

1. **Review Slow Queries**

   ```bash
   curl https://api.settler.dev/api/admin/health | jq '.database.slowQueries' > slow_queries_$(date +%Y%m%d).json
   ```

2. **Check Unused Indexes**

   ```sql
   SELECT * FROM vw_index_usage WHERE usage_category = 'UNUSED' AND pg_size_bytes > 10485760; -- >10MB
   -- Consider dropping unused large indexes
   ```

3. **Monitor Table Growth**
   ```sql
   SELECT
     relname,
     pg_size_pretty(pg_total_relation_size(relid)) AS total_size
   FROM pg_stat_user_tables
   ORDER BY pg_total_relation_size(relid) DESC
   LIMIT 10;
   ```

### Monthly Tasks

1. **Review and Optimize Slow Queries**
   - Analyze top 10 slowest queries
   - Add indexes or rewrite queries
   - Document optimizations

2. **Check for Query Regressions**
   - Compare p95 latency month-over-month
   - Investigate any 2x increases

3. **Audit Index Usage**
   - Drop unused indexes (>6 months no scans, >10MB size)
   - Consolidate redundant indexes

4. **Capacity Planning**
   - Check disk usage growth rate
   - Project when to upgrade Supabase plan
   - Review connection pool utilization trends

---

## Escalation Procedures

### When to Escalate

1. **Database Outage** (no responses for >1 minute)
   - Contact: Supabase support immediately
   - Escalate: CTO/Tech Lead within 5 minutes

2. **Data Corruption** (wrong query results)
   - Stop all writes immediately
   - Escalate: CTO/Tech Lead + Database Admin immediately

3. **Persistent High Latency** (>5 minutes, no resolution)
   - Escalate: Tech Lead within 10 minutes

4. **Connection Pool Exhaustion** (can't restart)
   - Escalate: DevOps + Tech Lead within 5 minutes

### Emergency Rollback

```bash
# 1. Revert code to previous deployment
git revert <commit-hash>
git push origin main

# 2. Redeploy
vercel redeploy --force

# 3. Rollback database migration (if needed)
psql $DATABASE_URL -f supabase/migrations/ROLLBACK.sql

# 4. Verify health
curl https://api.settler.dev/api/health
```

---

## Post-Incident Review

### Template

```markdown
## Incident Report: [Title]

**Date**: 2026-01-24
**Duration**: X hours
**Impact**: X users affected, X% error rate

### Timeline

- HH:MM - Initial alert
- HH:MM - Investigation started
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Incident resolved

### Root Cause

[Describe technical root cause]

### Resolution

[Describe fix applied]

### Action Items

- [ ] Task 1
- [ ] Task 2

### Lessons Learned

- What went well
- What could be improved
```

---

## Contact Information

- **Supabase Dashboard**: https://supabase.com/dashboard/project/[PROJECT_REF]
- **Vercel Dashboard**: https://vercel.com/[ORG]/[PROJECT]
- **Documentation**: [/docs/postgres-scale-audit/](.)

**Continue to**: [05-future-scaling.md](./05-future-scaling.md)
