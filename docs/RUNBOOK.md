# Operational Runbook - Settler Enterprise

**Last Updated:** December 2024  
**Status:** Production-Ready

---

## Quick Reference

**Emergency Contacts:**
- On-Call: [oncall@settler.dev]
- Escalation: [escalation@settler.dev]

**Key URLs:**
- Production: https://settler.dev
- Status Page: https://status.settler.dev
- Admin Health: https://settler.dev/api/admin/health
- System Health: https://settler.dev/api/ops/system-health

---

## 1. Deployment Procedures

### Standard Deployment

**Prerequisites:**
- All tests passing (`npm run test`)
- Lint passing (`npm run lint`)
- Typecheck passing (`npm run typecheck`)
- Build successful (`npm run build`)

**Deployment Steps:**

1. **Pre-Deployment Checks**
   ```bash
   npm run validate:all
   npm run check:production
   ```

2. **Deploy to Vercel**
   ```bash
   # Via GitHub (automatic on merge to main)
   # Or manually:
   vercel --prod
   ```

3. **Post-Deployment Verification**
   - Check health endpoint: `GET /api/health`
   - Check admin health: `GET /api/admin/health`
   - Verify key routes: `/`, `/console`, `/api/v1/`
   - Monitor error rates in Sentry

**Rollback Procedure:**
```bash
# Via Vercel dashboard:
# 1. Go to Deployments
# 2. Find previous successful deployment
# 3. Click "Promote to Production"
```

### Database Migrations

**Prerequisites:**
- Backup database
- Test migration on staging
- Review migration SQL

**Migration Steps:**

1. **Create Migration**
   ```bash
   npm run db:new
   ```

2. **Test Locally**
   ```bash
   npm run db:reset
   npm run db:migrate:local
   ```

3. **Apply to Production**
   ```bash
   # Via Supabase dashboard or CLI:
   supabase db push --include-all
   ```

4. **Verify Migration**
   ```bash
   npm run db:verify
   ```

**Rollback Procedure:**
- Create reverse migration
- Apply reverse migration
- Verify data integrity

---

## 2. Monitoring & Alerting

### Health Checks

**Endpoints:**
- `/api/health` - Basic health check
- `/api/admin/health` - Detailed health metrics
- `/api/ops/system-health` - System health dashboard

**Expected Responses:**
- Status: 200 OK
- Response time: <100ms
- Database: Connected
- Redis: Connected (if configured)

### Key Metrics

**API Metrics:**
- Request rate (RPS)
- Error rate (<1% target)
- Latency (p95 <200ms target)
- Success rate (>99% target)

**Business Metrics:**
- Reconciliations/hour
- Match rate (>80% target)
- Failure rate (<5% target)
- Active tenants

**Infrastructure Metrics:**
- Database connection pool (<80% utilization)
- Redis memory usage
- Vercel function invocations
- Error rate by endpoint

### Alerting

**Critical Alerts:**
- Error rate >5% for 5+ minutes
- p95 latency >500ms for 5+ minutes
- Database connection failures
- Health check failures

**Warning Alerts:**
- Error rate >1% for 10+ minutes
- p95 latency >200ms for 10+ minutes
- High database connection pool usage
- Unusual API patterns

---

## 3. Incident Response

### Incident Severity Levels

**P0 - Critical:**
- Service completely down
- Data loss or corruption
- Security breach
- Response time: Immediate

**P1 - High:**
- Major feature broken
- High error rate (>10%)
- Performance degradation
- Response time: <15 minutes

**P2 - Medium:**
- Minor feature broken
- Moderate error rate (1-10%)
- Response time: <1 hour

**P3 - Low:**
- Cosmetic issues
- Low error rate (<1%)
- Response time: <4 hours

### Incident Response Process

1. **Acknowledge** - Acknowledge alert/incident
2. **Assess** - Determine severity and impact
3. **Communicate** - Notify team and stakeholders
4. **Investigate** - Identify root cause
5. **Remediate** - Fix issue or implement workaround
6. **Verify** - Confirm resolution
7. **Document** - Create post-mortem

### Common Incidents

#### High Error Rate

**Symptoms:**
- Error rate >5% for 5+ minutes
- Increased Sentry alerts

**Investigation:**
1. Check Sentry for error patterns
2. Check health endpoints
3. Review recent deployments
4. Check database connectivity
5. Check external API status

**Remediation:**
- Rollback recent deployment if needed
- Scale infrastructure if needed
- Enable circuit breakers
- Contact support for external APIs

#### High Latency

**Symptoms:**
- p95 latency >200ms for 5+ minutes
- User complaints about slowness

**Investigation:**
1. Identify slow endpoints
2. Check database query performance
3. Check cache hit rates
4. Check external API latency
5. Check infrastructure resources

**Remediation:**
- Optimize slow queries
- Increase cache TTL
- Scale infrastructure
- Enable caching for slow endpoints

#### Database Issues

**Symptoms:**
- Database connection errors
- High connection pool usage
- Slow queries

**Investigation:**
1. Check database health
2. Review slow queries
3. Check connection pool usage
4. Review recent migrations

**Remediation:**
- Scale database if needed
- Optimize slow queries
- Increase connection pool
- Rollback problematic migrations

---

## 4. Daily Operations

### Morning Checklist

1. **Review Alerts**
   - Check Sentry for overnight errors
   - Review health check status
   - Check error rates

2. **Review Metrics**
   - API performance (latency, error rate)
   - Business metrics (reconciliations, match rate)
   - Infrastructure metrics (database, Redis)

3. **Review Logs**
   - Check for unusual patterns
   - Review error logs
   - Check access logs

