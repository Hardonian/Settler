# Performance Optimization Guide

This guide summarizes all performance optimizations implemented for 10x scale.

## Database Performance

### Indexes

**Composite Indexes** (`performance-indexes.sql`):

- `idx_jobs_tenant_created_at`: (tenant_id, created_at DESC)
- `idx_executions_tenant_status_started`: (tenant_id, status, started_at DESC)
- `idx_matches_tenant_job_confidence`: (tenant_id, job_id, confidence DESC)

**Partial Indexes**:

- `idx_jobs_active_tenant_created`: Active jobs only
- `idx_executions_running_tenant_started`: Running executions only
- `idx_webhook_deliveries_pending_retry`: Failed webhooks pending retry

**GIN Indexes**:

- `idx_jobs_rules_gin`: JSONB rules column
- `idx_executions_summary_gin`: JSONB summary column
- `idx_reports_summary_gin`: JSONB summary column

**Covering Indexes**:

- `idx_jobs_list_covering`: Includes frequently accessed columns

### Table Partitioning

**Monthly Partitions** (`table-partitions.sql`):

- `executions_partitioned`: Partitioned by `started_at`
- `matches_partitioned`: Partitioned by `matched_at`
- `unmatched_partitioned`: Partitioned by `created_at`
- `audit_logs_partitioned`: Partitioned by `timestamp`

**Benefits**:

- Faster queries (smaller partitions to scan)
- Easier data retention (drop old partitions)
- Better maintenance (VACUUM, ANALYZE per partition)

### Materialized Views

**Pre-computed Views** (`materialized-views.sql`):

- `mv_reconciliation_summary_daily`: Daily reconciliation summaries
- `mv_job_performance`: Job performance metrics
- `mv_tenant_usage_hourly`: Hourly tenant usage
- `mv_match_accuracy_by_job`: Match accuracy by job

**Refresh Strategy**:

- Daily summary: Every hour
- Hourly usage: Every 15 minutes
- Job performance: Every hour
- Match accuracy: Daily

## API Performance

### Compression

**Gzip Compression**:

- Level 6 (balance between speed and ratio)
- Threshold: 1KB (only compress larger responses)
- Applied to JSON, text, HTML responses

**Brotli Compression**:

- Higher compression ratio than Gzip
- Applied when client accepts Brotli
- Fallback to Gzip if Brotli fails

### Caching

**Redis Caching** (`utils/cache.ts`):

- In-memory fallback for development
- Redis for production
- TTL-based expiration
- Pattern-based deletion

**Cache Strategy**:

- Reconciliation summaries: 60 seconds
- Job lists: 5 minutes
- Static data: 1 hour

### ETags

**HTTP ETags** (`middleware/etag.ts`):

- MD5 hash of response body
- Client sends `If-None-Match` header
- Server returns 304 Not Modified if unchanged
- Reduces bandwidth and server load

### Cursor Pagination

**Implementation** (`utils/pagination.ts`):

- Base64-encoded cursor: `{created_at, id}`
- WHERE clause: `(created_at, id) < (cursor.created_at, cursor.id)`
- ORDER BY: `created_at DESC, id DESC`
- Avoids OFFSET performance issues

**Benefits**:

- Consistent performance regardless of page number
- No need to scan skipped rows
- Works well with indexes

## Query Optimization Examples

See `packages/api/src/db/query-optimizations.md` for detailed examples:

1. **List Jobs**: 99.4% faster (234ms → 1.5ms)
2. **Execution Status**: 99.6% faster (12.6ms → 0.06ms)
3. **Matches Query**: 96.4% faster (67.9ms → 2.5ms)
4. **Cursor Pagination**: 99.7% faster (456ms → 1.5ms)
5. **Batch Reads**: Reduced from 101 queries to 1 query

## Observability

### Metrics (Prometheus)

**RED Metrics**:

- Rate: `http_requests_total`
- Errors: `http_request_errors_total`
- Duration: `http_request_duration_seconds`

**Business Metrics**:

- `reconciliations_total`
- `reconciliation_duration_seconds`
- `match_rate`

### Tracing (OpenTelemetry)

**Automatic Instrumentation**:

- HTTP server spans
- Database query spans
- Cache operation spans
- Queue operation spans

**Business Spans**:

- Reconciliation pipeline segments
- Adapter calls
- Matching operations

### Logging

**Structured Logging**:

- JSON format
- Trace ID correlation
- Tenant ID context
- PII redaction

**Log Sampling**:

- Errors: Always logged
- Info/Warn/Debug: Sampled (configurable)

## Performance Targets

### API Endpoints

| Endpoint                                | p50    | p95     | p99     |
| --------------------------------------- | ------ | ------- | ------- |
| POST /api/v1/jobs                       | < 50ms | < 200ms | < 500ms |
| GET /api/v1/jobs                        | < 30ms | < 100ms | < 200ms |
| GET /api/v1/jobs/:id                    | < 20ms | < 50ms  | < 100ms |
| GET /api/v1/reconciliations/:id/summary | < 10ms | < 50ms  | < 100ms |

### Database Queries

| Query Type      | Target  |
| --------------- | ------- |
| Simple SELECT   | < 10ms  |
| JOIN queries    | < 50ms  |
| Aggregations    | < 100ms |
| Complex queries | < 200ms |

## Monitoring

### Key Metrics to Watch

1. **Error Rate**: Should be < 1%
2. **p95 Latency**: Should be < 200ms
3. **Database Pool**: Should be < 80% utilization
4. **Queue Depth**: Should be < 1000
5. **Cache Hit Rate**: Should be > 50%

### Grafana Dashboards

- **API Performance**: Request rate, error rate, latency
- **Business Metrics**: Reconciliations, match rate, failure rate
- **System Health**: Database connections, queue depth, cache hit rate

## Best Practices

1. **Always use indexes**: Check EXPLAIN ANALYZE for query plans
2. **Use cursor pagination**: Avoid OFFSET for large datasets
3. **Batch reads**: Use JOINs instead of N+1 queries
4. **Cache aggressively**: Cache frequently accessed data
5. **Monitor everything**: Track metrics, traces, logs
6. **Test at scale**: Run load tests regularly
7. **Optimize incrementally**: Measure, optimize, measure again

## Checklist

- [ ] Database indexes created and analyzed
- [ ] Table partitions configured
- [ ] Materialized views created and refreshed
- [ ] Compression enabled (Gzip/Brotli)
- [ ] ETags implemented for GET endpoints
- [ ] Caching strategy defined and implemented
- [ ] Cursor pagination implemented
- [ ] Query optimizations applied
- [ ] Observability stack configured
- [ ] Load tests passing
- [ ] Performance targets met
