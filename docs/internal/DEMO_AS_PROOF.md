# Demo-as-Proof System

**Version:** 1.0  
**Date:** 2025-01-XX  
**Status:** LOCKED - Canonical Demo Flow  
**Purpose:** ONE canonical demo flow that proves Settler's value in under 10 minutes

---

## Demo Requirements

### Must Show
1. **Ingestion:** Data ingestion from CSV or connector
2. **Reconciliation:** Automatic reconciliation matching
3. **Exception:** Exception identification and reporting
4. **Audit Trail:** Complete audit trail with export

### Must Prove
1. **Automatic Behavior:** Reconciliation happens automatically (no configuration)
2. **Permission Enforcement:** Plan limits are enforced (show denial moment)
3. **Deterministic Matching:** Matching is deterministic (reproducible)
4. **Audit Trail:** Complete audit trail for compliance

### Must Include
1. **At least one failure/denial moment:** Show plan limit enforcement
2. **Visible proof claims:** Every claim must be visible in console
3. **Buyer insight:** Connect each step to buyer value
4. **Pricing justification:** Show why pricing is justified

---

## Canonical Demo Flow (10 Minutes)

### Step 1: Onboarding (1 minute)
- **Action:** Sign up → Verify email → Get API key
- **Route:** `/signup` → `/verify-email` → `/console/api-keys`
- **Proof Claim:** "5-minute integration" → Actually takes <1 minute to get API key
- **Buyer Insight:** Fast onboarding, no friction
- **Pricing Justification:** Free tier allows testing without commitment

### Step 2: Data Ingestion (2 minutes)
- **Action:** Upload CSV file with transactions
- **Route:** `/console/ingestion` → Upload CSV
- **Backend:** `POST /api/v1/ingestion/upload`
- **Proof Claim:** "Automatic normalization" → CSV automatically normalized
- **Buyer Insight:** No manual mapping required, automatic column detection
- **Pricing Justification:** Ingestion is core value, not free (plan limits apply)

**Demo Data:**
- CSV with 100 transactions (Stripe payments)
- Auto-detected columns (amount, date, description, etc.)
- Normalized transactions visible in console

### Step 3: Reconciliation (2 minutes)
- **Action:** Run reconciliation (automatic or manual trigger)
- **Route:** `/console/reconciliation` → Run reconciliation
- **Backend:** `POST /api/v1/reconciliation/run`
- **Proof Claim:** "Automatic matching" → Matches created automatically
- **Buyer Insight:** No configuration required, deterministic matching
- **Pricing Justification:** Reconciliation is core value, plan limits enforce usage

**Demo Data:**
- 100 source transactions (Stripe)
- 95 target transactions (QuickBooks)
- 90 matches created automatically
- 5 exceptions flagged

### Step 4: Exception Review (2 minutes)
- **Action:** Review exceptions, see unmatched transactions
- **Route:** `/console/reconciliation/[runId]` → Exceptions tab
- **Backend:** `GET /api/v1/reconciliation/runs/:runId/exceptions`
- **Proof Claim:** "Exception identification" → Exceptions automatically flagged
- **Buyer Insight:** Exceptions visible immediately, no manual hunting
- **Pricing Justification:** Exception handling is core value

**Demo Data:**
- 5 exceptions shown (unmatched transactions)
- Reasons displayed (no match found, amount mismatch, etc.)
- Confidence scores visible

### Step 5: Plan Limit Enforcement (1 minute)
- **Action:** Try to exceed plan limit, see denial
- **Route:** `/console/ingestion` → Upload CSV (exceeds limit)
- **Backend:** `POST /api/v1/ingestion/upload` → Returns 403
- **Proof Claim:** "Plan limits enforced" → API returns 403 with upgrade message
- **Buyer Insight:** Limits are real, not just UI warnings
- **Pricing Justification:** Limits enforce value, upgrade path clear

**Demo Data:**
- Free plan: 1,000 reconciliations/month limit
- Try to upload CSV that would exceed limit
- See 403 error with upgrade message

### Step 6: Audit Trail (2 minutes)
- **Action:** View audit trail, export report
- **Route:** `/console/audit-trail` → View → Export
- **Backend:** `GET /api/v1/audit-trail` → `GET /api/v1/audit-trail/export`
- **Proof Claim:** "Complete audit trail" → Every action logged, exportable
- **Buyer Insight:** Compliance-ready, complete audit trail
- **Pricing Justification:** Audit trail is core value, log retention varies by plan

**Demo Data:**
- Audit trail shows all reconciliation actions
- Export as CSV/JSON
- Complete history visible

---

## Demo Script

### Introduction (30 seconds)
"Today I'll show you how Settler automates financial reconciliation. In under 10 minutes, you'll see ingestion, automatic matching, exception handling, and audit trails—all without configuration."

### Step 1: Onboarding (1 minute)
"First, let's sign up and get an API key. This takes less than a minute. [Sign up, verify email, get API key] Done. We now have an API key and can start using Settler."

### Step 2: Data Ingestion (2 minutes)
"Now let's upload a CSV file with 100 Stripe transactions. [Upload CSV] Settler automatically detects the columns and normalizes the data. [Show normalized transactions] No manual mapping required—it just works."

