# Settler Incident Response Runbook

**Version:** 1.0  
**Last Updated:** 2026-01-15

---

## Overview

This runbook provides step-by-step procedures for responding to incidents in the Settler platform. All incidents should be handled following these procedures to ensure consistent, effective response.

---

## Incident Severity Levels

### P0 - Critical

- **Impact**: Complete service outage or data loss
- **Response Time**: Immediate (on-call engineer)
- **Resolution Target**: 1 hour
- **Examples**: API completely down, database corruption, security breach

### P1 - High

- **Impact**: Major feature degradation affecting many users
- **Response Time**: 15 minutes
- **Resolution Target**: 4 hours
- **Examples**: Reconciliation jobs failing, webhook delivery issues, high error rates

### P2 - Medium

- **Impact**: Minor feature degradation affecting some users
- **Response Time**: 1 hour
- **Resolution Target**: 24 hours
- **Examples**: Slow API responses, adapter connection issues, dashboard errors

### P3 - Low

- **Impact**: Minor issues affecting few users
- **Response Time**: 4 hours
- **Resolution Target**: 72 hours
- **Examples**: UI bugs, documentation issues, minor performance degradation

---

## Incident Response Process

### 1. Detection

**Automated Detection:**

- Monitoring alerts (Datadog, Sentry)
- Health check failures
- Error rate thresholds exceeded
- Customer reports

**Manual Detection:**

- Customer support tickets
- Social media mentions
- Internal testing

### 2. Triage

**On-Call Engineer Responsibilities:**

