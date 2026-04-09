# Future Scaling Roadmap

**Date**: 2026-01-24
**Purpose**: When to scale horizontally (replicas, sharding) vs. vertically (bigger box)

---

## Scaling Decision Framework

### When to Optimize Further (Before Scaling Out)

**Current Capacity**: ~1000-5000 requests/min (est.)
**Target Capacity**: 10,000-50,000 requests/min before horizontal scaling

#### Wave 1: Free Optimizations (Already Implemented) ✅

- ✅ Query timeout enforcement
- ✅ Row limit enforcement
- ✅ Composite indexes (10+)
- ✅ VACUUM tuning for hot tables
- ✅ Query observability

**Result**: 3-5x capacity improvement
**Cost**: $0

#### Wave 2: Low-Cost Optimizations ($10-20/mo)

- ✅ Redis-backed query caching
- ✅ Write buffering (batch inserts)
- ✅ Single-flight pattern (cache stampede protection)
- ⏳ Convert usage counters to append-only events

**Result**: 5-10x capacity improvement (cumulative)
**Cost**: $10-20/mo (Upstash Redis)

#### Wave 3: Medium-Cost Optimizations ($50-100/mo)

- ⏳ Table partitioning (usage_events, api_call_logs)
- ⏳ Materialized views for dashboards
- ⏳ Background job queue (BullMQ + Redis)
- ⏳ Advanced caching (edge CDN for public data)

**Result**: 10-20x capacity improvement (cumulative)
**Cost**: $50-100/mo (Sentry, Redis upgrades, CDN)

---

## When to Add Read Replicas

### Signals to Watch

| Signal               | Threshold                    | Action                          |
| -------------------- | ---------------------------- | ------------------------------- |
| **Primary CPU**      | >70% sustained               | Consider replicas               |
| **Primary QPS**      | >5000 sustained              | Consider replicas               |
| **Read/Write Ratio** | >80% reads                   | Strong candidate for replicas   |
| **P95 Read Latency** | >200ms (after optimizations) | Consider replicas               |
| **Cache Hit Rate**   | <50% (despite 60s TTL)       | Consider replicas or longer TTL |

### Cost-Benefit Analysis

**Supabase Team Plan** (required for replicas):

- **Cost**: $599/mo (from current $25/mo)
- **Benefit**: 2-5 read replicas, 20-50x read capacity
- **Break-even**: When read load exceeds single primary capacity

**Alternative: Read-Through Caching**:

- **Cost**: $20-50/mo (Redis + CDN)
- **Benefit**: 10-100x read capacity (for cacheable queries)
- **Break-even**: Always cheaper for cacheable data

**Recommendation**: Exhaust caching strategies before adding replicas.

---

## When to Shard / Partition

### DO NOT SHARD Unless:

1. **Single-tenant data exceeds 1TB** (rare for SaaS)
2. **Single table exceeds 100GB** (partition first)
3. **Write load exceeds single-primary capacity** (>100k writes/min)
4. **Query latency cannot be solved with indexes** (extremely rare)

### Sharding Strategy (If Needed)

#### Option 1: Tenant-Based Sharding

```
Shard 0: tenant_id % 4 == 0
Shard 1: tenant_id % 4 == 1
Shard 2: tenant_id % 4 == 2
Shard 3: tenant_id % 4 == 3
```

**Pros**: Easy cross-tenant isolation, predictable distribution
**Cons**: Cross-shard joins impossible, rebalancing hard

#### Option 2: Table Partitioning (Native Postgres)

```sql
-- Partition by date (for time-series tables)
CREATE TABLE usage_events (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL,
  ...
) PARTITION BY RANGE (timestamp);

CREATE TABLE usage_events_2026_01 PARTITION OF usage_events
FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Postgres automatically prunes partitions for WHERE timestamp filters
```

**Pros**: No application changes, automatic pruning, easier to manage
**Cons**: Limited to range/list partitioning

**Recommendation**: Use table partitioning FIRST (native Postgres), shard ONLY if single-node primary capacity is exceeded.

---

## Capacity Planning Calculator

### Assumptions

- Average query: 20ms
- Average write: 50ms
- Connection pool: 20 connections
- Cache hit rate: 60%

### Throughput Estimates

| Configuration            | Reads/min | Writes/min | Total Requests/min | Cost/mo |
| ------------------------ | --------- | ---------- | ------------------ | ------- |
| **Current (optimized)**  | 3000      | 1000       | 4000               | $25     |
| **+ Aggressive Caching** | 12000     | 1000       | 13000              | $35     |
| **+ Write Buffering**    | 12000     | 3000       | 15000              | $35     |
| **+ Read Replica (1)**   | 24000     | 3000       | 27000              | $599    |
| **+ Read Replicas (3)**  | 60000     | 3000       | 63000              | $599    |

### Cost-Effective Scaling Order

1. **0-5k req/min**: Current setup + Wave 1 optimizations ($25/mo)
2. **5-15k req/min**: + Redis caching + write buffering ($35/mo)
3. **15-30k req/min**: + Table partitioning + CDN ($85/mo)
4. **30k+ req/min**: + Read replicas (Supabase Team: $599/mo)
5. **100k+ req/min**: + Sharding or multi-region (custom)

---

## Monitoring for Scaling Decisions

### Key Metrics to Track

#### 1. Database CPU (Supabase Dashboard)

```
Current: 20-30% average
Warning: >50% sustained
Critical: >70% sustained

Action: If >70% for >1 hour, consider vertical scaling or replicas
```

#### 2. Query Load (QPS - Queries Per Second)

```
Current: 100-500 QPS
Warning: >2000 QPS sustained
Critical: >5000 QPS sustained

Action: If >2000 QPS, review caching strategies
```

