# How Settler Runs Itself

**Version:** 1.0  
**Date:** January 2026  
**Purpose:** Document all automated systems that enable solo-founder operations

---

## Overview

Settler is designed to operate with minimal human intervention. This document catalogs all automated systems, their triggers, and what happens automatically.

---

## Automated Systems Inventory

### 1. Trial Provisioning

**What:** Automatically provisions 14-day free trial for new signups

**How:**
- Database trigger `trigger_provision_trial_on_signup` fires on profile creation
- Sets `plan_type = 'trial'`, `trial_start_date = NOW()`, `trial_end_date = NOW() + 14 days`
- No manual intervention required

**Trigger:** User signup → Profile insert

**Status:** ✅ Implemented

---

### 2. Trial Expiration Handling

**What:** Automatically converts expired trials to free tier

**How:**
- Edge function `automated-onboarding-emails` calls `handle_trial_expiration()` daily
- Updates `plan_type = 'free'` for expired trials
- Logs expiration events to `activity_log`

**Trigger:** Scheduled (daily via cron or manual invocation)

**Status:** ✅ Implemented

---

### 3. Onboarding Progress Tracking

**What:** Automatically tracks user onboarding progress based on actions

**How:**
- Database triggers fire on:
  - API key creation → `first_api_key` step
  - Reconciliation job creation → `first_job` step
  - Reconciliation completion → `first_reconciliation` step
  - Receipt parsing → `first_receipt` step
- Updates `onboarding_progress` table automatically

**Trigger:** User actions (API key creation, job creation, etc.)

**Status:** ✅ Implemented

---

### 4. Onboarding Email Sequence

**What:** Sends automated onboarding emails at Day 0, 1, 3, and trial expiration warnings

**How:**
- Edge function `automated-onboarding-emails` runs daily
- Queries users by signup date
- Sends welcome, onboarding reminder, activation, and expiration emails
- Logs all sends to `email_sends` table

**Trigger:** Scheduled (daily via cron)

**Status:** ✅ Implemented (email sending needs Resend API integration)

---

### 5. Health Checks

**What:** Automated health monitoring of critical systems

**How:**
- Edge function `automated-health-checks` runs every 5 minutes
- Checks:
  - Database connectivity
  - Database query performance
  - Stripe webhook processing
  - Billing reconciliation
  - Usage anomaly detection
  - Email service status
- Stores results in `health_checks` table
- Alerts on unhealthy status

**Trigger:** Scheduled (every 5 minutes)

**Status:** ✅ Implemented

---

### 6. Automated Diagnostics

**What:** Automated troubleshooting and root cause analysis

**How:**
- Edge function `automated-diagnostics` analyzes:
  - Failed webhook processing
  - Billing sync issues
  - Usage anomalies
  - Email delivery failures
  - Database performance issues
- Generates diagnostic reports with severity and recommended actions
- Stores in `diagnostics` table

**Trigger:** Scheduled (hourly) or on error events

**Status:** ✅ Implemented

---

### 7. Usage Tracking & Warnings

**What:** Tracks usage and warns users approaching limits

**How:**
- All API calls log to `usage_events` table
- API endpoint `/api/console/usage/warnings` calculates usage vs. limits
- `UsageWarningBanner` component displays warnings at 80%, 90%, 100%
- Upgrade prompts shown automatically

**Trigger:** Real-time (on API calls) + UI polling

**Status:** ✅ Implemented

---

### 8. Billing Automation

**What:** Automated billing reconciliation and subscription management

**How:**
- Stripe webhooks update `subscriptions` table automatically
- Usage events sync to Stripe via `sync-usage-to-stripe` edge function
- Billing reconciliation runs daily via `compute-bill` edge function
- Failed payments trigger `payment-recovery` automation

**Trigger:** Stripe webhooks + scheduled jobs

**Status:** ✅ Implemented (webhook processing exists)

---

### 9. Error Classification (Planned)

**What:** AI-powered error classification and user confusion detection

**How:**
- Analyzes error logs and user actions
- Classifies errors by type and severity
- Detects user confusion patterns
- Auto-generates help content

**Trigger:** On error events

**Status:** 🟡 Planned (foundation exists)

