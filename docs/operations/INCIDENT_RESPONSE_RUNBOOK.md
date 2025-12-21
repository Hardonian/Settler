# Settler.dev — Incident Response Runbook

**Version:** 1.0  
**Last Updated:** January 2026  
**Purpose:** Step-by-step procedures for responding to operational incidents

---

## Overview

This runbook provides procedures for responding to operational incidents, including:
- Service outages
- Performance degradation
- Data loss incidents
- Security incidents
- Billing failures
- API failures

**On-Call Rotation:** [Define on-call rotation schedule]  
**Escalation Contact:** security@settler.dev  
**Status Page:** https://settler.dev/status

---

## Incident Severity Levels

### P0: Critical (Immediate Response)

**Criteria:**
- Complete service outage
- Data breach or security incident
- Data loss affecting customers
- Billing system failure affecting revenue

**Response Time:** 15 minutes  
**Resolution Target:** 4 hours  
**Escalation:** Immediate to leadership

### P1: High (Urgent Response)

**Criteria:**
- Major feature broken (>10% error rate)
- Performance degradation (>50% slower)
- Partial service outage
- Billing issues affecting multiple customers

**Response Time:** 1 hour  
**Resolution Target:** 24 hours  
**Escalation:** Within 4 hours if not resolved

### P2: Medium (Standard Response)

**Criteria:**
- Minor feature broken (<10% error rate)
- Moderate performance issues (10-50% slower)
- Single customer impact
- Non-critical billing issues

**Response Time:** 4 hours  
**Resolution Target:** 72 hours  
**Escalation:** Within 24 hours if not resolved

### P3: Low (Best Effort)

**Criteria:**
- Documentation issues
- UI/UX improvements
- Feature requests
- Low error rate (<5%)

**Response Time:** 24 hours  
**Resolution Target:** 7 days  
**Escalation:** Within 72 hours if not resolved

---

## Incident Response Process

### Phase 1: Detection

**Detection Sources:**
- Monitoring alerts (Datadog, Sentry, Vercel)
- Customer reports (support tickets, status page)
- Internal team reports
- Automated health checks

**Initial Assessment:**
1. **Check Alert Details**
   - Review alert message and context
   - Check related metrics and logs
   - Assess severity level

2. **Verify Incident**
   - Reproduce issue (if possible)
   - Check if issue is affecting multiple customers
   - Determine scope and impact

3. **Create Incident Ticket**
   - Document incident details
   - Assign severity level
   - Notify on-call engineer

---

### Phase 2: Response

**Immediate Actions:**

1. **Acknowledge Incident**
   - Update status page (if customer-facing)
   - Notify team via Slack/email
   - Create incident ticket

2. **Assess Impact**
   - How many customers affected?
   - What functionality is broken?
   - What's the business impact?

3. **Contain Incident**
   - Stop the bleeding (disable feature, rollback, etc.)
   - Prevent further damage
   - Isolate affected systems

**Containment Procedures:**

**For Service Outage:**
```bash
# Check service status
curl https://settler.dev/api/health

# Check Vercel deployment status
vercel inspect

# Check database connectivity
supabase db ping

# Check Redis connectivity
redis-cli ping
```

**For Performance Degradation:**
```bash
# Check API response times
# Review Datadog metrics

# Check database query performance
# Review slow query logs

# Check Redis cache hit rate
# Review cache metrics
```

**For Data Loss:**
```bash
# Check backup status
# Verify backup integrity

# Check database replication
# Verify data consistency

# Check audit logs
# Identify data loss scope
```

**For Billing Failure:**
```bash
# Check Stripe webhook delivery
# Review billing reconciliation

# Check subscription status
# Verify payment processing

# Check usage tracking
# Verify billing calculations
```

---

### Phase 3: Investigation

**Gather Evidence:**

1. **Check Logs**
   ```bash
   # Application logs
   vercel logs --follow
   
   # Database logs
   supabase db logs
   
   # Edge function logs
   supabase functions logs
   ```

2. **Check Metrics**
   - Review Datadog dashboards
   - Check error rates and response times
   - Review customer usage patterns

3. **Check Database**
   ```sql
   -- Check recent errors
   SELECT * FROM audit_logs
   WHERE level = 'error'
   ORDER BY timestamp DESC
   LIMIT 100;
   
   -- Check recent activity
   SELECT * FROM usage_events
   ORDER BY timestamp DESC
   LIMIT 100;
   ```

4. **Check External Dependencies**
   - Stripe API status
   - Supabase status
   - Vercel status
   - Upstash status

**Root Cause Analysis:**

1. **Timeline**
   - When did the incident start?
   - What changed recently? (deployments, config changes)
   - What was the trigger?

