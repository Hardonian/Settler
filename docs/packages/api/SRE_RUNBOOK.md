# SRE Runbook: Settler Multi-Tenant Platform

## Table of Contents
1. [Overview](#overview)
2. [Monitoring & Alerts](#monitoring--alerts)
3. [Common Issues & Resolutions](#common-issues--resolutions)
4. [Incident Response](#incident-response)
5. [Maintenance Procedures](#maintenance-procedures)
6. [Performance Tuning](#performance-tuning)

## Overview

Settler is a multi-tenant reconciliation platform with:
- **Data Isolation**: Postgres RLS, schema-per-tenant
- **Resource Quotas**: Rate limits, storage, concurrent jobs
- **Observability**: OpenTelemetry tracing, Prometheus metrics
- **Feature Flags**: Per-tenant/user flags with A/B testing

### Key Components

- **API Server**: Express.js application (`packages/api`)
- **Database**: PostgreSQL with RLS policies
- **Cache/Queue**: Redis (BullMQ)
- **Observability**: OpenTelemetry + Prometheus + Grafana

## Monitoring & Alerts

### Critical Alerts

#### 1. High Error Rate
- **Metric**: `rate(http_request_errors_total[5m])`
- **Threshold**: > 10 errors/sec
- **Action**: Check logs, investigate failing endpoints

#### 2. High Latency (p95)
- **Metric**: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
- **Threshold**: > 2 seconds
- **Action**: Check database queries, cache hit rates, queue depth

#### 3. Database Connection Exhaustion
- **Metric**: `active_connections`
- **Threshold**: > 80% of max pool size
- **Action**: Increase pool size or investigate connection leaks

#### 4. Quota Exhaustion
- **Metric**: `tenant_quota_usage / tenant_quota_limit`
- **Threshold**: > 90%
- **Action**: Contact tenant, offer upgrade, or increase quota temporarily

#### 5. Noisy Neighbor Detection
- **Metric**: `tenant_resource_usage_seconds`
- **Threshold**: 3x average usage
- **Action**: Investigate tenant, consider throttling or isolation

### Warning Alerts

- Queue depth > 1000 jobs
- Rate limit hits > 100/min for single tenant
- Storage usage > 80% of quota
- Feature flag changes (audit)

## Common Issues & Resolutions

### Issue: Tenant Cannot Access Data

**Symptoms**: Tenant reports "TenantNotFound" or empty results

**Diagnosis**:
```sql
-- Check tenant status
SELECT id, name, slug, status, tier FROM tenants WHERE slug = 'tenant-slug';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Verify tenant context
SELECT current_setting('app.current_tenant_id', true);
```

**Resolution**:
1. Verify tenant exists and is active
2. Check tenant context middleware is setting tenant ID
3. Verify RLS policies are enabled
4. Check for tenant_id NULL values in data

### Issue: Quota Exceeded Errors

**Symptoms**: 429 responses, "QuotaExceeded" errors

**Diagnosis**:
```sql
-- Check quota usage
SELECT 
  t.id,
  t.tier,
  tq.current_storage_bytes,
  (t.quotas->>'storageBytes')::BIGINT as limit
FROM tenants t
LEFT JOIN tenant_quota_usage tq ON t.id = tq.tenant_id
WHERE t.id = 'tenant-id';
```

**Resolution**:
1. Verify quota limits are correct for tier
2. Check if usage tracking is accurate
3. Consider temporary quota increase
4. Recommend tier upgrade

### Issue: High Database Load

**Symptoms**: Slow queries, connection pool exhaustion

**Diagnosis**:
```sql
-- Check active queries
SELECT pid, state, query_start, query 
FROM pg_stat_activity 
WHERE state = 'active';

-- Check slow queries
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

**Resolution**:
1. Identify slow queries and optimize
2. Add indexes if missing
3. Consider read replicas for read-heavy workloads
4. Enable query caching

### Issue: Rate Limiting Too Aggressive

**Symptoms**: Legitimate requests being rate limited

**Diagnosis**:
```bash
# Check rate limit metrics
curl http://localhost:3000/metrics | grep tenant_rate_limit_hits_total
```

**Resolution**:
1. Review tenant tier and rate limits
2. Adjust token bucket configuration
3. Consider adaptive rate limiting
4. Temporarily increase limits for affected tenant

### Issue: Feature Flag Not Working

**Symptoms**: Feature flag returns wrong value

**Diagnosis**:
```sql
-- Check feature flag configuration
SELECT * FROM feature_flags 
WHERE name = 'flag-name' 
AND (tenant_id = 'tenant-id' OR tenant_id IS NULL)
ORDER BY user_id DESC NULLS LAST, tenant_id DESC NULLS LAST;

-- Check feature flag changes
SELECT * FROM feature_flag_changes 
WHERE feature_flag_id = 'flag-id'
ORDER BY created_at DESC;
```

**Resolution**:
1. Verify flag hierarchy (user > tenant > global)
2. Check rollout percentage for A/B testing
3. Verify flag is not disabled by kill switch
4. Check cache (if caching flags)

## Incident Response

### Severity Levels

**P0 - Critical**: Service down, data loss, security breach
- **Response Time**: Immediate (< 5 min)
- **Escalation**: On-call engineer → Engineering lead → CTO

**P1 - High**: Major feature broken, significant performance degradation
- **Response Time**: < 15 min
- **Escalation**: On-call engineer → Engineering lead

**P2 - Medium**: Minor feature broken, moderate performance issues
- **Response Time**: < 1 hour
- **Escalation**: On-call engineer

**P3 - Low**: Cosmetic issues, minor bugs
- **Response Time**: < 24 hours
- **Escalation**: Regular support

### Incident Response Process

1. **Acknowledge**: Confirm alert, assess severity
2. **Investigate**: Check logs, metrics, traces
3. **Mitigate**: Apply temporary fix if needed
4. **Resolve**: Implement permanent fix
5. **Post-Mortem**: Document learnings

### Emergency Contacts

- **On-Call**: Check PagerDuty
- **Engineering Lead**: [Contact Info]
- **Database Admin**: [Contact Info]
- **Infrastructure**: [Contact Info]

## Maintenance Procedures

### Database Migrations

```bash
# Run migrations
npm run migrate

# Rollback (if needed)
npm run migrate:rollback

# Verify migration status
psql -d settler -c "SELECT * FROM schema_migrations;"
```

### Tenant Onboarding

1. Create tenant via API or admin panel
2. Verify tenant schema created (if schema-per-tenant enabled)
3. Create owner user
4. Initialize quota usage tracking
5. Send welcome email

### Tenant Offboarding

1. Export tenant data (if required)
2. Mark tenant as deleted (soft delete)
3. Schedule hard delete after retention period
4. Clean up tenant schema (if schema-per-tenant)
5. Archive audit logs

### Feature Flag Rollout

1. Create flag with 0% rollout
2. Test with specific tenant/user
3. Gradually increase rollout percentage
4. Monitor error rates and performance
5. Roll back if issues detected

### Quota Adjustments

```sql
-- Increase quota temporarily
UPDATE tenants 
SET quotas = jsonb_set(
  quotas, 
  '{storageBytes}', 
  '2147483648'::jsonb
)
WHERE id = 'tenant-id';

-- Reset usage (use with caution)
UPDATE tenant_quota_usage
SET current_storage_bytes = 0
WHERE tenant_id = 'tenant-id';
```

## Performance Tuning

### Database Optimization

1. **Indexes**: Ensure indexes on tenant_id, foreign keys
2. **Connection Pooling**: Adjust pool size based on load
3. **Query Optimization**: Use EXPLAIN ANALYZE, add indexes
4. **Partitioning**: Consider partitioning large tables by tenant_id

### Cache Strategy

1. **Tenant Data**: Cache tenant config, quotas
2. **Feature Flags**: Cache flags per tenant/user
3. **Rate Limits**: Use Redis for token bucket state
4. **TTL**: Set appropriate TTLs (5-15 min for tenant data)

### Rate Limiting Tuning

```typescript
// Adjust token bucket config
const config = {
  capacity: 1000,      // Max tokens
  refillRate: 100,     // Tokens per second
  adaptive: true,       // Enable adaptive limiting
};
```

### Queue Configuration

- **Concurrency**: Adjust based on worker capacity
- **Priority**: Ensure enterprise tenants bypass queue
- **Retries**: Configure exponential backoff
- **Dead Letter**: Handle failed jobs appropriately

## Useful Commands

### Check Tenant Status
```sql
SELECT id, name, slug, tier, status, 
       quotas->>'storageBytes' as storage_limit,
       (SELECT current_storage_bytes FROM tenant_quota_usage WHERE tenant_id = tenants.id) as storage_used
FROM tenants
WHERE slug = 'tenant-slug';
```

### View Recent Errors
```sql
SELECT * FROM audit_logs
WHERE status_code >= 500
ORDER BY timestamp DESC
LIMIT 100;
```

### Check Feature Flags
```sql
SELECT name, enabled, rollout_percentage, tenant_id, user_id
FROM feature_flags
WHERE deleted_at IS NULL
ORDER BY name, tenant_id NULLS LAST;
```

### Monitor Queue Depth
```bash
# Via Redis CLI
redis-cli LLEN bull:reconciliation:wait
redis-cli LLEN bull:reconciliation:active
```

## Escalation Path

1. **Level 1**: On-call engineer (check runbook)
2. **Level 2**: Engineering lead (complex issues)
3. **Level 3**: CTO/Founder (critical incidents)

## Post-Incident Checklist

- [ ] Root cause identified
- [ ] Permanent fix implemented
- [ ] Monitoring/alerting updated
- [ ] Documentation updated
- [ ] Post-mortem written
- [ ] Action items tracked
- [ ] Team notified