### Weekly Checklist

1. **Performance Review**
   - Review API performance trends
   - Identify slow endpoints
   - Review database query performance

2. **Security Review**
   - Review access logs
   - Check for suspicious activity
   - Review error patterns

3. **Capacity Planning**
   - Review usage trends
   - Plan for scaling
   - Review infrastructure costs

### Monthly Checklist

1. **Security Audit**
   - Review access logs
   - Check for vulnerabilities
   - Review compliance status

2. **Performance Optimization**
   - Identify optimization opportunities
   - Review slow queries
   - Optimize API endpoints

3. **Cost Review**
   - Review infrastructure costs
   - Optimize resource usage
   - Plan for cost optimization

---

## 5. Troubleshooting

### Common Issues

#### API Returns 500 Errors

**Check:**
1. Health endpoint: `GET /api/health`
2. Sentry for error details
3. Recent deployments
4. Database connectivity

**Fix:**
- Rollback if recent deployment
- Check database connection
- Review error logs

#### Slow API Responses

**Check:**
1. Database query performance
2. Cache hit rates
3. External API latency
4. Infrastructure resources

**Fix:**
- Optimize slow queries
- Increase caching
- Scale infrastructure
- Enable CDN caching

#### Database Connection Errors

**Check:**
1. Database health
2. Connection pool usage
3. Network connectivity
4. Recent migrations

**Fix:**
- Scale database
- Increase connection pool
- Check network
- Rollback migrations if needed

---

## 6. Maintenance Windows

### Scheduled Maintenance

**Frequency:** Monthly (first Sunday of month, 2-4 AM UTC)

**Procedure:**
1. Notify users 7 days in advance
2. Put system in maintenance mode
3. Apply updates/migrations
4. Verify system health
5. Exit maintenance mode
6. Notify users of completion

### Emergency Maintenance

**Procedure:**
1. Notify users immediately
2. Put system in maintenance mode
3. Apply fixes
4. Verify system health
5. Exit maintenance mode
6. Notify users of completion

---

## 7. Backup & Recovery

### Backup Strategy

**Database:**
- Automated daily backups
- Point-in-time recovery available
- Retention: 30 days

**Code:**
- Git repository (GitHub)
- Automated backups
- Retention: Unlimited

**Configuration:**
- Environment variables in Vercel
- Secrets in Supabase
- Documented in runbook

### Recovery Procedures

**Database Recovery:**
1. Identify point-in-time for recovery
2. Restore from backup
3. Verify data integrity
4. Test application functionality

**Code Recovery:**
1. Identify commit to restore
2. Deploy previous version
3. Verify functionality
4. Monitor for issues

---

## 8. Security Procedures

### Security Incidents

**Response:**
1. Isolate affected systems
2. Assess impact
3. Notify security team
4. Investigate root cause
5. Remediate vulnerabilities
6. Document incident

### Access Management

**User Access:**
- Review quarterly
- Remove unused access
- Audit access logs

**API Keys:**
- Rotate quarterly
- Monitor usage
- Revoke unused keys

**Secrets:**
- Rotate annually
- Monitor access
- Document rotation

---

## 9. Performance Optimization

### API Optimization

**Strategies:**
- Enable caching for slow endpoints
- Optimize database queries
- Use CDN for static assets
- Implement pagination
- Use database indexes

### Database Optimization

**Strategies:**
- Review slow queries
- Add indexes
- Optimize queries
- Use connection pooling
- Monitor query performance

### Infrastructure Optimization

**Strategies:**
- Right-size resources
- Use caching effectively
- Optimize bundle size
- Use CDN
- Monitor costs

---

## 10. On-Call Procedures

### On-Call Rotation

**Schedule:** Weekly rotation
**Contact:** [oncall@settler.dev]
**Escalation:** [escalation@settler.dev]

### On-Call Responsibilities

1. **Monitor Alerts**
   - Respond to P0/P1 alerts immediately
   - Acknowledge all alerts
   - Escalate if needed

2. **Investigate Issues**
   - Use runbook procedures
   - Document findings
   - Communicate status

3. **Resolve Issues**
   - Follow remediation procedures
   - Verify resolution
   - Document incident

### Escalation Path

1. **On-Call Engineer** - First responder
2. **Engineering Lead** - Escalate if unresolved in 30 minutes
3. **CTO/Founder** - Escalate for P0 incidents

---

## 11. Post-Incident Procedures

### Post-Mortem Process

**Timeline:**
- Within 24 hours: Initial post-mortem
- Within 1 week: Detailed post-mortem
- Within 2 weeks: Action items completed

**Post-Mortem Template:**
1. **Incident Summary**
   - What happened
   - When it happened
   - Impact assessment

2. **Timeline**
   - Detection time
   - Response time
   - Resolution time

3. **Root Cause**
   - Primary cause
   - Contributing factors

4. **Remediation**
   - Immediate fixes
   - Long-term fixes
   - Prevention measures

5. **Action Items**
   - Short-term (1 week)
   - Long-term (1 month)
   - Owner assignments

---

## 12. Useful Commands

### Health Checks
```bash
# Basic health
curl https://settler.dev/api/health

# Admin health
curl https://settler.dev/api/admin/health

# System health
curl https://settler.dev/api/ops/system-health
```

### Database
```bash
# Check migrations
npm run db:verify

# Check connection
npm run db:check

# Run migrations
npm run db:migrate:prod
```

### Monitoring
```bash
# Check logs (Vercel)
vercel logs

# Check Sentry
# Via Sentry dashboard

# Check metrics
# Via Grafana/Prometheus
```

---

**Last Updated:** December 2024  
**Next Review:** Quarterly
