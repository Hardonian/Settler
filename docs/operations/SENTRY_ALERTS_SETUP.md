# Sentry Alerts Setup Guide

This guide explains how to configure Sentry alerts for Settler.dev production monitoring.

## Prerequisites

1. Sentry account created at https://sentry.io
2. Project created in Sentry dashboard
3. `SENTRY_DSN` configured in environment variables

## Alert Configuration

### 1. Critical Error Alerts

**Alert Name:** Critical Errors  
**Trigger:** When error with tag `type:critical_error` occurs

**Setup:**
1. Go to Sentry Dashboard → Alerts → Create Alert
2. Set conditions:
   - **When:** An issue is created
   - **Filter:** `tags[type]` equals `critical_error`
   - **Action:** Send notification to email/Slack/PagerDuty

**Recommended Actions:**
- Email: engineering@settler.dev
- Slack: #alerts-critical
- PagerDuty: Critical severity

---

### 2. Billing Error Alerts

**Alert Name:** Billing Errors  
**Trigger:** When error with tag `type:billing_error` occurs

**Setup:**
1. Create alert with condition:
   - **When:** An issue is created
   - **Filter:** `tags[type]` equals `billing_error`
   - **Action:** Send notification

**Recommended Actions:**
- Email: billing@settler.dev
- Slack: #alerts-billing
- PagerDuty: High severity

**Why Important:**
Billing errors can prevent customers from subscribing or cause payment failures. These need immediate attention.

---

### 3. Payment Failure Alerts

**Alert Name:** Payment Failures  
**Trigger:** When error with tag `type:payment_failure` occurs

**Setup:**
1. Create alert with condition:
   - **When:** An issue is created
   - **Filter:** `tags[type]` equals `payment_failure`
   - **Action:** Send notification

**Recommended Actions:**
- Email: billing@settler.dev
- Slack: #alerts-payments
- PagerDuty: High severity

**Why Important:**
Payment failures indicate customers are unable to pay. This directly impacts revenue.

---

### 4. Usage Limit Exceeded Alerts

**Alert Name:** Usage Limit Exceeded  
**Trigger:** When message with tag `type:usage_limit_exceeded` occurs

**Setup:**
1. Create alert with condition:
   - **When:** An issue is created
   - **Filter:** `tags[type]` equals `usage_limit_exceeded`
   - **Action:** Send notification

**Recommended Actions:**
- Email: ops@settler.dev
- Slack: #alerts-usage
- PagerDuty: Medium severity

**Why Important:**
Usage limit exceeded events indicate customers are hitting plan limits. This is an upgrade opportunity but also needs monitoring to ensure limits are enforced correctly.

---

## Alert Rules Configuration

### Rate Limiting

To prevent alert fatigue, configure rate limiting:

1. **Critical Errors:** Alert immediately, no rate limit
2. **Billing Errors:** Alert immediately, no rate limit
3. **Payment Failures:** Alert immediately, no rate limit
4. **Usage Limits:** Alert once per hour per account

### Alert Aggregation

Configure alerts to aggregate similar errors:

- Group by: `error.type`, `tags[service]`, `tags[planCode]`
- Window: 1 hour
- Threshold: 5 occurrences

---

## Dashboard Setup

### Create Error Dashboard

1. Go to Sentry Dashboard → Dashboards → Create Dashboard
2. Add widgets:

**Widget 1: Error Rate**
- Query: `count()`
- Group by: `tags[type]`
- Time range: Last 24 hours

**Widget 2: Billing Errors**
- Query: `count()`
- Filter: `tags[type]` equals `billing_error`
- Time range: Last 7 days

**Widget 3: Payment Failures**
- Query: `count()`
- Filter: `tags[type]` equals `payment_failure`
- Time range: Last 7 days

**Widget 4: Usage Limit Events**
- Query: `count()`
- Filter: `tags[type]` equals `usage_limit_exceeded`
- Group by: `tags[service]`
- Time range: Last 24 hours

---

## Integration with PagerDuty

### Setup PagerDuty Integration

1. Go to Sentry → Settings → Integrations → PagerDuty
2. Connect your PagerDuty account
3. Configure service mappings:
   - `critical_error` → PagerDuty Service: "Critical Alerts"
   - `billing_error` → PagerDuty Service: "Billing Alerts"
   - `payment_failure` → PagerDuty Service: "Payment Alerts"

### Escalation Policy

Configure escalation policy:
- Level 1: On-call engineer (5 minutes)
- Level 2: Engineering manager (15 minutes)
- Level 3: CTO (30 minutes)

---

## Integration with Slack

### Setup Slack Integration

1. Go to Sentry → Settings → Integrations → Slack
2. Connect your Slack workspace
3. Configure channel mappings:
   - `critical_error` → #alerts-critical
   - `billing_error` → #alerts-billing
   - `payment_failure` → #alerts-payments
   - `usage_limit_exceeded` → #alerts-usage

### Message Format

Sentry will send formatted messages like:
```
🚨 Critical Error
Error: Failed to create checkout session
Service: billing
Plan: pro
Billing Account: abc123
[View in Sentry](https://sentry.io/...)
```

---

## Testing Alerts

### Test Alert Configuration

1. **Trigger Test Error:**
   ```typescript
   import { trackCriticalError } from '@/lib/monitoring/alerts';
   
   trackCriticalError(new Error('Test alert'), {
     service: 'billing',
     planCode: 'pro',
   });
   ```

2. **Verify Alert Received:**
   - Check email inbox
   - Check Slack channel
   - Check PagerDuty (if configured)

### Test Frequency

Test alerts monthly to ensure:
- Alert delivery is working
- Team members are notified
- Escalation policies are correct

---

## Monitoring Best Practices

1. **Review Alerts Weekly:**
   - Identify patterns
   - Fix root causes
   - Update alert thresholds if needed

2. **Tune Alert Sensitivity:**
   - Too many alerts → Increase thresholds
   - Missing issues → Decrease thresholds

3. **Document Alert Responses:**
   - Create runbooks for common alerts
   - Document resolution steps
   - Track alert resolution time

---

## Alert Response Runbooks

### Critical Error Response

1. **Immediate Actions:**
   - Check Sentry for error details
   - Review error stack trace
   - Check recent deployments

2. **Investigation:**
   - Review error context (billingAccountId, planCode, etc.)
   - Check related logs
   - Verify environment variables

3. **Resolution:**
   - Fix root cause
   - Deploy fix
   - Verify resolution

### Payment Failure Response

1. **Immediate Actions:**
   - Check Stripe dashboard for payment details
   - Review customer's payment method
   - Check subscription status

2. **Investigation:**
   - Review payment failure reason
   - Check customer's billing account
   - Verify webhook processing

3. **Resolution:**
   - Contact customer if needed
   - Update payment method
   - Retry payment

---

## Environment-Specific Configuration

### Development
- Alerts: Email only
- Rate limiting: None
- Aggregation: Disabled

### Staging
- Alerts: Slack only
- Rate limiting: 1 per hour
- Aggregation: Enabled

### Production
- Alerts: Email + Slack + PagerDuty
- Rate limiting: Configured per alert type
- Aggregation: Enabled

---

## Next Steps

1. ✅ Configure Sentry alerts using this guide
2. ✅ Test alert delivery
3. ✅ Set up PagerDuty integration (optional)
4. ✅ Set up Slack integration
5. ✅ Create error dashboard
6. ✅ Document alert response procedures

For questions or issues, contact: ops@settler.dev