### Step 3: Reconciliation (2 minutes)
"Now let's run reconciliation. [Run reconciliation] Settler automatically matches transactions between Stripe and QuickBooks. [Show matches] 90 matches created automatically, no configuration needed. [Show exceptions] 5 exceptions flagged for review."

### Step 4: Exception Review (2 minutes)
"Let's review the exceptions. [Show exceptions] Each exception shows why it wasn't matched—no match found, amount mismatch, etc. [Show confidence scores] Confidence scores indicate match quality."

### Step 5: Plan Limit Enforcement (1 minute)
"Now let's see what happens when we hit a plan limit. [Try to exceed limit] The API returns 403 with a clear message: 'You've reached your limit. Upgrade to increase it.' Limits are enforced at the API level, not just UI warnings."

### Step 6: Audit Trail (2 minutes)
"Finally, let's view the audit trail. [Show audit trail] Every action is logged—ingestion, reconciliation, matches, exceptions. [Export report] We can export the complete audit trail as CSV or JSON for compliance."

### Conclusion (30 seconds)
"In under 10 minutes, we've seen automatic ingestion, reconciliation, exception handling, and audit trails—all without configuration. Settler does the work, you supervise exceptions. That's reconciliation-as-a-service."

---

## Demo Data Requirements

### CSV File (Stripe Transactions)
```csv
date,amount,description,external_id
2024-01-01,100.00,Payment for Order #1234,ch_1234
2024-01-02,200.00,Payment for Order #1235,ch_1235
...
```

### Target Data (QuickBooks Transactions)
- 95 transactions (5 missing to create exceptions)
- Same format as source
- Some amount mismatches to create exceptions

---

## Proof Claims Mapping

### Claim: "5-minute integration"
- **Proof:** API key obtained in <1 minute
- **Demo Step:** Step 1 (Onboarding)

### Claim: "Automatic normalization"
- **Proof:** CSV automatically normalized, no manual mapping
- **Demo Step:** Step 2 (Data Ingestion)

### Claim: "Automatic matching"
- **Proof:** Matches created automatically, no configuration
- **Demo Step:** Step 3 (Reconciliation)

### Claim: "Exception identification"
- **Proof:** Exceptions automatically flagged with reasons
- **Demo Step:** Step 4 (Exception Review)

### Claim: "Plan limits enforced"
- **Proof:** API returns 403 when limit exceeded
- **Demo Step:** Step 5 (Plan Limit Enforcement)

### Claim: "Complete audit trail"
- **Proof:** Every action logged, exportable
- **Demo Step:** Step 6 (Audit Trail)

---

## Buyer Insights Mapping

### Insight: "Fast onboarding"
- **Demo Step:** Step 1 (Onboarding)
- **Value:** No friction, start immediately

### Insight: "No manual mapping"
- **Demo Step:** Step 2 (Data Ingestion)
- **Value:** Saves time, reduces errors

### Insight: "No configuration"
- **Demo Step:** Step 3 (Reconciliation)
- **Value:** Works out-of-box, no setup

### Insight: "Exception visibility"
- **Demo Step:** Step 4 (Exception Review)
- **Value:** See issues immediately, no hunting

### Insight: "Real limits"
- **Demo Step:** Step 5 (Plan Limit Enforcement)
- **Value:** Limits are enforced, not just warnings

### Insight: "Compliance-ready"
- **Demo Step:** Step 6 (Audit Trail)
- **Value:** Complete audit trail for compliance

---

## Pricing Justification Mapping

### Justification: "Core value is never free"
- **Demo Step:** Step 2 (Data Ingestion) - Plan limits apply
- **Message:** Ingestion is core value, limits enforce usage

### Justification: "Upgrade moments are visible"
- **Demo Step:** Step 5 (Plan Limit Enforcement)
- **Message:** Limits create clear upgrade moments

### Justification: "Pricing reflects enforcement"
- **Demo Step:** Step 5 (Plan Limit Enforcement)
- **Message:** Limits are real, not just UI warnings

---

## Demo Failure Scenarios

### Scenario 1: API Key Invalid
- **Action:** Use invalid API key
- **Expected:** 401 Unauthorized with clear message
- **Demo:** Show error message explains WHY (invalid key format)

### Scenario 2: Plan Limit Exceeded
- **Action:** Exceed reconciliation limit
- **Expected:** 403 Forbidden with upgrade message
- **Demo:** Show error message explains WHY (limit exceeded, upgrade path)

### Scenario 3: CSV Invalid Format
- **Action:** Upload invalid CSV
- **Expected:** 400 Bad Request with detected headers/mapping
- **Demo:** Show error message explains WHY (invalid format, suggestions)

---

## Next Steps

1. **Create Demo Data:** Generate CSV files and target data
2. **Test Demo Flow:** Run through demo flow, verify all steps work
3. **Record Demo:** Record demo video for sales/marketing
4. **Create Demo Script:** Finalize demo script with exact timing
5. **Train Sales:** Train sales team on demo flow

---

**This document is LOCKED. Demo must prove all claims.**
