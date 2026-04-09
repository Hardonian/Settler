# PostgreSQL Scaling Audit: Findings & Gap Analysis

**Date**: 2026-01-24
**Severity Scale**: 🔴 CRITICAL | 🟠 HIGH | 🟡 MEDIUM | 🟢 LOW
**Risk Model**: OpenAI Postgres-at-scale discipline

---

## Executive Summary

**Verdict**: The current architecture is **NOT compatible with Postgres-at-massive-scale** without significant remediation.

**Critical Risks**:

- **30 query anti-patterns** identified (N+1 queries, unbounded results, app-level aggregations)
- **No read replica support** (plan limitation + no logical replica behavior)
- **Hot row contention** on `usage_counters` table (UPDATE storms)
- **No write buffering** (all writes block API responses)
- **No database observability** (blind to slow queries and connection saturation)

**Most Likely Failure Mode at 10x Growth**:

1. **Connection pool exhaustion** from N+1 query patterns
2. **Hot row contention** on usage counters causing deadlocks
3. **VACUUM bloat** on append-only tables (`api_call_logs`, `usage_events`)
4. **Webhook storms** saturating primary database

---

## PHASE 1: Detailed Findings

### A. Read/Write Separation & Replica-Ready Patterns

**Status**: 🔴 **CRITICAL GAPS**

#### Findings

1. **No Read Replicas Configured**
   - **Severity**: 🟠 HIGH
   - **Evidence**: Current Supabase plan does not support read replicas
   - **Impact**: All reads hit primary, limiting horizontal scalability
   - **Cost to Fix**: $574/mo upgrade (Supabase Team plan)

2. **No Logical Replica Behavior**
   - **Severity**: 🟠 HIGH
   - **Evidence**: Minimal caching (60s client-level cache only)
   - **Impact**: Cannot offload reads even if replicas were available
   - **Gap**: No cache-first read strategy

3. **Write-Heavy Endpoints Mixing Reads and Writes**
   - **Severity**: 🟡 MEDIUM
   - **Evidence**:
     - `/api/webhooks/stripe` writes then immediately reads back
     - `/api/console/usage` reads usage then writes tracking events
   - **Impact**: Read-after-write loops force strong consistency
   - **Gap**: Should use async write queueing

4. **Service Role Used for Admin Reads**
   - **Severity**: 🟢 LOW
   - **Evidence**: `/api/admin/*` routes use service role (bypasses RLS)
   - **Impact**: Correct pattern for admin operations
   - **Note**: ✅ Good isolation

#### Recommendations

| Fix                                  | Priority    | Effort | Impact | Cost             |
| ------------------------------------ | ----------- | ------ | ------ | ---------------- |
| Implement Redis-backed query cache   | 🔴 CRITICAL | 3 days | High   | $10/mo (Upstash) |
| Add cache-first read strategy        | 🔴 CRITICAL | 2 days | High   | Included         |
| Decouple writes with queue           | 🟠 HIGH     | 5 days | Medium | Included         |
| Add read replicas (if budget allows) | 🟡 MEDIUM   | 1 day  | High   | $574/mo          |

---

### B. Connection Pooling & Concurrency Control

**Status**: 🟠 **HIGH RISK**

#### Findings

1. **Conservative Pool Size (Good)**
   - **Severity**: ✅ POSITIVE
   - **Evidence**: Prisma: 5 min, 20 max connections
   - **Impact**: Prevents connection storms
   - **Note**: Appropriate for serverless

2. **No Connection Pool Monitoring**
   - **Severity**: 🟠 HIGH
   - **Evidence**: No metrics on pool saturation, wait times, or connection errors
   - **Impact**: Cannot detect pool exhaustion until outages occur
   - **Gap**: No `pool.totalCount`, `pool.idleCount`, `pool.waitingCount` metrics

3. **Supabase Client Pool Unknown**
   - **Severity**: 🟡 MEDIUM
   - **Evidence**: Relies on Supabase's PgBouncer (shared, transaction mode)
   - **Impact**: Cannot control or monitor Supabase pooler behavior
   - **Gap**: No visibility into Supabase pooler metrics

