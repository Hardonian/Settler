# Incident Response Playbook

## Overview

This playbook outlines procedures for responding to security incidents in the Settler platform.

## Incident Severity Levels

### P0 - Critical

- **Examples**: Data breach, authentication bypass, RCE
- **Response Time**: Immediate (< 5 minutes)
- **Escalation**: On-call → Security Lead → CTO

### P1 - High

- **Examples**: API key leak, unauthorized access, data exposure
- **Response Time**: < 15 minutes
- **Escalation**: On-call → Security Lead

### P2 - Medium

- **Examples**: Rate limit bypass, information disclosure
- **Response Time**: < 1 hour
- **Escalation**: On-call engineer

### P3 - Low

- **Examples**: Misconfiguration, minor vulnerabilities
- **Response Time**: < 24 hours
- **Escalation**: Regular support

## Incident Response Phases

### 1. Triage

**Goal**: Assess severity and scope

**Steps:**

1. **Identify**: What happened? When? Who reported it?
2. **Classify**: Determine severity level
3. **Scope**: How many users/tenants affected?
4. **Impact**: What data/systems affected?

**Tools:**

- Audit logs: `SELECT * FROM audit_logs WHERE ...`
- Monitoring: Grafana dashboards
- Tracing: Jaeger/Tempo

**Checklist:**

- [ ] Incident identified and logged
- [ ] Severity level assigned
- [ ] On-call engineer notified
- [ ] Initial assessment completed

### 2. Containment

**Goal**: Prevent further damage

**Immediate Actions:**

1. **Isolate**: Disable affected accounts/API keys
2. **Block**: Block malicious IPs/requests
3. **Revoke**: Revoke compromised credentials
4. **Patch**: Apply emergency patches if needed

**Tools:**

```sql
-- Revoke API key
UPDATE api_keys SET revoked_at = NOW() WHERE id = 'key-id';

-- Suspend tenant
UPDATE tenants SET status = 'suspended' WHERE id = 'tenant-id';

-- Block IP
INSERT INTO blocked_ips (ip, reason, blocked_at)
VALUES ('1.2.3.4', 'Suspected attack', NOW());
```

**Checklist:**

- [ ] Affected systems isolated
- [ ] Credentials revoked
- [ ] Malicious traffic blocked
- [ ] Emergency patches applied

### 3. Eradication

**Goal**: Remove threat and fix vulnerabilities

**Steps:**

1. **Root Cause**: Identify root cause
2. **Fix**: Implement permanent fix
3. **Test**: Verify fix works
4. **Deploy**: Deploy fix to production

**Checklist:**

- [ ] Root cause identified
- [ ] Fix implemented and tested
- [ ] Fix deployed to production
- [ ] Monitoring confirms fix

### 4. Recovery

**Goal**: Restore normal operations

**Steps:**

1. **Verify**: Confirm threat is removed
2. **Restore**: Restore affected services
3. **Monitor**: Enhanced monitoring
4. **Communicate**: Notify affected users

**Checklist:**

- [ ] Services restored
- [ ] Enhanced monitoring active
- [ ] Users notified (if required)
- [ ] Normal operations resumed

### 5. Post-Mortem

**Goal**: Learn and improve

**Steps:**

1. **Timeline**: Document incident timeline
2. **Analysis**: What went wrong? What went well?
3. **Actions**: Action items to prevent recurrence
4. **Document**: Update runbook with learnings

**Checklist:**

- [ ] Post-mortem meeting scheduled
- [ ] Timeline documented
- [ ] Root cause analysis completed
- [ ] Action items tracked
- [ ] Runbook updated

## Worked Scenarios

### Scenario 1: Suspected API Key Leak

**Detection:**

- Unusual API usage pattern detected
- API key used from unexpected IP
- High error rate from key

**Triage:**

```sql
-- Check API key usage
SELECT * FROM audit_logs
WHERE api_key_id = 'suspected-key-id'
ORDER BY timestamp DESC
LIMIT 100;

-- Check IP addresses
SELECT DISTINCT ip FROM audit_logs
WHERE api_key_id = 'suspected-key-id'
AND timestamp > NOW() - INTERVAL '24 hours';
```

**Containment:**

```sql
-- Revoke API key immediately
UPDATE api_keys
SET revoked_at = NOW(),
    revoked_reason = 'Suspected leak'
WHERE id = 'suspected-key-id';

-- Log revocation
INSERT INTO audit_logs (event, api_key_id, metadata)
VALUES ('api_key_revoked', 'suspected-key-id',
  '{"reason": "Suspected leak", "revoked_by": "security-team"}');
```

