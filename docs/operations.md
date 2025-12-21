# Operations

**Last Updated:** 2025-01-20  
**Status:** Production Runbook  
**Purpose:** Operator experience and operational procedures

## Overview

This document defines **operational procedures** and **operator experience** for Settler. It is designed to help operators understand how to run and maintain the system.

**Philosophy:** If only the founder can debug it, it is not ready. Operations must be operable by humans under stress.

---

## Operator Capabilities

### Health Monitoring

**Endpoints:**
- `/api/health` - Overall health with dependency checks
- `/api/health/live` - Liveness probe (always OK if process alive)
- `/api/health/ready` - Readiness probe (OK only if dependencies healthy)

**Checks:**
- Database connectivity
- Redis connectivity
- External API availability
- Connection pool status

**Usage:**
```bash
curl https://api.settler.io/api/health
```

---

### Metrics & Observability

**Endpoints:**
- `/api/metrics` - Prometheus-compatible metrics
- `/api/observability` - Observability dashboard (internal)

**Metrics:**
- HTTP metrics (latency, error rate, request count)
- Business metrics (reconciliations, webhook deliveries)
- System metrics (connections, queue depth, cache hit/miss)

**Usage:**
```bash
curl https://api.settler.io/api/metrics
```

---

### Logging

**Structured Logging:**
- Winston with JSON output
- Automatic PII redaction
- Trace IDs for request correlation
- Log levels: ERROR, WARN, INFO, DEBUG

**Log Sources:**
- Application logs (Vercel logs)
- Error logs (Sentry)
- Access logs (Vercel Analytics)

**Access:**
- Vercel dashboard (application logs)
- Sentry dashboard (error logs)
- Vercel Analytics (access logs)

---

### Alerting

**Alert Sources:**
- Sentry (error alerts)
- Vercel (deployment alerts)
- Custom monitoring (health check failures)

**Alert Channels:**
- Email (critical alerts)
- Slack (team alerts)
- PagerDuty (on-call alerts, enterprise)

**Alert Thresholds:**
- Critical: Immediate escalation
- High: < 15 minutes
- Medium: < 1 hour
- Low: < 4 hours

---

## Operational Procedures

### Daily Operations

**Morning Checklist:**
1. Check health endpoints
2. Review error logs
3. Check metrics dashboard
4. Review alert notifications
5. Check deployment status

**Evening Checklist:**
1. Review daily metrics
2. Check for unresolved alerts
3. Review deployment logs
4. Check backup status
5. Document any issues

---

### Weekly Operations

**Weekly Tasks:**
1. Review weekly metrics
2. Review error trends
3. Review performance trends
4. Review security events
5. Update runbooks if needed

**Weekly Reports:**
- Error rate trends
- Performance trends
- Usage trends
- Security events

---

### Monthly Operations

**Monthly Tasks:**
1. Review monthly metrics
2. Review cost trends
3. Review capacity planning
4. Review security posture
5. Update documentation

**Monthly Reports:**
- Cost analysis
- Capacity analysis
- Security analysis
- Performance analysis

---

## Deployment Procedures

### Deployment Process

**Pre-Deployment:**
1. Run tests (unit, integration, e2e)
2. Review changes
3. Check for breaking changes
4. Update documentation

**Deployment:**
1. Deploy to staging
2. Verify staging deployment
3. Run smoke tests
4. Deploy to production
5. Verify production deployment

**Post-Deployment:**
1. Monitor health endpoints
2. Monitor error logs
3. Monitor metrics
4. Verify functionality
5. Document deployment

---

### Rollback Procedures

**Automatic Rollback:**
- Health check failures trigger automatic rollback
- Deployment failures trigger automatic rollback

**Manual Rollback:**
1. Identify deployment to rollback
2. Revert to previous version
3. Verify rollback
4. Monitor health endpoints
5. Document rollback

---

## Monitoring & Alerting

### Key Metrics

**Infrastructure:**
- Database connection pool usage
- Redis connection status
- API response times (p50, p95, p99)
- Error rates by endpoint

**Application:**
- Authentication success rate
- Webhook delivery success rate
- Payment processing success rate
- Feature flag evaluation rate

**Business:**
- Active users
- API usage
- Revenue
- Churn rate

---

### Alert Thresholds

**Critical Alerts (P0):**
- Database unavailable: Immediate
- Authentication system down: Immediate
- Error rate > 10%: Immediate

