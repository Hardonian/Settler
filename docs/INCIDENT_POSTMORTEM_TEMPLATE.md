# Incident Postmortem Template

Use this template for documenting incidents and their resolution.

## Incident Summary

**Incident ID**: `INC-YYYY-MM-DD-XXX`

**Date**: YYYY-MM-DD HH:MM UTC

**Duration**: X hours Y minutes

**Severity**: Critical / High / Medium / Low

**Status**: Resolved / Mitigated / Investigating

## Impact

**Affected Services**:

- Service 1
- Service 2

**Affected Tenants**:

- Tenant IDs or "All tenants"

**User Impact**:

- Number of users affected
- Percentage of traffic affected
- Geographic regions affected

**Business Impact**:

- Revenue impact (if applicable)
- SLA violations
- Customer complaints

## Timeline

**Detection**:

- Time: YYYY-MM-DD HH:MM UTC
- Method: Alert / Customer report / Monitoring
- Alert ID: (if applicable)
- Trace ID: (if applicable)

**Investigation**:

- Time: YYYY-MM-DD HH:MM UTC
- Actions taken:
  - Checked daily intelligence report
  - Reviewed error logs
  - Analyzed trace IDs
  - Checked kill switches

**Mitigation**:

- Time: YYYY-MM-DD HH:MM UTC
- Actions taken:
  - Enabled kill switch
  - Scaled resources
  - Rolled back deployment
  - Disabled feature

**Resolution**:

- Time: YYYY-MM-DD HH:MM UTC
- Root cause identified: Yes / No
- Permanent fix deployed: Yes / No

## Root Cause

**Primary Cause**:

- Description of root cause
- Why it happened
- What failed

**Contributing Factors**:

- Factor 1
- Factor 2

**Evidence**:

- Logs: (links or references)
- Metrics: (screenshots or data)
- Traces: (trace IDs)
- Database queries: (if applicable)

## Detection

**How was the incident detected?**

- Alert threshold triggered
- Daily intelligence report
- Customer report
- Monitoring dashboard
- Other: **\*\***\_\_\_**\*\***

**Could it have been detected earlier?**

- Yes / No
- If yes, how?

**Alert Configuration**:

- Alert rule: (name or ID)
- Threshold: (value)
- Channel: (email / Slack / webhook)
- Was alert effective? Yes / No

## Response

**Initial Response**:

- Who responded?
- What actions were taken first?
- How quickly was the incident acknowledged?

**Escalation**:

- Was escalation needed? Yes / No
- Who was escalated to?
- When?

**Communication**:

- Status page updated? Yes / No
- Customers notified? Yes / No
- Internal team notified? Yes / No

**Kill Switches Used**:

- Connector disabled: (connector type)
- Background job paused: (job type)
- Feature disabled: (feature name)
- Endpoint disabled: (endpoint path)

**Effectiveness**:

- Did kill switches work as expected? Yes / No
- Were they sufficient? Yes / No
- Could response have been faster? Yes / No

## Resolution

**Fix Applied**:

- Description of fix
- Code changes: (PR links)
- Configuration changes: (what changed)
- Database changes: (migrations)

**Verification**:

- How was fix verified?
- Tests run: (test results)
- Monitoring: (metrics showing recovery)

**Deployment**:

- When was fix deployed?
- Deployment method: (CI/CD / Manual)
- Rollback plan: (if applicable)

## Prevention

**Immediate Actions**:

- [ ] Action 1
- [ ] Action 2
- [ ] Action 3

**Short-term Improvements** (within 1 week):

- [ ] Improvement 1
- [ ] Improvement 2

**Long-term Improvements** (within 1 month):

- [ ] Improvement 1
- [ ] Improvement 2

**Process Changes**:

- [ ] Update runbooks
- [ ] Add monitoring
- [ ] Improve alerting
- [ ] Update documentation

## Metrics

**Before Incident**:

- Error rate: X%
- P95 latency: X ms
- Failed ingestions: X per day
- Background jobs: X concurrent

**During Incident**:

- Error rate: X%
- P95 latency: X ms
- Failed ingestions: X per day
- Background jobs: X concurrent

**After Resolution**:

- Error rate: X%
- P95 latency: X ms
- Failed ingestions: X per day
- Background jobs: X concurrent

## Lessons Learned

**What Went Well**:

- Detection was fast
- Kill switches worked effectively
- Team communication was clear
- Documentation was helpful

**What Could Be Improved**:

- Faster response time
- Better monitoring
- More comprehensive alerts
- Improved runbooks

**Action Items**:

- [ ] Owner: Task description (Due: YYYY-MM-DD)
- [ ] Owner: Task description (Due: YYYY-MM-DD)

## References

- Alert history: `/api/v1/operator/alerts/history`
- Daily intelligence: `/api/v1/operator/daily-intelligence?date=YYYY-MM-DD`
- Failed ingestions: `/api/v1/operator/failed-ingestions?date=YYYY-MM-DD`
- Kill switches: `/api/v1/operator/kill-switches`
- Backups: `/api/v1/operator/backups`

## Sign-off

**Incident Lead**: Name (Date)

**Engineering Lead**: Name (Date)

**Product Lead**: Name (Date)

---

## Example: High Error Rate Incident

**Incident ID**: `INC-2026-01-31-001`

**Date**: 2026-01-31 14:30 UTC

**Duration**: 45 minutes

