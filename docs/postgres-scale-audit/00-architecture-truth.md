# Settler PostgreSQL Scaling Architecture Truth Table

**Generated**: 2026-01-24
**Audit Scope**: Full-stack Supabase PostgreSQL usage analysis
**Reference**: OpenAI Postgres scaling lessons (single write primary + many read replicas + strict workload separation)

---

## PHASE 0: Repository Discovery Summary

### Stack Identity

- **Framework**: Next.js 14 App Router (Turbo monorepo)
- **Database**: Supabase PostgreSQL (single instance, no read replicas currently)
- **ORM**: Prisma Client + Supabase JS Client (dual-access pattern)
- **Cache**: Upstash Redis (optional, serverless)
- **Runtime**: Node.js 24+ (primary), Edge Runtime (Supabase Edge Functions)
- **Deployment**: Vercel (Next.js) + Supabase Cloud
- **Multi-tenancy**: Row Level Security (RLS) via `tenant_id` columns

---

## 1. Primary Write Paths

| Write Operation              | Location                   | Client Type     | RLS | Batching                          | Concerns                 |
| ---------------------------- | -------------------------- | --------------- | --- | --------------------------------- | ------------------------ |
| **Stripe Webhook Events**    | `/api/webhooks/stripe`     | Service Role    | No  | Single insert                     | High volume, hot table   |
| **Usage Event Tracking**     | `UsageEvent` table         | Prisma          | Yes | Single insert per API call        | MVCC bloat risk          |
| **API Call Logs**            | `api_call_logs` table      | Supabase Client | Yes | Single insert per request         | High volume, append-only |
| **Audit Logs**               | `audit_logs` table         | Supabase Client | Yes | Single insert per action          | Medium volume            |
| **Onboarding Events**        | `onboarding_events` table  | Prisma          | Yes | Single insert                     | Low volume               |
| **Experiment Metrics**       | `experiment_metric_events` | Prisma          | Yes | Single insert                     | Medium volume            |
| **Reconciliation Results**   | `recon_results` table      | Prisma          | Yes | Single write + bulk match inserts | Can be large batch       |
| **Raw Records (CSV Import)** | `raw_records` table        | Prisma          | Yes | Batch insert (chunked)            | Can trigger write storms |
| **Normalized Transactions**  | `normalized_transactions`  | Prisma          | Yes | Batch insert (chunked)            | Can trigger write storms |

**Key Findings**:

- No explicit write shedding or buffering layer
- Most writes are single-insert (not batched)
- High-frequency tables: `usage_events`, `api_call_logs`, `stripe_events`, `audit_logs`
- No write queue abstraction (BullMQ/Redis queue not in use for DB writes)
- **RISK**: Webhook storms can cause connection exhaustion

---

## 2. Read Paths

| Read Operation             | Location                      | Client Type           | RLS | Caching               | Index Coverage                         | Concerns                              |
| -------------------------- | ----------------------------- | --------------------- | --- | --------------------- | -------------------------------------- | ------------------------------------- |
| **Console Dashboard**      | `/console/*` pages            | Anon + Cookie Session | Yes | 60s client cache      | Partial                                | Multiple queries per page             |
| **API Logs Viewer**        | `/api/console/api-logs`       | Anon + Session        | Yes | API cache (30s)       | Good (`tenant_id, created_at`)         | Can scan large datasets               |
| **Usage Analytics**        | `/api/console/usage`          | Prisma                | Yes | None                  | Good (`billing_account_id, timestamp`) | Aggregates in-app (no DB aggregation) |
| **Billing Status**         | `/api/console/billing`        | Prisma                | Yes | Optimized query cache | Good                                   | Multiple joins                        |
| **Reconciliation Results** | `/api/console/reconciliation` | Prisma                | Yes | None                  | Partial                                | N+1 risk on match details             |
| **Tenant User Checks**     | `tenant_helpers.ts`           | Supabase Client       | Yes | 60s cache             | Good (`tenant_id, user_id`)            | Called frequently                     |
| **Admin Health Check**     | `/api/admin/health`           | Service Role          | No  | None                  | N/A                                    | Diagnostic only                       |

**Key Findings**:

- Read queries mostly use Supabase client `.from()` pattern
- Some Prisma queries for complex joins
- RLS enforced on all read paths (except service role)
- **Client-side caching**: 60-second TTL for Supabase server client
- **API-level caching**: 30-second TTL for logs/metrics endpoints
- **RISK**: No read replica support; all reads hit primary
- **RISK**: Aggregate queries computed in-app (not via DB materialized views)

---

## 3. Caching Strategy