**High Alerts (P1):**
- Error rate > 5%: < 15 minutes
- API response time > 5 seconds: < 15 minutes
- Webhook delivery failure rate > 10%: < 15 minutes

**Medium Alerts (P2):**
- Error rate > 2%: < 1 hour
- API response time > 2 seconds: < 1 hour
- Feature flag update delay > 5 minutes: < 1 hour

---

## Troubleshooting

### Common Issues

**Database Connection Issues:**
- Check Supabase status
- Verify connection string
- Check connection pool usage
- Restart application if needed

**Redis Connection Issues:**
- Check Upstash status
- Verify connection string
- Check Redis quota
- System continues operating (graceful degradation)

**High Error Rates:**
- Check error logs for patterns
- Identify affected endpoints
- Check for recent deployments
- Rollback if needed

**Performance Issues:**
- Check response times
- Check database query performance
- Check cache hit rates
- Check external API response times

---

### Debugging Procedures

**Debugging Steps:**
1. Reproduce issue
2. Check logs for errors
3. Check metrics for anomalies
4. Test in staging if possible
5. Fix issue
6. Verify fix
7. Deploy fix
8. Monitor for recurrence

**Debugging Tools:**
- Logs (Vercel, Sentry)
- Metrics (Prometheus)
- Tracing (OpenTelemetry)
- Health checks (endpoints)

---

## Capacity Planning

### Resource Monitoring

**Database:**
- Connection pool usage
- Query performance
- Storage usage
- Backup status

**Redis:**
- Connection status
- Cache hit rates
- Memory usage
- Quota usage

**Application:**
- CPU usage
- Memory usage
- Request rate
- Error rate

---

### Scaling Procedures

**Horizontal Scaling:**
- Serverless functions scale automatically
- No manual scaling required
- Scaling based on request rate

**Vertical Scaling:**
- Database scaling (Supabase)
- Redis scaling (Upstash)
- Application scaling (Vercel)

**Scaling Triggers:**
- High request rate
- High error rate
- High latency
- Resource exhaustion

---

## Backup & Recovery

### Backup Procedures

**Database Backups:**
- Daily backups (automated)
- Weekly backups (automated)
- Monthly backups (automated)
- Point-in-time recovery (available)

**Backup Retention:**
- Daily backups: 30 days
- Weekly backups: 12 weeks
- Monthly backups: 12 months

**Backup Verification:**
- Backup success monitored
- Backup restoration tested regularly
- Backup integrity verified

---

### Recovery Procedures

**Data Recovery:**
1. Identify data to recover
2. Select backup to restore
3. Restore backup
4. Verify restoration
5. Notify users if needed

**Disaster Recovery:**
1. Assess disaster scope
2. Activate disaster recovery plan
3. Restore from backups
4. Verify system functionality
5. Document disaster recovery

---

## Security Operations

### Security Monitoring

**Security Events:**
- Failed authentication attempts
- Authorization failures
- Unauthorized access attempts
- Suspicious activity

**Security Alerts:**
- Critical security events: Immediate
- High security events: < 15 minutes
- Medium security events: < 1 hour

---

### Security Procedures

**Incident Response:**
1. Detect security incident
2. Assess severity and scope
3. Contain incident
4. Investigate root cause
5. Remediate
6. Post-mortem

**Vulnerability Management:**
1. Monitor vulnerability alerts
2. Assess severity and impact
3. Test patches in staging
4. Deploy patches to production
5. Verify patch effectiveness

---

## Summary

Settler's operations:
- ✅ **Health Monitoring:** Health endpoints and dependency checks
- ✅ **Metrics & Observability:** Prometheus-compatible metrics and observability dashboard
- ✅ **Logging:** Structured logging with PII redaction
- ✅ **Alerting:** Multi-channel alerting with thresholds
- ✅ **Operational Procedures:** Daily, weekly, monthly checklists
- ✅ **Deployment Procedures:** Automated deployment with rollback
- ✅ **Monitoring & Alerting:** Key metrics and alert thresholds
- ✅ **Troubleshooting:** Common issues and debugging procedures
- ✅ **Capacity Planning:** Resource monitoring and scaling procedures
- ✅ **Backup & Recovery:** Automated backups and recovery procedures
- ✅ **Security Operations:** Security monitoring and incident response

**Key Principles:**
- Operations must be operable by humans under stress
- Automation reduces human error
- Monitoring enables proactive response
- Documentation enables knowledge transfer

**When in doubt, check health endpoints, review logs, and follow runbooks.**