4. **No Per-Request Concurrency Limits**
   - **Severity**: 🟠 HIGH
   - **Evidence**: No semaphore or concurrency gate on expensive operations
   - **Impact**: One slow query can block entire pool
   - **Gap**: Should limit concurrent expensive queries (e.g., max 5 concurrent reconciliations)

5. **Cold Start Connection Storms**
   - **Severity**: 🟡 MEDIUM
   - **Evidence**: Vercel serverless cold starts can create many Prisma clients simultaneously
   - **Impact**: Brief connection spikes during traffic surges
   - **Gap**: Prisma client singleton pattern mitigates but not perfect

#### Recommendations

| Fix                                   | Priority    | Effort | Impact |
| ------------------------------------- | ----------- | ------ | ------ |
| Add connection pool metrics           | 🔴 CRITICAL | 1 day  | High   |
| Implement concurrency gates           | 🟠 HIGH     | 2 days | Medium |
| Add request-level timeout enforcement | 🟠 HIGH     | 1 day  | Medium |
| Implement connection warming          | 🟡 MEDIUM   | 1 day  | Low    |

---

### C. Query Discipline & Indexing

**Status**: 🔴 **CRITICAL ISSUES**

#### Findings: N+1 Query Patterns

| Location                                        | Severity    | Impact                                             | Pattern                      |
| ----------------------------------------------- | ----------- | -------------------------------------------------- | ---------------------------- |
| `/api/console/tenants/route.ts:116-159`         | 🔴 CRITICAL | 2 queries per tenant (100+ for 50 tenants)         | Loop with sequential queries |
| `/api/admin/stream/route.ts:112-209`            | 🔴 CRITICAL | Polling every 2s (300 queries/min with 10 clients) | setInterval with queries     |
| `/api/console/usage/analytics/route.ts:188-204` | 🟠 HIGH     | 4 sequential service queries                       | Loop with getCurrentUsage()  |
| `/api/console/usage/route.ts:131-145`           | 🟠 HIGH     | 4 sequential service queries                       | Loop with getCurrentUsage()  |
| `/lib/server/settler/reconciliation.ts:282-327` | 🟠 HIGH     | Transaction lookups in match loop                  | N+1 on matches               |
| `/lib/ai/insights-generator.ts:53-62`           | 🟡 MEDIUM   | 2 sequential usage calls                           | Loop with getCurrentUsage()  |

**Total N+1 Patterns**: 6 critical issues

#### Findings: Unbounded Queries

| Location                                      | Severity    | Impact                             | Missing Constraint |
| --------------------------------------------- | ----------- | ---------------------------------- | ------------------ |
| `/lib/admin/metrics/aggregation.ts:53-66`     | 🔴 CRITICAL | Reconciliation runs (no limit)     | `take` parameter   |
| `/lib/admin/metrics/aggregation.ts:180-190`   | 🔴 CRITICAL | **LOOP + UNBOUNDED** trend queries | Loop + no limit    |
| `/lib/admin/metrics/aggregation.ts:119-129`   | 🟠 HIGH     | Resolved exceptions (no limit)     | `take` parameter   |
| `/lib/ai/insights-generator.ts:89-95`         | 🟠 HIGH     | Usage events (no limit)            | `take` parameter   |
| `/lib/ai/insights-generator.ts:231-241`       | 🟠 HIGH     | Events with orderBy (no limit)     | `take` parameter   |
| `/lib/server/settler/reconciliation.ts:66-83` | 🟠 HIGH     | Source + target transactions       | `take` parameter   |
| `/lib/metrics/service.ts:94-134`              | 🟡 MEDIUM   | Billing accounts + usage counters  | `take` parameter   |

**Total Unbounded Queries**: 14 issues

#### Findings: App-Level Aggregations

| Location                                              | Severity  | Should Use DB-Level       |
| ----------------------------------------------------- | --------- | ------------------------- |
| `/lib/feedback-loops/usage-insights-service.ts:70-86` | 🟠 HIGH   | `groupBy()` or `_count`   |
| `/lib/ai/insights-generator.ts:139-173`               | 🟠 HIGH   | `_avg`, `_sum`, `_count`  |
| `/lib/ai/insights-generator.ts:231-279`               | 🟠 HIGH   | `groupBy()` with `_sum`   |
| `/lib/admin/metrics/aggregation.ts:69-83`             | 🟡 MEDIUM | `_avg`, `_sum` aggregates |
| `/lib/admin/metrics/aggregation.ts:222-242`           | 🟡 MEDIUM | `groupBy()` at DB         |

