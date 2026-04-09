# Settler Automation Inventory

**Version:** 1.0  
**Date:** January 2026  
**Purpose:** Complete catalog of all automations and their status

---

## Automation Status Legend

- ✅ **Implemented** - Fully functional
- 🟡 **Partial** - Partially implemented, needs completion
- 🔴 **Planned** - Designed but not implemented
- ⚠️ **Needs Review** - May need updates

---

## Account Lifecycle Automations

### ✅ Trial Provisioning

- **What:** Auto-provisions 14-day trial on signup
- **Trigger:** User signup → Database trigger
- **Location:** `supabase/migrations/20260126000001_automated_trial_provisioning.sql`
- **Status:** ✅ Implemented

### ✅ Trial Expiration Handling

- **What:** Converts expired trials to free tier
- **Trigger:** Daily cron job
- **Location:** `supabase/functions/automated-onboarding-emails/index.ts`
- **Status:** ✅ Implemented

### ✅ Onboarding Progress Tracking

- **What:** Tracks user onboarding steps automatically
- **Trigger:** User actions (API key creation, job creation, etc.)
- **Location:** `supabase/migrations/20260126000002_automated_onboarding_triggers.sql`
- **Status:** ✅ Implemented

### 🟡 Onboarding Email Sequence

- **What:** Sends Day 0, 1, 3 emails and trial expiration warnings
- **Trigger:** Daily cron job
- **Location:** `supabase/functions/automated-onboarding-emails/index.ts`
- **Status:** 🟡 Partial (needs Resend API integration for actual sending)

### 🔴 Automated Offboarding

- **What:** Cleanup user data on account deletion
- **Trigger:** Account deletion
- **Status:** 🔴 Planned

---

## Monitoring & Health Automations

### ✅ Automated Health Checks

- **What:** Monitors database, webhooks, billing, usage, email service
- **Trigger:** Every 5 minutes (scheduled)
- **Location:** `supabase/functions/automated-health-checks/index.ts`
- **Status:** ✅ Implemented

### ✅ Automated Diagnostics

- **What:** Analyzes errors and generates diagnostic reports
- **Trigger:** Hourly or on error events
- **Location:** `supabase/functions/automated-diagnostics/index.ts`
- **Status:** ✅ Implemented

### 🔴 Automated Alerting

- **What:** Sends alerts on critical health check failures
- **Trigger:** Health check failures
- **Status:** 🔴 Planned (email/Slack integration needed)

---

## Billing Automations

### ✅ Stripe Webhook Processing

- **What:** Processes Stripe webhooks automatically
- **Trigger:** Stripe webhook events
- **Location:** `packages/api/src/routes/billing.ts`
- **Status:** ✅ Implemented

### ✅ Usage Tracking

- **What:** Tracks all API usage automatically
- **Trigger:** API calls
- **Location:** `supabase/functions/log-usage/index.ts`
- **Status:** ✅ Implemented

### ✅ Usage Warnings

- **What:** Warns users at 80%, 90%, 100% of limits
- **Trigger:** Real-time API calls + UI polling
- **Location:** `packages/web/src/app/api/console/usage/warnings/route.ts`
- **Status:** ✅ Implemented

### 🟡 Usage-to-Stripe Sync

- **What:** Syncs usage to Stripe for billing
- **Trigger:** Scheduled (daily)
- **Location:** `supabase/functions/sync-usage-to-stripe/index.ts`
- **Status:** 🟡 Partial (exists but needs verification)

### ✅ Billing Reconciliation

- **What:** Computes bills for active subscriptions
- **Trigger:** Scheduled (daily)
- **Location:** `supabase/functions/compute-bill/index.ts`
- **Status:** ✅ Implemented

### 🔴 Payment Recovery

- **What:** Automatically retries failed payments
- **Trigger:** Payment failure events
- **Status:** 🔴 Planned

---

## Support Automations

### 🔴 AI-Powered In-App Help

- **What:** Contextual help based on user's current page/action
- **Trigger:** User interactions
- **Status:** 🔴 Planned

### 🔴 AI Explanation of Data