1. Acknowledge incident within response time SLA
2. Assess severity level
3. Create incident ticket (PagerDuty, Linear, etc.)
4. Notify team via Slack (#incidents channel)
5. Begin investigation

**Incident Ticket Template:**

```
Title: [Severity] Brief description
Severity: P0/P1/P2/P3
Status: Investigating/Identified/Monitoring/Resolved
Affected Systems: [List systems]
Impact: [Description]
Timeline:
- [Time] - Detected
- [Time] - Investigating
- [Time] - Identified
- [Time] - Resolved
```

### 3. Investigation

**Checklist:**

- [ ] Review monitoring dashboards (Datadog, Grafana)
- [ ] Check error logs (Sentry, CloudWatch)
- [ ] Review recent deployments
- [ ] Check database status
- [ ] Verify external dependencies (Stripe, Shopify APIs)
- [ ] Review system metrics (CPU, memory, disk, network)

**Key Dashboards:**

- API Health: `https://grafana.settler.io/d/api-health`
- Database Status: `https://grafana.settler.io/d/db-status`
- Error Tracking: `https://sentry.io/settler/`

### 4. Communication

**Internal Communication:**

- Update #incidents Slack channel every 15 minutes
- Post updates to incident ticket
- Escalate to engineering lead if needed

**External Communication:**

- **P0/P1**: Post status page update immediately
- **P2/P3**: Post status page update within 1 hour
- Update customers via email if impact is significant

**Status Page Template:**

```
[Status] Brief description

We're currently investigating [issue description].
Impact: [What's affected]
ETA: [Expected resolution time]
```

### 5. Resolution

**Resolution Steps:**

1. Implement fix (hotfix, rollback, configuration change)
2. Verify fix in monitoring
3. Test affected functionality
4. Update incident ticket with resolution
5. Post resolution update to status page

**Post-Resolution:**

- [ ] Update monitoring if needed
- [ ] Document incident in post-mortem
- [ ] Schedule post-mortem meeting (within 48 hours for P0/P1)

---

## Common Incidents & Solutions

### API Completely Down (P0)

**Symptoms:**

- All API requests returning 500/503
- Health check endpoint failing
- No recent successful requests

**Investigation:**

1. Check application logs: `kubectl logs -f deployment/api`
2. Check database connectivity: `psql -h db.settler.io -U postgres -c "SELECT 1"`
3. Check Redis connectivity: `redis-cli -h redis.settler.io ping`
4. Review recent deployments: `git log --oneline -10`

**Common Causes & Solutions:**

**Database Connection Pool Exhausted:**

```bash
# Check connection count
psql -h db.settler.io -c "SELECT count(*) FROM pg_stat_activity;"

# Restart API pods to reset connections
kubectl rollout restart deployment/api
```

**Out of Memory:**

```bash
# Check memory usage
kubectl top pods

# Scale up pods
kubectl scale deployment/api --replicas=5
```

**Recent Deployment Issue:**

```bash
# Rollback to previous version
kubectl rollout undo deployment/api
```

---

### Reconciliation Jobs Failing (P1)

**Symptoms:**

- High failure rate for reconciliation jobs
- Error logs showing adapter connection failures
- Customer reports of failed reconciliations

**Investigation:**

1. Check job execution logs: `kubectl logs -f job/reconciliation-worker`
2. Review adapter error rates in monitoring
3. Test adapter connections manually
4. Check external API status (Stripe, Shopify status pages)

**Common Causes & Solutions:**

**Adapter API Rate Limiting:**

```bash
# Check rate limit errors in logs
kubectl logs job/reconciliation-worker | grep "rate limit"

# Solution: Implement exponential backoff, increase rate limit quotas
```

**Invalid Adapter Credentials:**

```bash
# Check credential errors
kubectl logs job/reconciliation-worker | grep "authentication"

# Solution: Verify credentials, update if expired
```

**External API Outage:**

- Check external API status pages
- Implement circuit breaker
- Notify customers of external dependency issue

---

### High API Latency (P2)

**Symptoms:**

- p95 latency > 200ms
- Slow response times reported by customers
- High database query times

**Investigation:**

1. Check API latency metrics: `https://grafana.settler.io/d/api-latency`
2. Review slow query log: `psql -h db.settler.io -c "SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"`
3. Check cache hit rates
4. Review recent code changes

**Common Causes & Solutions:**

**Slow Database Queries:**

```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_jobs_user_id ON jobs(user_id);
```

**Low Cache Hit Rate:**

```bash
# Check Redis cache stats
redis-cli -h redis.settler.io INFO stats

# Solution: Increase cache TTL, add more cache keys
```

**High Load:**

```bash
# Scale up API pods
kubectl scale deployment/api --replicas=10
```

---

### Webhook Delivery Failures (P1)

**Symptoms:**

- Webhook delivery success rate < 95%
- High retry queue size
- Customer reports of missing webhooks

**Investigation:**

1. Check webhook queue size: `redis-cli -h redis.settler.io LLEN webhook:queue`
2. Review webhook delivery logs
3. Test webhook endpoint manually
4. Check customer webhook endpoint status

**Common Causes & Solutions:**

**Customer Webhook Endpoint Down:**

- Verify endpoint is accessible: `curl -X POST https://customer-webhook.com`
- Notify customer to fix endpoint
- Implement exponential backoff for retries

**Webhook Signature Verification Failing:**

- Verify signature generation logic
- Check webhook secret configuration
- Update documentation if needed

**Rate Limiting:**

- Implement per-customer rate limiting
- Add webhook batching for high-volume customers

---

### Security Incident (P0)

**Symptoms:**

- Unauthorized access detected
- API key compromise
- Data breach suspected

**Immediate Actions:**

1. **Isolate affected systems**: Disable compromised API keys, isolate affected pods
2. **Preserve evidence**: Save logs, database snapshots
3. **Notify security team**: Escalate immediately
4. **Assess impact**: Determine scope of breach
5. **Notify customers**: If PII/data breach, notify within 72 hours (GDPR)

**Investigation:**

- Review access logs: `kubectl logs -f deployment/api | grep "unauthorized"`
- Check API key usage patterns
- Review database access logs
- Check for suspicious activity

**Remediation:**

- Revoke compromised API keys
- Rotate encryption keys if needed
- Patch security vulnerabilities
- Update security policies

**Post-Incident:**

- Conduct security audit
- Update security runbook
- Review access controls
- Implement additional monitoring

---

## Escalation Procedures

### When to Escalate

**Escalate to Engineering Lead:**

- P0 incidents not resolved within 30 minutes
- P1 incidents not resolved within 2 hours
- Security incidents
- Data loss incidents
- Customer escalations

**Escalate to CTO:**

- P0 incidents not resolved within 1 hour
- Security breaches
- Major data loss
- Customer contract at risk

**Escalate to CEO:**

- Public security breach
- Extended service outage (>4 hours)
- Regulatory compliance issues

### Escalation Contacts

**On-Call Rotation:**

- Primary: [Phone] [Email]
- Secondary: [Phone] [Email]
- Engineering Lead: [Phone] [Email]
- CTO: [Phone] [Email]

---

## Post-Mortem Process

### Post-Mortem Timeline

**P0/P1 Incidents:**

- Post-mortem meeting within 48 hours
- Post-mortem document within 1 week

**P2/P3 Incidents:**

- Post-mortem document within 1 week
- Meeting if needed

### Post-Mortem Template

```markdown
# Post-Mortem: [Incident Title]

**Date:** [Date]
**Duration:** [Start time] - [End time]
**Severity:** P0/P1/P2/P3
**Impact:** [Description]

## Timeline

- [Time] - Incident detected
- [Time] - Investigation started
- [Time] - Root cause identified
- [Time] - Fix implemented
- [Time] - Service restored

## Root Cause

[Detailed explanation]

## Impact

- **Users Affected:** [Number]
- **Revenue Impact:** [If applicable]
- **Data Loss:** [If applicable]

## What Went Well

- [List positive aspects]

## What Went Wrong

- [List issues]

## Action Items

- [ ] [Action item 1] - Owner: [Name] - Due: [Date]
- [ ] [Action item 2] - Owner: [Name] - Due: [Date]

## Lessons Learned

[Key takeaways]
```

---

## Monitoring & Alerting

### Key Metrics to Monitor

**API Health:**

- Request rate
- Error rate (<1%)
- p95 latency (<200ms)
- p99 latency (<500ms)
- Availability (>99.9%)

**Database:**

- Connection pool usage (<80%)
- Query latency (<100ms p95)
- Replication lag (<1s)
- Disk usage (<80%)

**Infrastructure:**

- CPU usage (<80%)
- Memory usage (<80%)
- Disk I/O (<80%)
- Network throughput

### Alert Thresholds

**Critical Alerts:**

- API error rate > 5%
- API availability < 99%
- Database connection pool > 90%
- Disk usage > 90%

**Warning Alerts:**

- API error rate > 1%
- API p95 latency > 200ms
- Database query latency > 100ms
- CPU usage > 80%

---

## Emergency Contacts

**On-Call Engineer:** [Phone] [Email]  
**Engineering Lead:** [Phone] [Email]  
**CTO:** [Phone] [Email]  
**Infrastructure:** [Phone] [Email]  
**Security:** [Phone] [Email]

---

**Last Updated:** 2026-01-15  
**Next Review:** Quarterly