| Layer                     | Technology                 | TTL              | Hit Rate (Est) | Coverage                                |
| ------------------------- | -------------------------- | ---------------- | -------------- | --------------------------------------- |
| **Supabase Client Cache** | In-memory (server)         | 60s              | Unknown        | Server client reuse                     |
| **API Response Cache**    | Custom headers             | 30s              | Unknown        | Logs, metrics, usage                    |
| **Billing Account Query** | In-memory (function-level) | 60s              | High           | `getBillingAccountOptimized()`          |
| **Redis (Upstash)**       | Redis REST API             | Variable         | Low            | Rate limiting, feature flags (optional) |
| **Next.js Fetch Cache**   | Next.js built-in           | `revalidate: 60` | Medium         | Public pages, docs                      |
| **CDN (Vercel)**          | Edge                       | Varies           | High           | Static assets, public pages             |

**Key Findings**:

- **No centralized cache gateway** for database queries
- **No cache stampede protection** (single-flight pattern)
- **No cache warming** or preloading
- **Redis is underutilized**: Only used for rate limiting and feature flags, not for query results
- **OPPORTUNITY**: Implement Redis-backed query result caching for expensive reads

---

## 4. Rate Limiting & Backpressure

| Endpoint                 | Rate Limit               | Implementation             | Concurrency Control       | Circuit Breaker |
| ------------------------ | ------------------------ | -------------------------- | ------------------------- | --------------- |
| **API Routes**           | 1000 req/15min (default) | `withRateLimit` middleware | None                      | No              |
| **Console API**          | 100 req/min              | Per-user, Redis-backed     | None                      | No              |
| **Webhook Ingestion**    | None                     | N/A                        | None                      | No              |
| **CSV Upload**           | None                     | N/A                        | None (chunked processing) | No              |
| **Cron Jobs**            | N/A                      | Vercel Cron                | Single invocation         | No              |
| **Database Connections** | 5 min, 20 max (Prisma)   | Prisma pool                | Pool exhaustion handling  | No              |

**Key Findings**:

- **Rate limiting exists** but no per-operation cost weighting
- **No database-level circuit breaker** (e.g., reject queries if pool saturated)
- **No request shedding** (429s are rare, no queue depth limits)
- **RISK**: Webhook storms can bypass rate limits (no per-IP/per-tenant throttling on webhooks)
- **RISK**: Large CSV imports not throttled (can saturate pool)

---

## 5. Background Processing

| Job Type                     | Scheduler      | Runtime | DB Access Pattern  | Error Handling        |
| ---------------------------- | -------------- | ------- | ------------------ | --------------------- |
| **Cron: Daily Cost Rollup**  | Vercel Cron    | Edge    | Batch aggregation  | Retry via Vercel      |
| **Cron: Email Lifecycle**    | Vercel Cron    | Edge    | Read-heavy         | Retry via Vercel      |
| **Cron: Reliability Alerts** | Vercel Cron    | Edge    | Read-heavy         | Retry via Vercel      |
| **Webhook Retries**          | None (inline)  | Node.js | Write-heavy        | Manual retry (no DLQ) |
| **Reconciliation Runs**      | User-triggered | Node.js | Heavy write + read | Transaction rollback  |
| **CSV Import Processing**    | User-triggered | Node.js | Heavy write        | Transaction rollback  |

**Key Findings**:

- **No queue-based background job system** (no BullMQ, no Redis queue)
- **Cron jobs are Edge Functions** (Supabase Edge or Vercel Cron)
- **No Dead Letter Queue (DLQ)** for failed webhooks
- **RISK**: Long-running jobs (reconciliation, CSV import) can block API requests
- **OPPORTUNITY**: Move heavy processing to async queue (BullMQ + Upstash Redis)

---

## 6. Connection Pooling & Concurrency

| Client                       | Pooling Mode      | Min Conn | Max Conn     | Timeout               | Statement Timeout |
| ---------------------------- | ----------------- | -------- | ------------ | --------------------- | ----------------- |
| **Prisma**                   | Connection Pool   | 5        | 20           | 10s connect, 20s pool | 30s               |
| **Supabase Client (Server)** | Supabase Pooler   | N/A      | N/A (shared) | N/A                   | N/A               |
| **Supabase Client (Admin)**  | Direct Connection | N/A      | N/A          | N/A                   | N/A               |
| **Edge Functions**           | Supabase Pooler   | N/A      | N/A          | N/A                   | N/A               |

**Key Findings**:

- **Prisma uses conservative pool**: 5 min, 20 max (good for serverless)
- **Supabase client relies on Supabase's pooler** (PgBouncer in transaction mode)
- **No explicit connection pool monitoring** (no metrics on saturation)
- **No query timeout enforcement** on Supabase client queries (relies on PostgreSQL `statement_timeout`)
- **RISK**: Vercel serverless cold starts can cause connection storms
- **RISK**: Long-running queries (e.g., full-table scans) not killed automatically