**Eradication:**

1. Contact key owner
2. Investigate how key was leaked
3. Rotate all user's API keys
4. Review security practices

**Recovery:**

1. Issue new API key to user
2. Provide security guidance
3. Monitor for further anomalies

**Post-Mortem:**

- **Root Cause**: Key committed to public repository
- **Actions**:
  - Add pre-commit hook to detect secrets
  - Improve key rotation process
  - Add key usage alerts

### Scenario 2: Suspected Database Exfiltration

**Detection:**

- Unusual database query patterns
- Large data exports
- Queries from unexpected tenants

**Triage:**

```sql
-- Check recent large queries
SELECT
  tenant_id,
  COUNT(*) as query_count,
  SUM(LENGTH(query)) as total_bytes
FROM audit_logs
WHERE event = 'database_query'
AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY tenant_id
HAVING SUM(LENGTH(query)) > 1000000
ORDER BY total_bytes DESC;

-- Check RLS bypass attempts
SELECT * FROM audit_logs
WHERE metadata->>'rls_bypass_attempt' = 'true'
ORDER BY timestamp DESC;
```

**Containment:**

```sql
-- Suspend suspicious tenant
UPDATE tenants
SET status = 'suspended',
    metadata = jsonb_set(metadata, '{suspension_reason}', '"Suspected exfiltration"')
WHERE id = 'suspected-tenant-id';

-- Block tenant's IPs
INSERT INTO blocked_ips (ip, reason, tenant_id)
SELECT DISTINCT ip, 'Suspected exfiltration', 'suspected-tenant-id'
FROM audit_logs
WHERE tenant_id = 'suspected-tenant-id'
AND timestamp > NOW() - INTERVAL '1 hour';
```

**Eradication:**

1. Review RLS policies
2. Verify no RLS bypasses
3. Check for SQL injection vulnerabilities
4. Review tenant access patterns

**Recovery:**

1. Verify data integrity
2. Restore tenant if false positive
3. Enhance monitoring for data access

**Post-Mortem:**

- **Root Cause**: Legitimate bulk export (false positive)
- **Actions**:
  - Improve anomaly detection
  - Add data export approval workflow
  - Enhance monitoring thresholds

## Communication Templates

### Internal Notification

```
Subject: [P0] Security Incident: [Brief Description]

Incident ID: INC-2026-001
Severity: P0 - Critical
Status: Containment

Summary:
[Brief description of incident]

Affected Systems:
- [System 1]
- [System 2]

Actions Taken:
- [Action 1]
- [Action 2]

Next Steps:
- [Step 1]
- [Step 2]

On-Call: [Name]
Slack: #incident-response
```

### Customer Notification (Data Breach)

```
Subject: Important Security Notice

Dear [Customer Name],

We are writing to inform you of a security incident that may have affected your account.

What Happened:
[Description of incident]

What Information Was Involved:
[Description of affected data]

What We're Doing:
[Actions taken]

What You Should Do:
[Customer actions]

For Questions:
security@settler.io

We sincerely apologize for any inconvenience.

Settler Security Team
```

## Tools and Resources

### Logging

- **Audit Logs**: `audit_logs` table
- **Application Logs**: CloudWatch/LogDNA
- **Access Logs**: Load balancer logs

### Monitoring

- **Grafana**: https://grafana.settler.io
- **Prometheus**: https://prometheus.settler.io
- **Jaeger**: https://jaeger.settler.io

### Communication

- **Slack**: #incident-response
- **PagerDuty**: On-call rotation
- **Status Page**: https://status.settler.io

## Escalation Contacts

- **On-Call**: Check PagerDuty
- **Security Lead**: security-lead@settler.io
- **CTO**: cto@settler.io
- **Legal**: legal@settler.io (for data breaches)

## Regulatory Notifications

### GDPR (Article 33)

- **Supervisory Authority**: Within 72 hours
- **Template**: [GDPR breach notification template]

### SOC 2

- **Customers**: Within 24 hours (if data breach)
- **Auditors**: As required by audit

### HIPAA

- **HHS**: Within 60 days
- **Affected Individuals**: Within 60 days

## Lessons Learned

After each incident, update this section with:

- What went well
- What could be improved
- Process changes made
- Tool improvements needed
