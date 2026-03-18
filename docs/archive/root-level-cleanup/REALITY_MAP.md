# SETTLER REALITY MODE - REALITY MAP

**Generated:** 2025-01-22  
**Purpose:** End-to-end flow map showing UI → Server → DB → External → Logs

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS MIDDLEWARE                           │
│  - Auth cookie refresh (Supabase SSR)                           │
│  - Trace ID generation                                          │
│  - Security headers                                             │
│  - Stripe webhook bypass                                        │
│  - Public route detection                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APP ROUTER (Next.js)                         │
│  - /app routes (Server Components)                             │
│  - /app/api routes (Route Handlers)                            │
│  - Server Actions (/app/actions)                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              AUTHENTICATION LAYER                               │
│  - requireAuth() → Supabase auth.getUser()                      │
│  - getPrimaryTenant() → tenant_id from billing_accounts        │
│  - RLS policies enforce tenant isolation                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              BILLING GATE MIDDLEWARE                             │
│  - withUniversalBillingGate()                                  │
│  - requireActiveSubscription()                                  │
│  - checkEntitlement() → plan limits                             │
│  - Usage tracking via usage_events table                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              BUSINESS LOGIC LAYER                               │
│  - Reconciliation: runReconciliation()                          │
│  - Ingestion: CSV/API adapters                                 │
│  - Matching: deterministic rules                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (Supabase)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ RLS POLICIES (Tenant Isolation)                         │  │
│  │ - billing_accounts: user_id = auth.uid()                │  │
│  │ - subscriptions: via billing_account_id                  │  │
│  │ - normalized_transactions: tenant_id scoped              │  │
│  │ - reconciliation_runs: tenant_id scoped                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  TABLES:                                                       │
│  - billing_accounts (user_id, tenant_id, stripe_customer_id) │
│  - subscriptions (billing_account_id, plan_id, status)         │
│  - usage_events (billing_account_id, event_type, quantity)    │
│  - ingestion_sources (tenant_id, type, config_encrypted)      │
│  - normalized_transactions (tenant_id, amount, date)          │
│  - reconciliation_runs (tenant_id, status, started_at)        │
│  - reconciliation_matches (run_id, source_transaction_id)     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES                                   │
│  - Stripe: checkout, webhooks, customer portal                  │
│  - Supabase Edge Functions: scheduled jobs                    │
│  - OpenAI: (optional, gated) categorization                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              OBSERVABILITY                                      │
│  - Trace IDs (x-trace-id header)                              │
│  - Structured logging (logger.ts)                              │
│  - Error boundaries (error.tsx, global-error.tsx)             │
│  - Metrics (trackWebhookMetric, usage tracking)               │
└─────────────────────────────────────────────────────────────────┘
```

---

## CRITICAL FLOWS

### 1. SIGNUP → ONBOARDING → CONNECT INTEGRATIONS → INGEST DATA

```
User Action: Sign Up
  ↓
POST /api/auth/signup (or Supabase Auth)
  ↓
Create billing_account (user_id, status='active')
  ↓
Create tenant (slug, billing_account_id)
  ↓
OnboardingProgress.created (currentStep='welcome')
  ↓
User Action: Connect Integration (e.g., CSV upload)
  ↓
POST /api/console/ingestion
  - requireAuth() ✓
  - requireActiveSubscription() ✓ (or allowFree for CSV)
  ↓
Create ingestion_source (tenant_id, type='csv', config_encrypted)
  ↓
Create ingestion (source_id, status='pending')
  ↓
Process CSV → raw_records → normalized_transactions
  ↓
Auto-trigger reconciliation_run
  ↓
Display results in UI
```

### 2. AUTO-RECONCILIATION PIPELINE (10% SCOPE)

```
Trigger: CSV upload completes OR manual trigger
  ↓
POST /api/console/reconciliation
  - requireAuth() ✓
  - withUniversalBillingGate() ✓
  ↓
runReconciliation(tenantId, { sourceId, rules })
  ↓
Create reconciliation_run (tenant_id, status='running')
  ↓
Query normalized_transactions WHERE tenant_id = X
  ↓
Deterministic Matching:
  - Amount tolerance: ±$0.01
  - Date window: ±3 days
  - Merchant similarity: exact match (no AI)
  ↓
Create reconciliation_matches (run_id, source_transaction_id, match_type='exact')
  ↓
Update reconciliation_run (status='completed', matched_count, unmatched_count)
  ↓
Return summary to UI
```

### 3. BILLING: CHECKOUT → WEBHOOK → ENTITLEMENTS

```
User Action: Click "Upgrade" on /pricing
  ↓
POST /api/stripe/checkout
  - requireAuth() ✓
  - Create Stripe Checkout Session
  - metadata: { billingAccountId, userId, tenantId }
  ↓
User completes checkout on Stripe.com
  ↓
Stripe Webhook: POST /api/stripe/webhook
  - Bypasses auth (signature verification only)
  - Runtime: nodejs ✓
  - Raw body verification ✓
  ↓
Event: checkout.session.completed
  ↓
syncSubscriptionFromWebhook()
  - Create/update subscription (billing_account_id, plan_id='pro', status='active')
  ↓
Event: customer.subscription.updated
  ↓
Update subscription status in DB
  ↓
User accesses paid feature
  ↓
withUniversalBillingGate()
  ↓
requireActiveSubscription()
  - Query subscriptions WHERE billing_account_id = X AND status = 'active'
  - Return allowed: true ✓
  ↓