- **What:** Explains what user is seeing in console
- **Trigger:** User requests
- **Status:** 🔴 Planned

### 🔴 AI-Generated Insights

- **What:** Auto-generates insights from receipt/console data
- **Trigger:** Data updates
- **Status:** 🔴 Planned

### 🔴 Error Classification

- **What:** Auto-classifies errors and user confusion
- **Trigger:** Error events
- **Status:** 🔴 Planned

---

## Growth Automations

### 🔴 SEO Foundations

- **What:** Programmatic pages, structured data, metadata
- **Trigger:** Content updates
- **Status:** 🔴 Planned

### 🔴 High-Intent Landing Pages

- **What:** Use-case-specific landing pages
- **Trigger:** User navigation
- **Status:** 🔴 Planned

### 🔴 Shareable Artifacts

- **What:** Reports, dashboards, exports that can be shared
- **Trigger:** User actions
- **Status:** 🔴 Planned

### ✅ Usage-Based Upgrade Prompts

- **What:** Shows upgrade prompts when approaching limits
- **Trigger:** Usage warnings
- **Location:** `packages/web/src/components/console/UsageWarningBanner.tsx`
- **Status:** ✅ Implemented

---

## Operational Automations

### ✅ Database Migrations

- **What:** Automatic migrations on PR push/merge
- **Trigger:** GitHub Actions
- **Location:** `.github/workflows/`
- **Status:** ✅ Implemented

### ✅ Build & Deploy

- **What:** Automatic builds and deployments
- **Trigger:** Git push
- **Location:** Vercel
- **Status:** ✅ Implemented

### 🔴 Secret Rotation

- **What:** Automated secret rotation every 90 days
- **Trigger:** Scheduled
- **Status:** 🔴 Planned

### 🔴 Backup Automation

- **What:** Automated database backups
- **Trigger:** Daily
- **Status:** 🔴 Planned (Supabase handles this, but need verification)

---

## Conversion Automations

### ✅ Plan Differentiation

- **What:** Clear plan comparison on pricing page
- **Trigger:** User navigation
- **Location:** `packages/web/src/app/pricing/page.tsx`
- **Status:** ✅ Implemented

### ✅ Usage-Based Nudges

- **What:** Upgrade prompts tied to usage warnings
- **Trigger:** Usage warnings
- **Location:** `packages/web/src/components/console/UsageWarningBanner.tsx`
- **Status:** ✅ Implemented

### 🔴 Value Moment Upgrade Prompts

- **What:** Upgrade prompts at key value moments
- **Trigger:** User actions (first reconciliation, etc.)
- **Status:** 🔴 Planned

---

## Feature Flags & Kill Switches

### ✅ Feature Flags

- **What:** Edge-compatible feature flags
- **Location:** `packages/api/src/services/feature-flags/`
- **Status:** ✅ Implemented

### 🔴 Kill Switches for Automations

- **What:** Ability to disable automations in emergency
- **Location:** Environment variables
- **Status:** 🔴 Planned (documented but not fully implemented)

---

## Automation Coverage Summary

### Implemented: 12 automations

- Trial provisioning
- Trial expiration
- Onboarding tracking
- Health checks
- Diagnostics
- Usage tracking
- Usage warnings
- Webhook processing
- Billing reconciliation
- Upgrade prompts
- Plan differentiation
- Feature flags

### Partial: 2 automations

- Onboarding emails (needs Resend integration)
- Usage-to-Stripe sync (needs verification)

### Planned: 15 automations

- Offboarding
- Alerting
- Payment recovery
- AI support layer (4 features)
- SEO foundations
- Landing pages
- Shareable artifacts
- Secret rotation
- Backup automation
- Value moment prompts
- Kill switches

---

## Priority for Next Implementation

1. **Resend Email Integration** (High) - Complete onboarding emails
2. **Automated Alerting** (High) - Get notified of issues
3. **AI Support Layer** (Medium) - Reduce support burden
4. **SEO Foundations** (Medium) - Drive organic traffic
5. **Kill Switches** (Medium) - Emergency controls

---

**Last Updated:** January 2026  
**Next Review:** After each automation addition
