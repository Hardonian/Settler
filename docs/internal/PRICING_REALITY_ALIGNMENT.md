# Pricing Reality Alignment

**Version:** 1.0  
**Date:** 2025-01-XX  
**Status:** LOCKED - Pricing Enforcement Rules  
**Purpose:** Ensure pricing reflects enforcement and dependency, backend enforces gates

---

## Core Principle

**"Pricing must reflect what is actually enforced. If backend doesn't enforce it, remove it from pricing page."**

---

## Current Pricing Tiers (From `billing-gating.ts`)

### Free
- **Price:** $0/month
- **Reconciliations:** 1,000/month ✅ Enforced
- **API Requests:** 10,000/month ✅ Enforced
- **Adapters:** 2 ⚠️ Need to verify enforcement
- **Log Retention:** 7 days ⚠️ Need to verify enforcement
- **Support:** Community ✅ N/A (no enforcement needed)

### Starter ($99/month)
- **Price:** $99/month ✅ Enforced (Stripe)
- **Reconciliations:** 50,000/month ✅ Enforced
- **API Requests:** 500,000/month ✅ Enforced
- **Adapters:** 5 ⚠️ Need to verify enforcement
- **Log Retention:** 30 days ⚠️ Need to verify enforcement
- **Support:** Email (24-hour SLA) ✅ N/A (no enforcement needed)

### Growth ($599/month)
- **Price:** $599/month ✅ Enforced (Stripe)
- **Reconciliations:** 500,000/month ✅ Enforced
- **API Requests:** 5,000,000/month ✅ Enforced
- **Adapters:** 15 ⚠️ Need to verify enforcement
- **Log Retention:** 90 days ⚠️ Need to verify enforcement
- **Support:** Priority email (24-hour SLA) ✅ N/A (no enforcement needed)

### Scale ($4,999/month)
- **Price:** $4,999/month ✅ Enforced (Stripe)
- **Reconciliations:** 5,000,000/month ✅ Enforced
- **API Requests:** 50,000,000/month ✅ Enforced
- **Adapters:** Unlimited ✅ Enforced (null check)
- **Log Retention:** 1 year ⚠️ Need to verify enforcement
- **Support:** Priority support (4-hour SLA) ✅ N/A (no enforcement needed)

### Enterprise (Custom)
- **Price:** Custom ✅ Enforced (Stripe)
- **Reconciliations:** Unlimited ✅ Enforced (null check)
- **API Requests:** Unlimited ✅ Enforced (null check)
- **Adapters:** Unlimited ✅ Enforced (null check)
- **Log Retention:** Custom (up to 7 years) ⚠️ Need to verify enforcement
- **Support:** Dedicated account manager (1-hour SLA) ✅ N/A (no enforcement needed)

---

## Enforcement Status

### ✅ Enforced (Backend Checks Exist)

1. **Reconciliation Limits:** `checkUsageQuotaForEvent` enforces limits
2. **API Request Limits:** `checkUsageQuotaForEvent` enforces limits
3. **Plan Pricing:** Stripe enforces subscription pricing
4. **Unlimited Features:** Null checks enforce unlimited (Scale/Enterprise)

### ⚠️ Needs Verification

1. **Adapter Limits:** Need to verify adapter count enforcement
2. **Log Retention:** Need to verify log retention enforcement
3. **Feature Gates:** Need to verify premium features are gated

---

## Pricing Page Claims vs Backend Reality

### Claims That Must Be Enforced

#### "50+ Platform Integrations"
- **Reality:** Need to verify actual adapter count
- **Action:** Count actual adapters, update if incorrect

#### "Real-Time Reconciliation"
- **Reality:** Reconciliation is async, not real-time
- **Action:** Remove "real-time" claim, use "automatic" or "continuous"

#### "99%+ Accuracy"
- **Reality:** Confidence scores indicate uncertainty
- **Action:** Keep claim but add disclaimer about confidence scores