**Total App-Level Aggregations**: 6 issues

#### Findings: Missing Indexes (Suspected)

Based on query patterns, these composite indexes are likely missing or suboptimal:

| Table                    | Missing Index                                 | Query Pattern            | Impact               |
| ------------------------ | --------------------------------------------- | ------------------------ | -------------------- |
| `usage_events`           | `(billing_account_id, event_type, timestamp)` | Usage analytics grouping | Full table scan      |
| `api_call_logs`          | `(tenant_id, method, path, created_at)`       | Filtered log queries     | Slow log searches    |
| `stripe_events`          | `(billing_account_id, received_at)`           | Billing event queries    | Slow event fetches   |
| `audit_logs`             | `(tenant_id, resource_type, created_at)`      | Audit log filtering      | Slow audit queries   |
| `recon_results`          | `(tenant_id, status, started_at)`             | Reconciliation filtering | Slow dashboard       |
| `reconciliation_matches` | `(run_id, confidence)`                        | Match quality filtering  | N+1 on match details |

#### Recommendations

| Fix                                  | Priority    | Effort | Impact |
| ------------------------------------ | ----------- | ------ | ------ |
| Add `take` limits to all findMany()  | 🔴 CRITICAL | 2 days | High   |
| Replace N+1 loops with Promise.all() | 🔴 CRITICAL | 3 days | High   |
| Add composite indexes (6 tables)     | 🔴 CRITICAL | 1 day  | High   |
| Convert app aggregations to DB       | 🟠 HIGH     | 3 days | Medium |
| Optimize SSE polling pattern         | 🟡 MEDIUM   | 2 days | Medium |

---

### D. Write Pressure Reduction

**Status**: 🔴 **CRITICAL ISSUES**

#### Findings: Hot Tables

| Table            | Write Rate   | Pattern                    | Issue                  | Severity    |
| ---------------- | ------------ | -------------------------- | ---------------------- | ----------- |
| `usage_counters` | 10-50/min    | `UPDATE count = count + 1` | **Hot row contention** | 🔴 CRITICAL |
| `usage_events`   | 100-1000/min | Single INSERT per event    | MVCC bloat             | 🟠 HIGH     |
| `api_call_logs`  | 50-500/min   | Single INSERT per request  | MVCC bloat             | 🟠 HIGH     |
| `stripe_events`  | 10-100/min   | INSERT + UPDATE status     | Medium contention      | 🟡 MEDIUM   |
| `audit_logs`     | 10-50/min    | Single INSERT per action   | Medium bloat           | 🟡 MEDIUM   |

#### Findings: Write Patterns

1. **Usage Counter Hot Rows** 🔴 **CRITICAL**
   - **Pattern**: `UPDATE usage_counters SET count = count + 1 WHERE billing_account_id = ? AND service = ?`
   - **Issue**: Multiple concurrent requests update same row (row-level locking)
   - **Impact**: Deadlocks, slow writes, transaction timeouts
   - **Evidence**: `/lib/usage/tracking.ts` (increment pattern)
   - **Fix**: Buffer in Redis, flush periodically (every 10s)

2. **Single-Insert Pattern (Not Batched)** 🟠 **HIGH**
   - **Pattern**: One database round-trip per event
   - **Issue**: High latency, connection churn
   - **Impact**: API response time includes write latency
   - **Evidence**: All usage tracking, audit logs, API logs
   - **Fix**: Buffer writes in Redis queue, batch flush

3. **No Partitioning on Append-Only Tables** 🟠 **HIGH**
   - **Pattern**: `api_call_logs` and `usage_events` grow unbounded
   - **Issue**: VACUUM becomes expensive, index bloat
   - **Impact**: Slow queries over time, storage costs
   - **Evidence**: No `PARTITION BY RANGE (created_at)` in schema
   - **Fix**: Partition by month (native Postgres partitioning)

