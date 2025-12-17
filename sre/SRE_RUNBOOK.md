# SRE Runbook

This runbook provides step-by-step remediation instructions for common incidents and how to interpret dashboards.

## Dashboard Interpretation

### Grafana Dashboard: API Performance

**Key Panels:**
1. **Request Rate (RPS)**: Should be steady. Spikes indicate traffic surge or DDoS.
2. **Error Rate**: Should be < 1%. Increases indicate bugs or infrastructure issues.
3. **Latency (p50/p95/p99)**: 
   - p50 should be < 50ms
   - p95 should be < 200ms (target)
   - p99 should be < 500ms
4. **Database Connection Pool**: Should be < 80% utilization.
5. **Queue Depth**: Should be < 1000. Growing indicates processing bottleneck.

### Grafana Dashboard: Business Metrics

**Key Panels:**
1. **Reconciliations/Hour**: Track business activity.
2. **Match Rate**: Should be > 80% for healthy reconciliations.
3. **Failure Rate**: Should be < 5%.
4. **Tenant Usage**: Identify noisy neighbors (> 50% resource usage).

### Prometheus Queries

```promql
# Error rate by endpoint
rate(http_request_errors_total[5m]) / rate(http_requests_total[5m])

# p95 latency by endpoint
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Database connection pool usage
active_connections / pg_stat_database_max_connections

# Queue backlog
queue_depth

# Reconciliation success rate
rate(reconciliations_total{status="completed"}[10m]) / rate(reconciliations_total[10m])
```

## Incident Response Procedures

### Incident: High Error Rate (> 5%)

**Symptoms:**
- Error rate > 5% for 5+ minutes
- Alert: `HighErrorRate`

**Investigation Steps:**
1. Check Grafana dashboard for error patterns:
   ```promql
   sum by (route, status_code) (rate(http_request_errors_total[5m]))
   ```
2. Check application logs for error patterns:
   ```bash
   kubectl logs -f deployment/settler-api | grep ERROR
   ```
3. Check database connection pool:
   ```promql
   active_connections
   ```
4. Check external API status (if using adapters)

**Remediation:**
- **If specific endpoint**: Check recent deployments, rollback if needed
- **If database errors**: Check connection pool, scale up if needed
- **If external API errors**: Enable circuit breaker, check adapter health
- **If memory/CPU**: Scale horizontally

**Post-Incident:**
- Review error logs
- Update runbook with new patterns
- Create incident post-mortem

---

### Incident: High Latency (p95 > 200ms)

**Symptoms:**
- p95 latency > 200ms for 5+ minutes
- Alert: `HighLatency`

**Investigation Steps:**
1. Identify slow endpoints:
   ```promql
   histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) by (route)
   ```
2. Check database query performance:
   ```sql
   SELECT query, mean_exec_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_exec_time DESC 
   LIMIT 10;
   ```
3. Check cache hit rate:
   ```promql
   sum(rate(http_requests_total{cache="HIT"}[5m])) / sum(rate(http_requests_total[5m]))
   ```
4. Check queue depth:
   ```promql
   queue_depth
   ```

**Remediation:**
- **If database slow**: 
  - Check for missing indexes: `EXPLAIN ANALYZE` on slow queries
  - Add indexes if needed
  - Consider read replicas for heavy read workloads
- **If cache hit rate low**:
  - Increase cache TTL
  - Check cache eviction policies
- **If queue backlog**:
  - Scale worker processes
  - Check for stuck jobs
- **If specific endpoint**:
  - Optimize query (use cursor pagination, batch reads)
  - Add caching layer

**Post-Incident:**
- Document slow queries
- Create optimization tickets
- Update query optimization guide

---

### Incident: Database Connection Pool Exhausted

**Symptoms:**
- Connection pool > 90% utilization
- Alert: `DatabasePoolExhausted`
- Database errors: "too many connections"

**Investigation Steps:**
1. Check active connections:
   ```sql
   SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
   ```
2. Check long-running queries:
   ```sql
   SELECT pid, now() - query_start as duration, query 
   FROM pg_stat_activity 
   WHERE state = 'active' AND now() - query_start > interval '5 seconds';
   ```
3. Check connection pool configuration:
   ```bash
   kubectl get configmap settler-api-config -o yaml | grep max
   ```

**Remediation:**
1. **Immediate**: Kill long-running queries (if safe):
   ```sql
   SELECT pg_terminate_backend(pid) 
   FROM pg_stat_activity 
   WHERE pid IN (SELECT pid FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > interval '30 seconds');
   ```
2. **Short-term**: Increase connection pool size:
   ```yaml
   database:
     max: 50  # Increase from 20
   ```