**Severity**: High

**Status**: Resolved

## Impact

**Affected Services**:

- Ingestion API
- Stripe Connector

**Affected Tenants**:

- tenant-123, tenant-456, tenant-789

**User Impact**:

- 150 ingestion jobs failed
- 5% of daily ingestion volume affected

**Business Impact**:

- Customer data sync delayed
- 3 customer support tickets

## Timeline

**Detection**:

- Time: 2026-01-31 14:30 UTC
- Method: Alert threshold triggered
- Alert ID: alert-abc-123
- Trace ID: trace-xyz-789

**Investigation**:

- Time: 2026-01-31 14:32 UTC
- Actions taken:
  - Checked daily intelligence report: Error rate 12% (threshold: 5%)
  - Reviewed failed ingestions: All Stripe connector jobs failing
  - Analyzed trace IDs: Connection timeout errors
  - Checked kill switches: None enabled

**Mitigation**:

- Time: 2026-01-31 14:35 UTC
- Actions taken:
  - Disabled Stripe connector via kill switch
  - Notified affected tenants via status page
  - Escalated to engineering team

**Resolution**:

- Time: 2026-01-31 15:15 UTC
- Root cause identified: Yes
- Permanent fix deployed: Yes

## Root Cause

**Primary Cause**:

- Stripe API rate limit exceeded due to burst of requests from multiple tenants
- Rate limit: 100 requests/second
- Actual: 150 requests/second

**Contributing Factors**:

- No rate limiting on Stripe connector
- Multiple tenants syncing simultaneously
- No circuit breaker for Stripe API

**Evidence**:

- Logs: `stripe-connector.log` lines 1234-1256
- Metrics: Error rate spike at 14:30 UTC
- Traces: `trace-xyz-789` shows timeout after 30s
- Database queries: 150 failed ingestions with Stripe connector

## Detection

**How was the incident detected?**

- Alert threshold triggered: Error rate > 5%

**Could it have been detected earlier?**

- Yes, if we had monitoring for Stripe API rate limits

**Alert Configuration**:

- Alert rule: "High Error Rate"
- Threshold: 0.05 (5%)
- Channel: Slack
- Was alert effective? Yes, triggered within 2 minutes

## Response

**Initial Response**:

- On-call engineer responded within 2 minutes
- Checked daily intelligence report
- Identified Stripe connector as source of errors

**Escalation**:

- Escalated to engineering lead at 14:40 UTC

**Communication**:

- Status page updated: Yes
- Customers notified: Yes (affected tenants)
- Internal team notified: Yes (Slack)

**Kill Switches Used**:

- Connector disabled: stripe
- Reason: "Stripe API rate limit exceeded"

**Effectiveness**:

- Did kill switches work as expected? Yes
- Were they sufficient? Yes, prevented further failures
- Could response have been faster? Yes, automated kill switch on rate limit

## Resolution

**Fix Applied**:

- Added rate limiting to Stripe connector (50 req/s per tenant)
- Implemented circuit breaker for Stripe API
- Added retry logic with exponential backoff

**Verification**:

- Tested with staging tenant
- Error rate returned to < 1%
- No further failures observed

**Deployment**:

- Deployed at 15:15 UTC via CI/CD
- No rollback needed

## Prevention

**Immediate Actions**:

- [x] Enable rate limiting on Stripe connector
- [x] Add circuit breaker for Stripe API
- [ ] Monitor Stripe API rate limit usage

**Short-term Improvements** (within 1 week):

- [ ] Add rate limit monitoring to daily intelligence
- [ ] Create alert for Stripe API rate limit usage > 80%
- [ ] Update Stripe connector documentation

**Long-term Improvements** (within 1 month):

- [ ] Implement automatic kill switch on rate limit
- [ ] Add rate limiting to all connectors
- [ ] Create connector health dashboard

## Metrics

**Before Incident**:

- Error rate: 0.5%
- Failed ingestions: 5 per day
- Stripe connector success rate: 99.5%

**During Incident**:

- Error rate: 12%
- Failed ingestions: 150 in 45 minutes
- Stripe connector success rate: 0%

**After Resolution**:

- Error rate: 0.3%
- Failed ingestions: 2 per day
- Stripe connector success rate: 99.7%

## Lessons Learned

**What Went Well**:

- Alert system detected issue quickly
- Kill switch prevented further damage
- Team responded quickly
- Daily intelligence report helped identify root cause

**What Could Be Improved**:

- Proactive rate limit monitoring
- Automatic kill switch on rate limit
- Better error messages for rate limit errors

**Action Items**:

- [ ] Engineering: Add rate limit monitoring (Due: 2026-02-07)
- [ ] Engineering: Implement automatic kill switch (Due: 2026-02-14)
- [ ] Product: Update connector documentation (Due: 2026-02-07)

## References

- Alert: `/api/v1/operator/alerts/history?alertId=alert-abc-123`
- Daily intelligence: `/api/v1/operator/daily-intelligence?date=2026-01-31`
- Failed ingestions: `/api/v1/operator/failed-ingestions?date=2026-01-31`
- Kill switch: `/api/v1/operator/kill-switches?name=connector_stripe`

## Sign-off

**Incident Lead**: John Doe (2026-02-01)

**Engineering Lead**: Jane Smith (2026-02-01)

**Product Lead**: Bob Johnson (2026-02-01)