---

## 7. Query Discipline & Indexing

### Index Coverage Audit (Sample)

| Table                     | Key Indexes                         | Missing Indexes (Suspected)                             | N+1 Risk      |
| ------------------------- | ----------------------------------- | ------------------------------------------------------- | ------------- |
| `api_call_logs`           | `tenant_id, created_at DESC`        | `tenant_id, method, path`                               | No            |
| `usage_events`            | `billing_account_id, timestamp`     | `billing_account_id, event_type, timestamp` (composite) | No            |
| `stripe_events`           | `event_id, type, status`            | `billing_account_id, received_at`                       | No            |
| `audit_logs`              | `user_id, created_at DESC`          | `tenant_id, resource_type, created_at`                  | No            |
| `recon_results`           | `recon_job_id, tenant_id`           | `tenant_id, status, started_at` (composite)             | Yes (matches) |
| `normalized_transactions` | `tenant_id, date, amount, currency` | `source_id, external_id`                                | No            |
| `app_private.memberships` | `tenant_id, user_id` (unique)       | None                                                    | No            |

**Key Findings**:

- **Good**: Most tenant-scoped tables have `tenant_id` indexes
- **Good**: Time-series tables have `created_at DESC` indexes
- **MISSING**: Composite indexes for multi-column filters (e.g., `tenant_id + status + created_at`)
- **MISSING**: Covering indexes for common `SELECT` columns
- **RISK**: `recon_results` → `reconciliation_matches` 1:N relationship can cause N+1 queries
- **RISK**: No `pg_stat_statements` monitoring (can't identify slow queries)

### Query Patterns Observed

| Pattern                  | Location                            | Issue                         | Mitigation                                |
| ------------------------ | ----------------------------------- | ----------------------------- | ----------------------------------------- |
| **SELECT \* FROM ...**   | Rare (Prisma uses explicit selects) | None                          | Good                                      |
| **No LIMIT clause**      | Some Supabase `.from()` calls       | Unbounded result sets         | Add `.limit()`                            |
| **Aggregations in-app**  | Usage analytics, cost rollup        | Inefficient                   | Use DB aggregations or materialized views |
| **Cross-tenant queries** | Admin endpoints                     | RLS bypass (service role)     | Manual tenant filtering                   |
| **Pagination**           | Offset-based (Prisma)               | Inefficient for large offsets | Use cursor-based pagination               |

---

## 8. Write Pressure & MVCC Optimization

### High-Write Tables

| Table            | Estimated Write Rate | Insert Pattern     | Update Pattern      | Vacuum Risk | Bloat Mitigation             |
| ---------------- | -------------------- | ------------------ | ------------------- | ----------- | ---------------------------- |
| `usage_events`   | 100-1000/min         | Single insert      | None (append-only)  | **HIGH**    | Partition by date?           |
| `api_call_logs`  | 50-500/min           | Single insert      | None (append-only)  | **HIGH**    | Partition by date?           |
| `stripe_events`  | 10-100/min           | Single insert      | Update (status)     | Medium      | Index on `status`            |
| `audit_logs`     | 10-50/min            | Single insert      | None (append-only)  | Medium      | Partition by date?           |
| `usage_counters` | 10-50/min            | Upsert (increment) | **High contention** | **HIGH**    | Buffer writes, batch updates |

**Key Findings**:

- **CRITICAL**: `usage_counters` table uses `UPDATE count = count + 1` pattern (hot row contention)
- **CRITICAL**: Append-only tables not partitioned (will cause VACUUM issues at scale)
- **NO write buffering**: All writes are synchronous (blocks API response)
- **NO batch inserts**: Usage events and logs inserted one-by-one
- **OPPORTUNITY**: Implement buffered writes via Redis queue + periodic flush

---

## 9. Operational Guardrails

| Guardrail                     | Implemented | Evidence                         | Gaps                                  |
| ----------------------------- | ----------- | -------------------------------- | ------------------------------------- |
| **Query timeout enforcement** | Partial     | Prisma: 30s statement timeout    | Supabase client: No explicit timeout  |
| **Row count limits**          | Partial     | Some endpoints use `limit` param | No enforced max (can fetch unbounded) |
| **Backfill throttling**       | No          | N/A                              | Large backfills can saturate DB       |
| **Transaction time limits**   | No          | N/A                              | Long transactions not killed          |
| **Connection pool alerts**    | No          | N/A                              | No monitoring on pool saturation      |
| **Slow query logging**        | No          | N/A                              | No `pg_stat_statements` access        |
| **Read replica fallback**     | No          | N/A                              | No read replicas configured           |

**Key Findings**:

- **No automated circuit breakers** for dangerous operations
- **No query governor** (e.g., kill queries exceeding row count threshold)
- **No proactive monitoring** of connection pool health
- **RISK**: Unbounded backfills (e.g., Stripe sync) can cause outages

---

## 10. Observability & Monitoring

| Metric                            | Instrumentation | Alerting | Dashboard |
| --------------------------------- | --------------- | -------- | --------- |
| **DB Connection Pool**            | No              | No       | No        |
| **Query Latency (p50, p95, p99)** | No              | No       | No        |
| **Slow Queries**                  | No              | No       | No        |
| **RLS Policy Performance**        | No              | No       | No        |
| **Cache Hit Rate**                | No              | No       | No        |
| **Write Throughput**              | No              | No       | No        |
| **Error Rate (by table)**         | No              | No       | No        |
| **API Response Time**             | Partial (logs)  | No       | No        |

**Key Findings**:

- **No database observability** beyond basic Supabase dashboard
- **No query performance monitoring** (no `pg_stat_statements` integration)
- **No connection pool metrics** exposed
- **CRITICAL GAP**: Cannot identify slow queries or hot tables
- **OPPORTUNITY**: Integrate Supabase metrics into application monitoring

---

## 11. Multi-Tenancy & RLS

| Aspect                     | Implementation                             | Security            | Performance                    |
| -------------------------- | ------------------------------------------ | ------------------- | ------------------------------ |
| **Tenant Isolation**       | RLS via `tenant_id` column                 | Strong              | Good (indexed)                 |
| **RLS Policy Pattern**     | `tenant_id IN (SELECT get_user_org_ids())` | Secure              | Function call overhead         |
| **Service Role Usage**     | Admin endpoints only                       | Proper              | Bypasses RLS (risk if misused) |
| **Cross-Tenant Queries**   | Manually filtered in service role          | Requires discipline | Prone to errors                |
| **Tenant Context Caching** | `get_user_org_ids()` called per query      | N/A                 | Can be expensive               |

**Key Findings**:

- **RLS is correctly enforced** on all user-facing tables
- **Service role limited to admin endpoints** (good isolation)
- **RISK**: `get_user_org_ids()` function called per RLS check (no caching at DB level)
- **OPPORTUNITY**: Cache tenant membership in Redis (reduce RLS function calls)

---

## 12. Supabase Plan & Replica Readiness

| Feature                | Current Plan                 | Replica Support | Cost          | Scaling Path                           |
| ---------------------- | ---------------------------- | --------------- | ------------- | -------------------------------------- |
| **Primary DB**         | Supabase Pro (likely)        | 1 primary       | $25/mo base   | Upgrade to Team ($599/mo) for replicas |
| **Read Replicas**      | Not available                | N/A             | N/A           | Requires Supabase Team plan            |
| **Connection Pooling** | PgBouncer (transaction mode) | Yes             | Included      | N/A                                    |
| **Storage**            | Unknown                      | N/A             | Paid per GB   | N/A                                    |
| **Compute**            | Unknown                      | N/A             | Paid per hour | N/A                                    |

**Key Findings**:

- **No read replicas** on current plan
- **Logical replica behavior**: Must implement via aggressive caching
- **Cost-effective scaling path**:
  1. Optimize queries + add indexes (free)
  2. Implement Redis-backed caching (Upstash: $10/mo)
  3. Add read replicas (requires plan upgrade: $574/mo increase)

---

## ARCHITECTURE TRUTH TABLE: Summary Verdict

### ✅ Strengths

1. **RLS enforcement** is consistent and secure
2. **Connection pooling** is configured (Prisma + Supabase)
3. **Multi-tenancy** is properly isolated
4. **Rate limiting** exists on API endpoints
5. **Graceful degradation** (routes return empty data instead of 500s)

### ⚠️ Weaknesses

1. **No read replica support** (current plan limitation)
2. **No write buffering** (all writes synchronous)
3. **No cache stampede protection** (single-flight pattern)
4. **No database observability** (slow query monitoring)
5. **Hot table contention** (`usage_counters` update pattern)
6. **Append-only tables not partitioned** (VACUUM bloat risk)
7. **No circuit breakers** for expensive operations
8. **Aggregations computed in-app** (not at DB layer)

### 🔥 Critical Risks

1. **Webhook storms** can saturate connection pool
2. **Large CSV imports** can block other requests
3. **Usage counter updates** can cause hot row contention
4. **Unbounded backfills** can cause outages
5. **No query timeouts** on Supabase client queries

---

## NEXT STEPS

**Phase 1**: Audit Checklist (A-F)
**Phase 2**: Implement Fixes
**Phase 3**: Verification
**Phase 4**: Final Verdict

**Continue to**: `01-findings.md`