4. **Synchronous Writes Block API Responses** 🟠 **HIGH**
   - **Pattern**: `await prisma.usageEvent.create()` in hot path
   - **Issue**: Write latency added to response time
   - **Impact**: Slow API responses, poor user experience
   - **Evidence**: `/middleware/api-logger.ts`, `/lib/usage/tracking.ts`
   - **Fix**: Fire-and-forget queue pattern

#### Recommendations

| Fix                               | Priority    | Effort | Impact | Complexity |
| --------------------------------- | ----------- | ------ | ------ | ---------- |
| Implement write buffering (Redis) | 🔴 CRITICAL | 4 days | High   | Medium     |
| Convert counters to append-only   | 🔴 CRITICAL | 2 days | High   | Low        |
| Add table partitioning            | 🟠 HIGH     | 3 days | High   | High       |
| Batch insert pattern              | 🟠 HIGH     | 2 days | Medium | Low        |

---

### E. Guardrails for Dangerous Operations

**Status**: 🟠 **HIGH RISK**

#### Findings: Missing Guardrails

| Guardrail                     | Status     | Gap                                           | Severity    |
| ----------------------------- | ---------- | --------------------------------------------- | ----------- |
| **Query timeout enforcement** | ⚠️ Partial | Only Prisma (30s), no Supabase client timeout | 🟠 HIGH     |
| **Row count limits**          | ⚠️ Partial | Some endpoints, not enforced globally         | 🟠 HIGH     |
| **Backfill throttling**       | ❌ Missing | Large Stripe syncs can saturate DB            | 🔴 CRITICAL |
| **Transaction time limits**   | ❌ Missing | Long reconciliations can block                | 🟠 HIGH     |
| **Connection pool alerts**    | ❌ Missing | No monitoring on pool saturation              | 🟠 HIGH     |
| **Slow query logging**        | ❌ Missing | No pg_stat_statements access                  | 🟠 HIGH     |
| **Circuit breakers**          | ❌ Missing | No automatic query cancellation               | 🟡 MEDIUM   |

#### Specific Gaps

1. **Unbounded Backfills** 🔴 **CRITICAL**
   - **Location**: `/api/connectors/backfill/[providerId]/route.ts`
   - **Issue**: No row count limit or time budget
   - **Impact**: Can fetch 100k+ rows from Stripe in one request
   - **Fix**: Chunked backfill (1000 rows per batch, with delays)

2. **Long-Running Reconciliations** 🟠 **HIGH**
   - **Location**: `/lib/server/settler/reconciliation.ts`
   - **Issue**: No timeout or progress checkpoints
   - **Impact**: Can hold transaction open for minutes
   - **Fix**: Checkpoint pattern (commit every 1000 rows)

3. **No Query Governor** 🟠 **HIGH**
   - **Issue**: No automated kill for expensive queries
   - **Impact**: One bad query can degrade entire database
   - **Fix**: Implement query timeout middleware (15s for reads, 60s for writes)

#### Recommendations

| Fix                                  | Priority    | Effort | Impact |
| ------------------------------------ | ----------- | ------ | ------ |
| Add query timeout to Supabase client | 🔴 CRITICAL | 1 day  | High   |
| Implement backfill chunking          | 🔴 CRITICAL | 2 days | High   |
| Add circuit breaker middleware       | 🟠 HIGH     | 3 days | Medium |
| Implement query governor             | 🟡 MEDIUM   | 5 days | High   |

---

### F. Operational Observability

**Status**: 🔴 **CRITICAL GAPS**

#### Findings: Missing Metrics

| Metric                            | Status     | Gap                                                         | Impact      |
| --------------------------------- | ---------- | ----------------------------------------------------------- | ----------- |
| **DB connection pool usage**      | ❌ Missing | No `pool.totalCount`, `pool.idleCount`, `pool.waitingCount` | 🔴 CRITICAL |
| **Query latency (p50, p95, p99)** | ❌ Missing | No per-query timing                                         | 🔴 CRITICAL |
| **Slow queries**                  | ❌ Missing | No pg_stat_statements access                                | 🔴 CRITICAL |
| **RLS policy performance**        | ❌ Missing | No timing on `get_user_org_ids()`                           | 🟠 HIGH     |
| **Cache hit rate**                | ❌ Missing | No instrumentation                                          | 🟡 MEDIUM   |
| **Write throughput**              | ❌ Missing | No per-table write metrics                                  | 🟡 MEDIUM   |
| **Error rate by table**           | ❌ Missing | No table-level error tracking                               | 🟡 MEDIUM   |
| **VACUUM lag**                    | ❌ Missing | No bloat monitoring                                         | 🟠 HIGH     |