#### "SOC 2 Type II Certified (Q3 2026)"
- **Reality:** Planned, not certified yet
- **Action:** Keep "planned" language, don't claim certification

#### "Unlimited Reconciliations (Enterprise)"
- **Reality:** Backend enforces unlimited (null check)
- **Action:** ✅ Correct, keep claim

---

## Plan Limit Enforcement Rules

### Rule 1: Backend Enforcement Required
- **All plan limits must be enforced at API level**
- **Frontend-only gating is invalid**
- **API must return 403 when limit exceeded**

### Rule 2: Error Messages Must Explain WHY
- **Include current usage vs limit**
- **Include current plan vs required plan**
- **Include upgrade path**

### Rule 3: Fail Open on Error (Grace Period)
- **If billing check fails, allow operation (fail open)**
- **Log error for investigation**
- **Don't block users due to billing system issues**

### Rule 4: Pilot/Trial Handling
- **Pilots have unlimited usage (within reason)**
- **Pilots expire after trial period**
- **Expired pilots return 403 with upgrade message**

---

## Feature Gate Enforcement

### Premium Features (Growth+)

#### Advanced Matching Rules
- **Required Plan:** Growth+
- **Enforcement:** `featureGate('advanced_matching_rules')`
- **Status:** ⚠️ Need to verify middleware exists

#### Multi-Currency Support
- **Required Plan:** Growth+
- **Enforcement:** `featureGate('multi_currency')`
- **Status:** ⚠️ Need to verify middleware exists

#### Custom Webhooks
- **Required Plan:** Growth+
- **Enforcement:** `featureGate('custom_webhooks')`
- **Status:** ⚠️ Need to verify middleware exists

### Enterprise Features

#### Custom Integrations
- **Required Plan:** Enterprise
- **Enforcement:** `featureGate('custom_integrations')` + enterprise check
- **Status:** ⚠️ Need to verify middleware exists

#### Dedicated Infrastructure
- **Required Plan:** Enterprise
- **Enforcement:** `featureGate('dedicated_infrastructure')` + enterprise check
- **Status:** ⚠️ Need to verify middleware exists

#### SSO (SAML, OIDC)
- **Required Plan:** Enterprise
- **Enforcement:** `featureGate('sso')` + enterprise check
- **Status:** ⚠️ Need to verify middleware exists

---

## Pricing Language That Must Be Removed

### 1. "Real-Time"
- **Current:** "Real-time reconciliation"
- **Reality:** Async processing, may have delays
- **Action:** Remove "real-time", use "automatic" or "continuous"

### 2. "100% Accurate"
- **Current:** "100% accurate matching"
- **Reality:** Confidence scores indicate uncertainty
- **Action:** Remove "100%", use "99%+ accuracy"

### 3. "Zero Downtime"
- **Current:** "Zero downtime guarantee"
- **Reality:** Brief outages may occur
- **Action:** Remove "zero downtime", use "99.9% uptime"

### 4. "Unlimited" (Non-Enterprise)
- **Current:** "Unlimited reconciliations" (on non-Enterprise plans)
- **Reality:** All plans have limits except Enterprise
- **Action:** Remove "unlimited" from non-Enterprise plans

### 5. "AI-Powered Reconciliation"
- **Current:** "AI-powered reconciliation engine"
- **Reality:** Deterministic matching, not AI-powered
- **Action:** Remove "AI-powered", use "deterministic matching"

---

## Next Steps

1. **Verify Adapter Limits:** Check if adapter count is enforced
2. **Verify Log Retention:** Check if log retention is enforced
3. **Add Missing Feature Gates:** Add featureGate middleware to premium/enterprise routes
4. **Update Pricing Page:** Remove claims that can't be proven
5. **Add Enforcement Tests:** Add tests for plan limit enforcement
6. **Update Error Messages:** Ensure all limit errors explain WHY

---

**This document is LOCKED. Pricing must match enforcement.**