#### 3. Connection Pool Saturation

```
Current: 30-50% utilization (6-10 active connections out of 20)
Warning: >75% utilization
Critical: >90% utilization

Action: If >75% for >10 minutes, investigate connection leaks or increase pool size
```

#### 4. Cache Hit Rate

```
Current: 0% (no caching yet)
Target: 60-80%
Warning: <50% after 1 week

Action: If <50%, review cache TTL and query patterns
```

#### 5. P95 Query Latency

```
Current: 500ms (before optimizations)
Target: <100ms
Warning: >200ms
Critical: >500ms

Action: If >200ms, identify slow queries and optimize
```

#### 6. Write Throughput (Inserts/min)

```
Current: 100-500 inserts/min
Warning: >5000 inserts/min
Critical: >10000 inserts/min

Action: If >5000, ensure write buffering is enabled
```

---

## When to Migrate to Dedicated Infrastructure

### Consider Dedicated DB When:

1. **Supabase limits are blocking** (e.g., no pg_stat_statements access)
2. **Cost exceeds $1000/mo** on Supabase Team plan
3. **Need for custom extensions** (e.g., TimescaleDB, PostGIS)
4. **Compliance requires** (e.g., on-prem, specific regions)
5. **Custom HA/DR requirements** (e.g., multi-region write)

### Migration Path

**Option 1: AWS RDS PostgreSQL**

- **Pros**: Full control, pg_stat_statements, custom extensions
- **Cons**: More ops burden, higher cost ($200-500/mo for equivalent capacity)

**Option 2: Heroku Postgres**

- **Pros**: Managed, good observability, familiar for Rails shops
- **Cons**: Higher cost than Supabase ($200-400/mo for equivalent)

**Option 3: Self-Managed (Kubernetes + CloudNativePG)**

- **Pros**: Full control, lowest cost at scale
- **Cons**: High ops burden, requires expertise

**Recommendation**: Stay on Supabase until $1000/mo cost or hard technical limits.

---

## Long-Term Architecture Vision

### Target Architecture (100k+ requests/min)

```
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                      │
│  (Next.js + Edge Functions + Background Workers)        │
└──────────────┬────────────────────────┬─────────────────┘
               │                        │
               ▼                        ▼
        ┌──────────────┐        ┌──────────────┐
        │   Redis      │        │   CDN        │
        │  (Caching +  │        │  (Public     │
        │   Queues)    │        │   Data)      │
        └──────┬───────┘        └──────────────┘
               │
               ▼
     ┌───────────────────────────┐
     │  Query Router (optional)  │
     └────────────┬──────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
  ┌──────────┐      ┌──────────────────┐
  │ Primary  │◄────►│  Read Replicas   │
  │  (Write) │      │  (1-5 nodes)     │
  └──────────┘      └──────────────────┘
        │
        ▼
  ┌──────────┐
  │  Backup  │
  │ & Archive│
  └──────────┘
```

### Cost Estimate (100k req/min)

- **Database**: Supabase Team + 3 replicas: $599/mo
- **Redis**: Upstash Pro: $50/mo
- **CDN**: Vercel/Cloudflare: $50/mo
- **Monitoring**: Sentry + Datadog: $100/mo
- **Total**: ~$800/mo

**Compare to**:

- **Current**: $25/mo (4k req/min) → $0.00625 per 1000 req
- **Future**: $800/mo (100k req/min) → $0.008 per 1000 req

**Unit economics improve** as you scale (economies of scale).

---

## Critical Decision Points

### Decision Matrix

| Monthly Active Users | Requests/min | Recommended Setup | Estimated Cost |
| -------------------- | ------------ | ----------------- | -------------- |
| 0-1,000              | 0-5k         | Current + Wave 1  | $25/mo         |
| 1,000-10,000         | 5-15k        | + Redis caching   | $35/mo         |
| 10,000-50,000        | 15-30k       | + Partitioning    | $85/mo         |
| 50,000-100,000       | 30-50k       | + Read replicas   | $599/mo        |
| 100,000+             | 50k+         | + Multi-region    | $1000+/mo      |

---

## Final Recommendations

### Short Term (0-6 months)

1. ✅ Implement Wave 1 optimizations (free, already done)
2. ⏳ Enable Redis caching ($10/mo)
3. ⏳ Enable write buffering (included)
4. ⏳ Convert usage counters to append-only events (free)

**Expected Result**: 5-10x capacity improvement, handles 15k req/min

### Medium Term (6-12 months)

1. ⏳ Add table partitioning for usage_events and api_call_logs
2. ⏳ Implement background job queue (BullMQ)
3. ⏳ Add Sentry for slow query monitoring

**Expected Result**: 10-20x capacity improvement, handles 30k req/min

### Long Term (12+ months)

1. ⏳ Add read replicas (Supabase Team plan: $599/mo)
2. ⏳ Implement query routing (read vs write separation)
3. ⏳ Consider multi-region deployment (if needed)

**Expected Result**: 20-50x capacity improvement, handles 100k req/min

---

## Conclusion

**Avoid premature optimization**. The optimizations already implemented provide 5-10x capacity improvement at zero cost. Add read replicas ONLY when:

- Primary CPU >70% sustained
- QPS >5000 sustained
- Cost-benefit analysis justifies $574/mo increase

**Before adding replicas**, exhaust these cheaper options:

- Increase cache TTL (free)
- Add materialized views (free)
- Implement CDN caching for public data ($20/mo)
- Upgrade Upstash Redis for more cache capacity ($20/mo)

**Continue to**: [00-architecture-truth.md](./00-architecture-truth.md) (for audit loop)