3. **Long-term**: 
   - Optimize slow queries
   - Use connection pooling (PgBouncer)
   - Scale database read replicas

**Post-Incident:**
- Review query patterns
- Set up query timeout alerts
- Document connection pool best practices

---

### Incident: Queue Backlog

**Symptoms:**
- Queue depth > 1000
- Alert: `QueueBacklog`
- Reconciliation jobs delayed

**Investigation Steps:**
1. Check queue depth by priority:
   ```promql
   queue_depth by (priority)
   ```
2. Check worker processing rate:
   ```promql
   rate(reconciliation_processing_total[5m])
   ```
3. Check for stuck jobs:
   ```sql
   SELECT id, status, started_at 
   FROM executions 
   WHERE status = 'running' AND started_at < NOW() - INTERVAL '1 hour';
   ```

**Remediation:**
1. **Immediate**: Scale worker processes:
   ```bash
   kubectl scale deployment settler-workers --replicas=10
   ```
2. **If stuck jobs**: Mark as failed and retry:
   ```sql
   UPDATE executions 
   SET status = 'failed', error = 'Timeout' 
   WHERE status = 'running' AND started_at < NOW() - INTERVAL '1 hour';
   ```
3. **Long-term**:
   - Optimize reconciliation processing
   - Implement job prioritization
   - Add auto-scaling based on queue depth

**Post-Incident:**
- Review job processing patterns
- Optimize slow reconciliations
- Implement job timeout policies

---

### Incident: High Reconciliation Failure Rate

**Symptoms:**
- Failure rate > 10%
- Alert: `HighReconciliationFailureRate`

**Investigation Steps:**
1. Check failure reasons:
   ```sql
   SELECT error, COUNT(*) 
   FROM executions 
   WHERE status = 'failed' AND started_at > NOW() - INTERVAL '1 hour'
   GROUP BY error 
   ORDER BY COUNT(*) DESC;
   ```
2. Check adapter health:
   ```promql
   rate(adapter_errors_total[10m]) by (adapter)
   ```
3. Check external API status

**Remediation:**
- **If adapter errors**: Check adapter credentials, API limits
- **If data quality issues**: Review matching rules, add validation
- **If timeout errors**: Increase timeout, optimize queries
- **If rate limit errors**: Implement backoff, check quotas

**Post-Incident:**
- Review failure patterns
- Update adapter error handling
- Improve error messages

---

### Incident: Tenant Quota Exceeded

**Symptoms:**
- Tenant quota usage > 95%
- Alert: `TenantQuotaExceeded`

**Investigation Steps:**
1. Check quota usage:
   ```promql
   tenant_quota_usage / tenant_quota_limit by (tenant_id, quota_type)
   ```
2. Check tenant activity:
   ```sql
   SELECT tenant_id, COUNT(*) as reconciliation_count
   FROM executions
   WHERE started_at > NOW() - INTERVAL '24 hours'
   GROUP BY tenant_id
   ORDER BY reconciliation_count DESC;
   ```

**Remediation:**
1. **Notify tenant**: Send quota warning email
2. **Temporary increase**: If justified, temporarily increase quota
3. **Upgrade path**: Suggest tier upgrade
4. **Rate limiting**: Enforce rate limits more strictly

**Post-Incident:**
- Review quota policies
- Update quota monitoring
- Improve quota warnings

---

## Incident Post-Mortem Template

```markdown
# Incident Post-Mortem: [Title]

## Summary
- **Date**: [Date]
- **Duration**: [Duration]
- **Severity**: [Critical/Warning/Info]
- **Impact**: [Description]

## Timeline
- [Time] - Incident detected
- [Time] - Investigation started
- [Time] - Remediation applied
- [Time] - Incident resolved

## Root Cause
[Description of root cause]

## Impact
- **Users Affected**: [Number]
- **API Errors**: [Rate]
- **Latency Impact**: [Description]

## Remediation
[Steps taken to resolve]

## Prevention
- [ ] Update monitoring/alerts
- [ ] Update runbook
- [ ] Code changes needed
- [ ] Infrastructure changes needed

## Action Items
- [ ] [Action item 1]
- [ ] [Action item 2]
```

## Emergency Contacts

- **On-Call Engineer**: [Contact]
- **Database Team**: [Contact]
- **Infrastructure Team**: [Contact]
- **Product Team**: [Contact]

## Useful Commands

```bash
# Check API health
curl https://api.settler.com/health

# Check metrics
curl https://api.settler.com/metrics | grep http_request_duration

# View logs
kubectl logs -f deployment/settler-api --tail=100

# Scale deployment
kubectl scale deployment settler-api --replicas=5

# Restart deployment
kubectl rollout restart deployment/settler-api

# Check database connections
psql -h db.settler.com -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```