2. **Scope**
   - How many customers affected?
   - What functionality is broken?
   - What data is affected?

3. **Root Cause**
   - What caused the incident?
   - Why did it happen?
   - How can we prevent it?

---

### Phase 4: Resolution

**Fix Implementation:**

1. **Develop Fix**
   - Create fix (code change, config update, etc.)
   - Test fix in staging
   - Get approval if needed

2. **Deploy Fix**
   - Deploy to production
   - Monitor deployment
   - Verify fix works

3. **Verify Resolution**
   - Check metrics (error rates, response times)
   - Test functionality
   - Confirm customer impact resolved

**Rollback Procedure:**

If fix doesn't work or causes more issues:

```bash
# Rollback Vercel deployment
vercel rollback

# Rollback database migration (if needed)
supabase db rollback

# Restore from backup (if data loss)
supabase db restore <backup-file>
```

---

### Phase 5: Recovery

**Service Restoration:**

1. **Verify Fix**
   - Check service health
   - Verify functionality works
   - Monitor for recurrence

2. **Update Status Page**
   - Mark incident as resolved
   - Update status to operational
   - Remove incident notice

3. **Notify Customers**
   - Send resolution notification (if P0/P1)
   - Update support tickets
   - Post-mortem communication (if needed)

**Data Recovery (if applicable):**

1. **Restore from Backup**
   ```bash
   # Restore database backup
   supabase db restore <backup-file>
   
   # Verify data integrity
   supabase db verify
   ```

2. **Verify Data Integrity**
   - Check data consistency
   - Verify customer data restored
   - Confirm no data loss

3. **Notify Affected Customers**
   - Inform customers of data recovery
   - Apologize for inconvenience
   - Offer compensation if appropriate

---

### Phase 6: Post-Incident

**Incident Report:**

1. **Document Incident**
   - What happened?
   - When did it happen?
   - Who was affected?
   - What was the impact?

2. **Root Cause Analysis**
   - What caused the incident?
   - Why did it happen?
   - What could have prevented it?

3. **Remediation Steps**
   - What was done to fix it?
   - What was done to prevent recurrence?
   - What follow-up actions are needed?

4. **Lessons Learned**
   - What did we learn?
   - What should we do differently?
   - What improvements are needed?

**Follow-Up Actions:**

1. **Update Runbooks**
   - Add new procedures if needed
   - Update existing procedures
   - Document new learnings

2. **Improve Monitoring**
   - Add new alerts if needed
   - Improve existing alerts
   - Enhance dashboards

3. **Process Improvements**
   - Update incident response process
   - Improve communication procedures
   - Enhance training

---

## Common Incident Scenarios

### Scenario 1: Service Outage

**Symptoms:**
- All API endpoints returning 500 errors
- Dashboard not loading
- Customers reporting complete service failure

**Response:**
1. Check Vercel deployment status
2. Check database connectivity
3. Check Redis connectivity
4. Review recent deployments
5. Rollback if recent deployment caused issue
6. Update status page
7. Notify customers

**Prevention:**
- Staging environment testing
- Gradual rollouts
- Health checks before deployment
- Automated rollback on errors

---

### Scenario 2: Performance Degradation

**Symptoms:**
- API response times >5 seconds
- High error rates (>10%)
- Customer complaints about slowness

**Response:**
1. Check database query performance
2. Check Redis cache hit rate
3. Check API response times
4. Review recent code changes
5. Scale infrastructure if needed
6. Optimize slow queries
7. Update status page

**Prevention:**
- Performance monitoring
- Load testing
- Query optimization
- Caching strategies

---

### Scenario 3: Data Loss

**Symptoms:**
- Customer reports missing data
- Database inconsistencies
- Backup failures

**Response:**
1. Verify data loss scope
2. Check backup integrity
3. Restore from backup if needed
4. Verify data recovery
5. Notify affected customers
6. Investigate root cause

**Prevention:**
- Regular backups
- Backup verification
- Data replication
- Audit logging

---

### Scenario 4: Billing Failure

**Symptoms:**
- Stripe webhook failures
- Billing reconciliation errors
- Customer billing disputes

**Response:**
1. Check Stripe webhook delivery
2. Review billing reconciliation
3. Check subscription status
4. Fix billing issues
5. Reconcile billing discrepancies
6. Notify affected customers

**Prevention:**
- Webhook retry logic
- Billing reconciliation automation
- Monitoring billing errors
- Customer billing transparency

---

### Scenario 5: Security Incident

**Symptoms:**
- Unauthorized access detected
- Data breach suspected
- Security alerts triggered

**Response:**
1. Contain incident (revoke access, suspend accounts)
2. Investigate scope
3. Notify security team
4. Notify affected customers (if required)
5. Document incident
6. Implement fixes