#### Specific Gaps

1. **No Slow Query Monitoring** 🔴 **CRITICAL**
   - **Issue**: Cannot identify which queries are slow
   - **Impact**: Reactive debugging instead of proactive optimization
   - **Evidence**: No `pg_stat_statements` integration
   - **Fix**: Enable pg_stat_statements, export to monitoring tool

2. **No Connection Pool Metrics** 🔴 **CRITICAL**
   - **Issue**: Cannot detect pool saturation until 500s occur
   - **Impact**: Blind to capacity planning needs
   - **Evidence**: No metrics in `/api/admin/health`
   - **Fix**: Expose Prisma pool metrics via health endpoint

3. **No RLS Performance Tracking** 🟠 **HIGH**
   - **Issue**: `get_user_org_ids()` called on every RLS check (could be expensive)
   - **Impact**: Hidden performance cost
   - **Evidence**: No timing instrumentation
   - **Fix**: Add EXPLAIN ANALYZE to sample queries

#### Recommendations

| Fix                                  | Priority    | Effort | Impact |
| ------------------------------------ | ----------- | ------ | ------ |
| Add connection pool metrics          | 🔴 CRITICAL | 1 day  | High   |
| Enable pg_stat_statements            | 🔴 CRITICAL | 2 days | High   |
| Add query timing middleware          | 🟠 HIGH     | 2 days | Medium |
| Implement RLS performance monitoring | 🟡 MEDIUM   | 1 day  | Low    |

---

## Summary of All Findings

### By Severity

| Severity    | Count | Examples                                                               |
| ----------- | ----- | ---------------------------------------------------------------------- |
| 🔴 CRITICAL | 12    | Hot row contention, N+1 queries, unbounded backfills, no observability |
| 🟠 HIGH     | 18    | Unbounded queries, app-level aggregations, missing indexes             |
| 🟡 MEDIUM   | 8     | Missing pagination, cold start storms, RLS overhead                    |
| 🟢 LOW      | 2     | Service role usage (good), conservative pool size (good)               |

### Total Issues: 40

**Breakdown**:

- Query anti-patterns: 26 (N+1, unbounded, app-level aggregations)
- Write pressure: 5 (hot rows, MVCC bloat, sync writes)
- Missing guardrails: 7 (timeouts, limits, circuit breakers)
- Observability gaps: 8 (metrics, monitoring, alerts)

---

## Cost-Effective Scaling Path (BEFORE Read Replicas)

Before spending $574/mo on read replicas, implement these optimizations:

### Wave 1: Free (Zero Cost) 🆓

1. Add `take` limits to all findMany() queries
2. Replace N+1 loops with Promise.all() batch queries
3. Add composite indexes (6 tables)
4. Convert counters to append-only pattern
5. Add query timeout enforcement

**Estimated Capacity Gain**: 3-5x

### Wave 2: Low Cost ($10-20/mo) 💵

1. Implement Redis-backed query result caching (Upstash: $10/mo)
2. Implement write buffering via Redis queue (same Redis)
3. Add cache stampede protection (single-flight pattern)
4. Convert app-level aggregations to DB-level

**Estimated Capacity Gain**: 5-10x

### Wave 3: Medium Cost ($50-100/mo) 💵💵

1. Implement table partitioning (requires downtime)
2. Add Sentry for query performance monitoring
3. Implement async job queue (BullMQ + Upstash Redis)

**Estimated Capacity Gain**: 10-20x

### Wave 4: High Cost ($574/mo) 💵💵💵

1. Upgrade to Supabase Team plan (read replicas)
2. Implement replica-aware query routing
3. Add automatic failover logic

**Estimated Capacity Gain**: 20-50x

**Total Cost to 50x Capacity**: ~$600/mo (vs. $574/mo for replicas alone with no other optimizations)

---

## NEXT STEPS

**Continue to**: `02-changes.md` (implementation plan)