Feature accessible
```

### 4. TENANT ISOLATION ENFORCEMENT

```
User A (tenant_id: abc-123) queries /api/console/reconciliation
  ↓
requireAuth() → user_id: user-a
  ↓
getPrimaryTenant() → tenant_id: abc-123
  ↓
Query: SELECT * FROM reconciliation_runs WHERE tenant_id = 'abc-123'
  ↓
RLS Policy Check:
  - Policy: "Users can view reconciliation runs for their tenant"
  - USING: tenant_id IN (SELECT tenant_id FROM billing_accounts WHERE user_id = auth.uid())
  - Result: ✓ ALLOWED
  ↓
User B (tenant_id: xyz-789) tries to access same run
  ↓
RLS Policy Check:
  - tenant_id = 'abc-123' NOT IN (SELECT tenant_id FROM billing_accounts WHERE user_id = 'user-b')
  - Result: ✗ DENIED (empty result set)
```

---

## BLOCKERS IDENTIFIED

### PHASE 1: STOP THE BLEEDING (500 ERRORS) ✅ COMPLETE

- [x] Fixed billing enforcement 500 errors → now return 403
- [x] Fixed entitlement checks 500 errors → now return 403
- [x] Fixed auth gate 500 errors → now return 401/403
- [x] Fixed API logger middleware → catches errors gracefully
- [x] Created safe error handler utility
- [x] Error boundaries exist (error.tsx, global-error.tsx)
- [x] Not-found pages exist

### PHASE 2: AUTH + TENANT ISOLATION ✅ COMPLETE

- [x] RLS policies exist and are comprehensive
- [x] Created server-side tenant assertion helpers (tenant-assertion.ts)
- [x] Created tenant isolation test script (validate-tenant-isolation.ts)
- [x] Verified RLS coverage on all critical tables

### PHASE 3: BILLING REALITY ✅ COMPLETE

- [x] Stripe webhook handler verified (Node runtime, raw body, idempotency)
- [x] Fixed entitlements fail-open → now fails closed for paid plans
- [x] Verified syncSubscriptionFromWebhook() updates DB
- [ ] Need to run webhook verification test (Stripe CLI)

### PHASE 4: AUTO-RECONCILIATION

- [ ] Reconciliation service exists but may not be fully wired
- [ ] Need to verify matching logic is deterministic
- [ ] Need fixture dataset + one-command seed

### PHASE 5: INTEGRATIONS

- [ ] Need to audit all "Connect X" buttons
- [ ] Remove fake integrations or mark as "Coming Soon"

### PHASE 6: MIDDLEWARE/RUNTIME

- [ ] Stripe webhook uses nodejs runtime ✓
- [ ] Need to verify all routes have correct runtime
- [ ] Need to check for unused imports

### PHASE 7: OBSERVABILITY

- [x] Trace IDs exist ✓
- [x] Structured logging exists ✓
- [ ] Need diagnostics page

### PHASE 8: QA TEST SUITE

- [ ] Need unit tests for matcher
- [ ] Need integration test for entitlements
- [ ] Need smoke test for auth

### PHASE 9: GOVERNANCE & FREEZE ENFORCEMENT ✅ COMPLETE (2026-03-18)

- [x] Governance middleware (`enforceFreezeState`) implemented
- [x] Governance API routes (`/api/v1/governance/freeze`) implemented
- [x] Freeze state persistence (`tenant_governance` table)
- [x] Freeze state caching (30s TTL)
- [x] Audit logging for freeze/unfreeze events
- [x] 42+ high-risk routes protected by freeze enforcement
- [x] Frontend governance components (FreezeToggle, GovernanceBanner, FreezeBlockedButton)
- [x] Frontend governance hook (`useGovernanceState`)
- [x] Proactive freeze-aware UI on key operator surfaces
- [x] Consistent 423 Locked error responses
- [x] Carve-outs preserved (reads, governance, auth, health, webhooks, exports)

**Protected Operations:**

- Reconciliation runs and match modifications
- Data ingestion (sources, uploads, retries)
- Approval workflows (approve/reject)
- Bulk operations
- Job management (create, execute, delete)
- Exception resolution (single and bulk)
- Operator controls (kill-switches, backups, cost controls)
- Administrative operations (sagas, dead letter queue)
- Advanced matching rules (create, test)
- Edge AI node management and batch ingestion
- Custom integrations (create, update)
- Dedicated infrastructure (provision, deprovision)
- Tenant data deletion (GDPR)

**Documentation:**

- Implementation complete: `docs/CORE_OPERATOR_WORKFLOW_IMPLEMENTATION.md`
- Milestone summary: `docs/MILESTONE_COMPLETE_CORE_OPERATOR_WORKFLOW.md`
- Detailed specifications: `plans/core-operator-workflow-closure.md` (Part 1 & 2)
- Executive summary: `plans/IMPLEMENTATION_SUMMARY.md`

---

## VERIFICATION CHECKLIST

- [x] `pnpm typecheck` clean (API ✅ Web ✅)
- [ ] `pnpm lint` clean
- [ ] `pnpm build` succeeds
- [ ] No unused imports
- [ ] No hard 500s on user routes
- [x] Tenant isolation proven
- [x] Billing gates enforced server-side
- [x] **Governance freeze enforced on 42+ high-risk routes**
- [x] **Freeze-aware UI on mutation surfaces**
- [ ] Auto-reconciliation works with fixtures
- [ ] Stripe webhook verified
- [ ] All integrations are real or explicitly marked
