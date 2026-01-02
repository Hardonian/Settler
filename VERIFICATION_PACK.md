# SETTLER REALITY MODE - VERIFICATION PACK

**Generated:** 2025-01-22  
**Purpose:** Commands and expected outputs to verify all fixes

---

## PRE-FLIGHT CHECKS

### 1. Lint Check
```bash
cd /workspace
npm run lint
```
**Expected:** No errors, only warnings (if any)

### 2. Type Check
```bash
npm run typecheck
```
**Expected:** No type errors

### 3. Build Check
```bash
npm run build
```
**Expected:** Build succeeds without errors

---

## PHASE 1 VERIFICATION: NO 500 ERRORS

### Test: Hit protected route without auth
```bash
curl -X POST http://localhost:3000/api/console/reconciliation \
  -H "Content-Type: application/json" \
  -d '{"sourceId": "test"}'
```
**Expected:** Returns 401 or 403, NOT 500

### Test: Hit route with invalid data
```bash
curl -X POST http://localhost:3000/api/stripe/checkout \
  -H "Content-Type: application/json" \
  -d '{"planCode": "invalid"}'
```
**Expected:** Returns 400 or 200 with error message, NOT 500

---

## PHASE 2 VERIFICATION: TENANT ISOLATION

### Run Tenant Isolation Test
```bash
cd /workspace
npx tsx scripts/validate-tenant-isolation.ts
```
**Expected Output:**
```
🔒 Testing Tenant Isolation...

Test 1: Verifying RLS is enabled...
✅ RLS enabled on billing_accounts
✅ RLS enabled on subscriptions
✅ RLS enabled on normalized_transactions
...

Test 2: Creating test users...
✅ Create test users and tenants

Test 3: Creating data for tenant 1...
✅ Create data for tenant 1

Test 4: User 1 accessing their own data...
✅ User 1 can access their own data

Test 5: User 2 attempting to access tenant 1 data (should be blocked)...
✅ User 2 CANNOT access tenant 1 data (RLS blocks)

============================================================
TENANT ISOLATION TEST RESULTS
============================================================
✅ ALL TESTS PASSED - Tenant isolation is working correctly
```

---

## PHASE 3 VERIFICATION: BILLING GATES

### Test: Free user accessing paid endpoint
```bash
# 1. Create free user (no subscription)
# 2. Try to access paid endpoint
curl -X POST http://localhost:3000/api/console/reconciliation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <free_user_token>" \
  -d '{"sourceId": "test"}'
```
**Expected:** Returns 403 with `SUBSCRIPTION_REQUIRED` error

### Test: Stripe Webhook Processing
```bash
# Use Stripe CLI to send test webhook
stripe listen --forward-to http://localhost:3000/api/stripe/webhook

# In another terminal, trigger test event
stripe trigger checkout.session.completed
```
**Expected:** 
- Webhook received and processed
- Subscription created/updated in database
- Check `subscriptions` table: `status = 'active'`

### Verify Webhook Updates DB
```sql
-- After webhook event, check subscription status
SELECT id, billing_account_id, plan_id, status, stripe_subscription_id
FROM subscriptions
WHERE billing_account_id = '<test_billing_account_id>'
ORDER BY created_at DESC
LIMIT 1;
```
**Expected:** `status = 'active'` and `stripe_subscription_id` is set

---

## PHASE 4 VERIFICATION: AUTO-RECONCILIATION 10%

### Test: CSV Upload → Auto-Reconciliation
```bash
# 1. Upload CSV via API
curl -X POST http://localhost:3000/api/console/ingestion \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "type": "csv",
    "data": "date,amount,description\n2025-01-01,100.00,Test Transaction"
  }'

# 2. Check reconciliation run was created
curl -X GET http://localhost:3000/api/console/reconciliation?id=<run_id> \
  -H "Authorization: Bearer <token>"
```
**Expected:**
- Ingestion completes successfully
- Reconciliation run created automatically
- Run status = 'completed'
- Matches found (if test data has matches)

### Test: Deterministic Matching
```bash
# Use fixture dataset
npx tsx scripts/seed-reconciliation-fixtures.ts

# Run reconciliation
curl -X POST http://localhost:3000/api/console/reconciliation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "sourceId": "fixture-source-1"
  }'
```
**Expected:**
- Matches created with `match_type = 'exact'`
- Amount tolerance: ±$0.01
- Date window: ±3 days
- No AI required (deterministic)

---

## PHASE 6 VERIFICATION: RUNTIME CORRECTNESS

### Check Stripe Webhook Runtime
```bash
grep -r "export const runtime" packages/web/src/app/api/stripe/webhook/
```
**Expected:** `export const runtime = 'nodejs';`

### Check for Unused Imports
```bash
npm run lint 2>&1 | grep "unused"
```
**Expected:** No unused import errors

---

## PHASE 7 VERIFICATION: OBSERVABILITY

### Test: Diagnostics Page
```bash
# Access diagnostics page (must be authenticated + admin)
curl http://localhost:3000/console/diagnostics \
  -H "Authorization: Bearer <admin_token>"
```
**Expected:** JSON response with:
- `env_sanity: { supabase: 'ok', stripe: 'ok', ... }`
- `last_webhook_received: <timestamp>`
- `last_reconcile_run: <timestamp>`
- `queue_health: 'healthy'`

### Test: Trace IDs
```bash
curl http://localhost:3000/api/health \
  -v 2>&1 | grep "x-trace-id"
```
**Expected:** Response header `x-trace-id: <uuid>`

---

## PHASE 8 VERIFICATION: QA TEST SUITE

### Run Unit Tests
```bash
npm run test
```
**Expected:** All tests pass

### Run Integration Tests
```bash
npm run test:integration
```
**Expected:** Entitlement gating test passes

### Run Smoke Tests
```bash
npm run test:smoke
```
**Expected:** Auth flow test passes

---

## SUMMARY CHECKLIST

- [ ] `npm run lint` clean
- [ ] `npm run typecheck` clean  
- [ ] `npm run build` succeeds
- [ ] No 500 errors on user routes
- [ ] Tenant isolation test passes
- [ ] Billing gates block free users
- [ ] Stripe webhook updates DB
- [ ] Auto-reconciliation works with fixtures
- [ ] Diagnostics page accessible
- [ ] Trace IDs present in responses
- [ ] Test suite passes

---

## MANUAL TESTING SCENARIOS

### Scenario 1: Signup → Onboarding → Connect Integration
1. Sign up new user
2. Complete onboarding steps
3. Connect CSV integration
4. Upload test CSV
5. **Verify:** Data ingested, reconciliation triggered automatically

### Scenario 2: Upgrade → Access Paid Feature
1. Free user tries to access paid feature
2. **Verify:** Blocked with upgrade prompt
3. User upgrades via Stripe checkout
4. Webhook processes subscription
5. User accesses paid feature
6. **Verify:** Feature accessible, usage tracked

### Scenario 3: Cross-Tenant Access Attempt
1. User A creates data in tenant A
2. User B (tenant B) tries to access User A's data
3. **Verify:** RLS blocks access, returns empty result

---

## PRODUCTION READINESS CHECKLIST

- [ ] All verification tests pass
- [ ] No hard 500s in production logs
- [ ] Tenant isolation proven in production
- [ ] Billing gates enforced in production
- [ ] Webhook processing verified in production
- [ ] Reconciliation pipeline tested with real data
- [ ] Diagnostics page accessible to admins
- [ ] Monitoring/alerts configured