**Prevention:**
- Security monitoring
- Access controls
- Regular security audits
- Incident response training

---

## Customer Communication Templates

### Template 1: Service Outage Notification

**Subject:** Service Outage — [Service Name] — [Date]

**Body:**
```
We're currently experiencing a service outage affecting [Service Name].

**Impact:**
- [Description of impact]
- [Affected functionality]
- [Estimated number of customers affected]

**Status:**
Our team is actively working to resolve this issue. We'll provide updates as we have more information.

**Updates:**
- [Time]: Incident detected
- [Time]: Investigation in progress
- [Time]: Fix deployed, monitoring

**Estimated Resolution:** [Time]

We apologize for the inconvenience and appreciate your patience.

For updates, please check: https://settler.dev/status
```

---

### Template 2: Performance Degradation Notification

**Subject:** Performance Issues — [Service Name] — [Date]

**Body:**
```
We're currently experiencing performance issues affecting [Service Name].

**Impact:**
- [Description of impact]
- [Performance degradation details]
- [Affected functionality]

**Status:**
Our team is investigating and working to resolve this issue.

**Updates:**
- [Time]: Issue detected
- [Time]: Investigation in progress
- [Time]: Fix deployed, monitoring

**Estimated Resolution:** [Time]

We apologize for the inconvenience and appreciate your patience.

For updates, please check: https://settler.dev/status
```

---

### Template 3: Data Loss Notification

**Subject:** Data Recovery — [Service Name] — [Date]

**Body:**
```
We experienced a data issue affecting [Service Name] on [Date].

**Impact:**
- [Description of data loss]
- [Affected data/timeframe]
- [Number of customers affected]

**Resolution:**
We've restored data from backups and verified data integrity. Your data has been fully recovered.

**What We're Doing:**
- [Remediation steps]
- [Prevention measures]
- [Follow-up actions]

**Compensation:**
[If applicable: compensation details]

We sincerely apologize for this incident and have taken steps to prevent recurrence.

If you have any questions or concerns, please contact support@settler.dev
```

---

### Template 4: Incident Resolution Notification

**Subject:** Issue Resolved — [Service Name] — [Date]

**Body:**
```
The issue affecting [Service Name] has been resolved.

**Resolution:**
- [What was fixed]
- [When it was fixed]
- [Verification steps]

**Root Cause:**
[Brief explanation of root cause]

**Prevention:**
[Steps taken to prevent recurrence]

**Status:**
All systems are now operational. We apologize for any inconvenience caused.

If you continue to experience issues, please contact support@settler.dev
```

---

## Escalation Procedures

### When to Escalate

**Escalate to Leadership if:**
- P0 incident not resolved within 4 hours
- P1 incident not resolved within 24 hours
- Data breach or security incident
- Customer escalations
- Media inquiries

**Escalate to Security Team if:**
- Security incident suspected
- Data breach detected
- Unauthorized access
- Security vulnerability discovered

**Escalate to Legal Team if:**
- Data breach affecting customer data
- Legal compliance issues
- Customer legal threats
- Regulatory inquiries

### Escalation Contacts

- **Leadership:** [Leadership contact]
- **Security Team:** security@settler.dev
- **Legal Team:** [Legal contact]
- **On-Call Engineer:** [On-call rotation]

---

## Tools & Commands

### Monitoring

```bash
# Check service health
curl https://settler.dev/api/health

# Check Vercel deployment status
vercel inspect

# Check database status
supabase db ping

# Check Redis status
redis-cli ping
```

### Logs

```bash
# Application logs
vercel logs --follow

# Database logs
supabase db logs

# Edge function logs
supabase functions logs
```

### Database Queries

```sql
-- Check recent errors
SELECT * FROM audit_logs
WHERE level = 'error'
ORDER BY timestamp DESC
LIMIT 100;

-- Check recent activity
SELECT * FROM usage_events
ORDER BY timestamp DESC
LIMIT 100;

-- Check billing issues
SELECT * FROM subscriptions
WHERE status != 'active'
ORDER BY updated_at DESC;
```

---

## Prevention

### Regular Tasks

1. **Daily:**
   - Review error logs
   - Check service health
   - Monitor key metrics

2. **Weekly:**
   - Review incident reports
   - Update runbooks
   - Test backup restoration

3. **Monthly:**
   - Review incident trends
   - Update monitoring
   - Conduct incident response training

4. **Quarterly:**
   - Review incident response process
   - Update escalation procedures
   - Conduct post-mortem reviews

---

**Last Updated:** January 2026  
**Owner:** Engineering/Operations Team  
**Review Frequency:** Quarterly
