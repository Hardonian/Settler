# Settler.dev Security Incident Response Runbook

**Version:** 1.0  
**Last Updated:** 2025-01-20

---

## Overview

This runbook provides step-by-step procedures for responding to security incidents in Settler.dev.

---

## Incident Severity Levels

### Critical (P0)
- Data breach
- System compromise
- Billing fraud >$10K
- DDoS attack (service down)

### High (P1)
- Billing fraud <$10K
- Rate limit abuse
- Integration compromise
- API abuse

### Medium (P2)
- Anomaly detected
- Failed authentication spike
- Performance degradation

### Low (P3)
- Minor security alerts
- False positives
- Informational events

---

## Incident Response Procedures

### 1. Detection

**Sources:**
- Alert notifications (email, webhook, Telegram)
- Monitoring dashboards
- Customer reports
- Security logs

**Initial Assessment:**
1. Check alert details in `alerts` table
2. Review related logs
3. Assess severity
4. Notify security team

### 2. Containment

#### For Billing Fraud:

```sql
-- Suspend billing account
UPDATE billing_accounts
SET status = 'suspended',
    updated_at = NOW()
WHERE id = 'billing-account-id';

-- Revoke API keys
UPDATE api_keys
SET revoked_at = NOW()
WHERE user_id = (SELECT user_id FROM billing_accounts WHERE id = 'billing-account-id');
```

#### For Rate Limit Abuse:

```sql
-- Block IP address (add to firewall/rate limiter)
-- Or suspend user account
UPDATE users
SET deleted_at = NOW()
WHERE id = 'user-id';
```

#### For Integration Compromise:

```sql
-- Revoke integration credentials
UPDATE integration_credentials
SET status = 'revoked',
    revoked_at = NOW()
WHERE tenant_id = 'tenant-id'
  AND integration_id = 'compromised-integration';

-- Disable integration
UPDATE integration_health
SET auto_disabled = true,
    status = 'error'
WHERE tenant_id = 'tenant-id'
  AND integration_id = 'compromised-integration';
```

### 3. Investigation

**Gather Evidence:**

```sql
-- Get audit logs
SELECT * FROM audit_logs
WHERE tenant_id = 'tenant-id'
  OR billing_account_id = 'billing-account-id'
ORDER BY timestamp DESC
LIMIT 100;

-- Get fraud signals
SELECT * FROM fraud_signals
WHERE billing_account_id = 'billing-account-id'
ORDER BY created_at DESC;

-- Get usage events
SELECT * FROM usage_events
WHERE billing_account_id = 'billing-account-id'
ORDER BY timestamp DESC
LIMIT 100;
```

**Check Integration Health:**

```sql
SELECT * FROM integration_health
WHERE tenant_id = 'tenant-id'
ORDER BY updated_at DESC;
```

### 4. Remediation

#### Billing Fraud Remediation:

1. **Suspend account** (see Containment)
2. **Review usage events:**
   ```sql
   SELECT * FROM usage_events
   WHERE billing_account_id = 'billing-account-id'
     AND timestamp >= NOW() - INTERVAL '7 days'
   ORDER BY timestamp DESC;
   ```
3. **Reverse fraudulent charges** (manual process)
4. **Notify customer** (if legitimate account)

#### API Abuse Remediation:

1. **Block IP/user** (see Containment)
2. **Review API logs:**
   ```sql
   SELECT * FROM audit_logs
   WHERE ip = 'abusive-ip'
   ORDER BY timestamp DESC;
   ```
3. **Update rate limits** (if needed)
4. **Add to blocklist**

#### Integration Compromise Remediation:

1. **Revoke credentials** (see Containment)
2. **Rotate secrets:**
   - Generate new OAuth tokens
   - Update webhook secrets
   - Notify customer to re-authenticate
3. **Review integration logs:**
   ```sql
   SELECT * FROM integration_health
   WHERE integration_id = 'compromised-integration'
   ORDER BY updated_at DESC;
   ```

### 5. Recovery

**Restore Service:**

1. **Verify fix applied**
2. **Monitor for recurrence**
3. **Update security measures** (if needed)
4. **Document incident**

**Re-enable Account (if false positive):**

```sql
-- Re-enable billing account
UPDATE billing_accounts
SET status = 'active',
    updated_at = NOW()
WHERE id = 'billing-account-id';

-- Re-enable integration
UPDATE integration_health
SET auto_disabled = false,
    status = 'healthy'
WHERE tenant_id = 'tenant-id'
  AND integration_id = 'integration-id';
```

### 6. Post-Incident

**Documentation:**

1. **Incident report:**
   - What happened
   - Root cause
   - Impact
   - Remediation steps
   - Prevention measures

2. **Update runbook** (if needed)

3. **Team review** (lessons learned)

---

## Common Scenarios

### Scenario 1: Usage Spike (Fraud Signal)

**Symptoms:**
- Alert: "Fraud Signal Detected"
- Usage spike >300%
- Billing account flagged

**Response:**
1. Check fraud signal details
2. Review usage events
3. Suspend if confirmed fraud
4. Investigate root cause

### Scenario 2: Rate Limit Abuse

**Symptoms:**
- Alert: "Rate limit exceeded"
- High API call volume
- Service degradation

**Response:**
1. Identify abusive IP/user
2. Block IP or suspend user
3. Review API logs
4. Update rate limits if needed

### Scenario 3: Integration Failure

**Symptoms:**
- Alert: "Integration failure"
- High error rate
- Auto-disabled integration

**Response:**
1. Check integration health
2. Review error logs
3. Test integration manually
4. Re-enable if fixed

### Scenario 4: Cost Explosion

**Symptoms:**
- Alert: "Cost threshold exceeded"
- High AI usage costs
- Billing threshold hit

**Response:**
1. Check AI usage quotas
2. Suspend AI usage if needed
3. Review usage patterns
4. Adjust quotas if legitimate

---

## Escalation

**Escalate to Security Team if:**
- Data breach suspected
- System compromise
- Billing fraud >$10K
- Unable to contain incident

**Contact:**
- **Security Team:** security@settler.dev
- **On-Call:** [On-call rotation]
- **Emergency:** [Emergency contact]

---

## Tools & Commands

### Database Queries

```sql
-- Find abusive accounts
SELECT ba.*, COUNT(fs.id) as fraud_signal_count
FROM billing_accounts ba
LEFT JOIN fraud_signals fs ON fs.billing_account_id = ba.id
WHERE fs.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY ba.id
HAVING COUNT(fs.id) >= 3;

-- Check rate limit violations
SELECT ip, COUNT(*) as violation_count
FROM audit_logs
WHERE status_code = 429
  AND timestamp >= NOW() - INTERVAL '1 hour'
GROUP BY ip
ORDER BY violation_count DESC;
```

### Edge Function Logs

```bash
# View logs
supabase functions logs log-usage-secure --tail

# Filter for errors
supabase functions logs log-usage-secure | grep ERROR
```

---

## Prevention

**Regular Tasks:**
1. Review fraud signals daily
2. Monitor rate limit violations
3. Check integration health weekly
4. Review audit logs monthly
5. Update security measures quarterly

---

**Last Updated:** 2025-01-20
