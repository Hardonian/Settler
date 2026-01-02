# SETTLER REALITY MODE - BLOCKERS LIST

**Generated:** 2025-01-22  
**Status:** In Progress

---

## PHASE 1: STOP THE BLEEDING ✅ COMPLETE

### Fixed Issues:
1. ✅ **Billing enforcement returns 500 on error**
   - **Symptom:** `requireActiveSubscription()` returned 500 on failure
   - **Root Cause:** Error handling returned 500 instead of 403
   - **Fix:** Changed status codes from 500 to 403/401 with retryable flag
   - **Files Changed:**
     - `packages/web/src/lib/security/billing-enforcement.ts`
     - `packages/web/src/lib/security/entitlement-checks.ts`
     - `packages/web/src/lib/api/subscription-gate.ts`
     - `packages/web/src/lib/api/auth-gate.ts`
     - `packages/web/src/middleware/api-logger.ts`
     - `packages/web/src/app/api/ops/activation-funnel/route.ts`
     - `packages/web/src/app/api/ops/performance/route.ts`
   - **Verification:** All error handlers now return 200/403/401, never 500 (except Stripe webhook which intentionally returns 500 for retries)

2. ✅ **Created safe error handler utility**
   - **Files Created:** `packages/web/src/lib/api/safe-error-handler.ts`
   - **Purpose:** Centralized error normalization that never returns 500 to users

---

## PHASE 2: AUTH + TENANT ISOLATION 🔄 IN PROGRESS

### Completed:
1. ✅ **RLS policies exist and are comprehensive**
   - **Evidence:** `supabase/migrations/20250122000000_rls_enforcement_critical.sql`
   - **Coverage:** billing_accounts, subscriptions, normalized_transactions, reconciliation_runs, ingestion_sources

2. ✅ **Created tenant isolation verification script**
   - **File:** `scripts/validate-tenant-isolation.ts`
   - **Purpose:** End-to-end test proving RLS blocks cross-tenant access

3. ✅ **Created server-side tenant assertion helpers**
   - **File:** `packages/web/src/lib/security/tenant-assertion.ts`
   - **Purpose:** Server-side tenant checks complementing RLS

### Remaining:
- [ ] Run tenant isolation test script and verify it passes
- [ ] Add tenant assertions to all API routes that access tenant-scoped data
- [ ] Verify `getPrimaryTenant()` is used consistently

---

## PHASE 3: BILLING REALITY 🔄 PENDING

### Status:
- ✅ Stripe webhook handler exists and uses Node runtime
- ✅ Webhook has raw body verification and idempotency
- ✅ Entitlements check exists (`checkEntitlement()`)
- ⚠️ **BLOCKER:** Entitlements may fail open (returns `allowed: true` on error)
- ⚠️ **BLOCKER:** Need to verify webhook actually updates subscription status in DB

### Actions Needed:
- [ ] Fix entitlements to fail closed (or at least log clearly when failing open)
- [ ] Add webhook verification test (use Stripe CLI or test webhook)
- [ ] Verify `withUniversalBillingGate()` is used on all paid routes
- [ ] Test that free user cannot access paid endpoint even with spoofed client state

---

## PHASE 4: AUTO-RECONCILIATION 10% PIPELINE 🔄 PENDING

### Status:
- ✅ Reconciliation service exists (`lib/server/settler/reconciliation.ts`)
- ✅ Data model exists (normalized_transactions, reconciliation_runs, reconciliation_matches)
- ⚠️ **BLOCKER:** Matching logic is not implemented (returns placeholder summary)
- ⚠️ **BLOCKER:** No fixture dataset for testing
- ⚠️ **BLOCKER:** No automatic trigger after CSV upload

### Actions Needed:
- [ ] Implement deterministic matching logic:
  - Amount tolerance: ±$0.01
  - Date window: ±3 days
  - Merchant similarity: exact match (no AI)
- [ ] Create fixture dataset (`/fixtures/reconciliation-test-data.csv`)
- [ ] Create one-command seed script
- [ ] Wire up auto-trigger after CSV ingestion completes
- [ ] Verify end-to-end: upload CSV → see matches in UI

---

## PHASE 5: INTEGRATIONS 🔄 PENDING

### Status:
- ⚠️ **BLOCKER:** Need to audit all "Connect X" buttons
- ⚠️ **BLOCKER:** Some integrations may be fake/placeholder

### Actions Needed:
- [ ] Find all integration connection buttons/routes
- [ ] Mark fake integrations as "Coming Soon" or remove
- [ ] Ensure real integrations have proper OAuth callbacks
- [ ] Verify integration tokens are stored securely (encrypted)

---

## PHASE 6: MIDDLEWARE/RUNTIME CORRECTNESS 🔄 PENDING

### Status:
- ✅ Stripe webhook uses `runtime = 'nodejs'`
- ⚠️ **BLOCKER:** Need to verify all routes have correct runtime
- ⚠️ **BLOCKER:** Need to check for unused imports

### Actions Needed:
- [ ] Audit all API routes for correct runtime declaration
- [ ] Run `npm run lint` and fix unused imports
- [ ] Run `npm run typecheck` and fix type errors
- [ ] Run `npm run build` and verify it succeeds

---

## PHASE 7: OBSERVABILITY 🔄 PENDING

### Status:
- ✅ Trace IDs exist (`x-trace-id` header)
- ✅ Structured logging exists (`logger.ts`)
- ✅ Error boundaries exist (`error.tsx`, `global-error.tsx`)
- ⚠️ **BLOCKER:** No diagnostics page

### Actions Needed:
- [ ] Create `/admin/diagnostics` or `/console/diagnostics` page (gated)
- [ ] Show: env sanity, webhook last received, last reconcile run, queue health

---

## PHASE 8: QA TEST SUITE 🔄 PENDING

### Status:
- ⚠️ **BLOCKER:** No unit tests for matcher rules
- ⚠️ **BLOCKER:** No integration test for entitlement gating
- ⚠️ **BLOCKER:** No smoke test for auth + protected routes

### Actions Needed:
- [ ] Create unit test for deterministic matcher
- [ ] Create integration test for entitlement gating
- [ ] Create smoke test for auth flow
- [ ] Optional: Playwright smoke test

---

## VERIFICATION CHECKLIST

- [x] Fixed all 500 errors (except intentional Stripe webhook retries)
- [ ] `npm run lint` clean
- [ ] `npm run typecheck` clean
- [ ] `npm run build` succeeds
- [ ] No unused imports
- [ ] Tenant isolation proven (run test script)
- [ ] Billing gates enforced server-side
- [ ] Auto-reconciliation works with fixtures
- [ ] Stripe webhook verified
- [ ] All integrations are real or explicitly marked

---

## NEXT STEPS (Priority Order)

1. **Complete Phase 2:** Run tenant isolation test, add tenant assertions to routes
2. **Complete Phase 3:** Fix entitlements fail-open, verify billing gates
3. **Complete Phase 4:** Implement 10% reconciliation pipeline with fixtures
4. **Complete Phase 6:** Fix lint/typecheck/build issues
5. **Complete Phase 5:** Audit integrations
6. **Complete Phase 7:** Add diagnostics page
7. **Complete Phase 8:** Create test suite