---

### 10. AI Support Layer (Planned)

**What:** AI-powered in-app help and troubleshooting

**How:**
- Contextual help based on user's current page/action
- AI explanation of user data ("what am I seeing?")
- Auto-generated insights from receipt/console data
- Self-service troubleshooting

**Trigger:** User interactions

**Status:** 🟡 Planned (foundation exists)

---

## Scheduled Jobs

### Daily Jobs

1. **Trial Expiration Handling** (00:00 UTC)
   - Converts expired trials to free tier
   - Sends expiration emails

2. **Onboarding Emails** (06:00 UTC)
   - Sends Day 0, 1, 3 emails
   - Sends trial expiration warnings

3. **Billing Reconciliation** (02:00 UTC)
   - Computes bills for all active subscriptions
   - Syncs usage to Stripe

4. **Health Check Summary** (00:00 UTC)
   - Generates daily health check summary
   - Sends alerts if issues detected

### Hourly Jobs

1. **Automated Diagnostics** (Every hour)
   - Analyzes system health
   - Generates diagnostic reports

2. **Usage Anomaly Detection** (Every hour)
   - Detects unusual usage patterns
   - Flags potential abuse

### Continuous

1. **Health Checks** (Every 5 minutes)
   - Monitors critical systems
   - Stores results

2. **Usage Tracking** (Real-time)
   - Logs all API usage
   - Updates usage counters

---

## What Requires Manual Intervention

### Currently Manual

1. **Customer Support**
   - Email responses
   - Custom troubleshooting
   - Account issues

2. **Security Incidents**
   - Manual investigation
   - Secret rotation
   - Access revocation

3. **Billing Disputes**
   - Manual review
   - Refund processing
   - Subscription adjustments

4. **Feature Rollouts**
   - Manual feature flag toggles
   - Gradual rollout management

### Planned Automation

1. **AI Support Layer** → Reduces support burden by 80%
2. **Automated Security Response** → Auto-rotate secrets, revoke access
3. **Automated Billing Dispute Handling** → AI-powered dispute resolution
4. **Automated Feature Rollouts** → Gradual rollout with auto-rollback

---

## Monitoring & Alerting

### Current Monitoring

- Health checks stored in `health_checks` table
- Diagnostics stored in `diagnostics` table
- Email sends tracked in `email_sends` table
- Usage tracked in `usage_events` table

### Alerting (Planned)

- Email alerts on critical health check failures
- Slack/Discord webhook integration
- PagerDuty integration for P0 incidents

---

## Kill Switches

### Feature Flags

- `ENABLE_AUTOMATED_TRIAL_PROVISIONING` (default: true)
- `ENABLE_AUTOMATED_EMAILS` (default: true)
- `ENABLE_AUTOMATED_HEALTH_CHECKS` (default: true)
- `ENABLE_AUTOMATED_DIAGNOSTICS` (default: true)

### Emergency Procedures

1. **Disable Trial Provisioning:**
   ```sql
   DROP TRIGGER trigger_provision_trial_on_signup ON profiles;
   ```

2. **Disable Automated Emails:**
   - Set `ENABLE_AUTOMATED_EMAILS=false` in environment
   - Or disable edge function in Supabase dashboard

3. **Disable Health Checks:**
   - Set `ENABLE_AUTOMATED_HEALTH_CHECKS=false` in environment

---

## Cost Control

### Automated Cost Monitoring

- Usage tracking prevents overages
- Usage warnings prevent unexpected bills
- Trial expiration prevents free tier abuse

### Manual Cost Controls

- Stripe usage-based billing caps
- Vercel spending limits
- Supabase usage alerts

---

## Future Automation Opportunities

1. **Automated Incident Response**
   - Auto-rollback on health check failures
   - Auto-scale on high load
   - Auto-restart failed services

2. **Automated Customer Success**
   - Proactive outreach to at-risk users
   - Automated win-back campaigns
   - Usage-based upgrade prompts

3. **Automated Content Generation**
   - SEO-optimized pages from data
   - Auto-generated documentation
   - Dynamic landing pages

---

**Last Updated:** January 2026  
**Next Review:** Quarterly or after major automation additions
