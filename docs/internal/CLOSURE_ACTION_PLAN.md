# Settler Closure Action Plan

**Version:** 1.0  
**Date:** 2025-01-XX  
**Status:** READY FOR EXECUTION  
**Purpose:** Prioritized action plan to complete Settler closure

---

## Priority 1: Critical Fixes (Week 1)

### 1.1 Fix 500 Errors in Core Routes
**Files:**
- `packages/api/src/routes/v1/ingestion.ts`
- `packages/api/src/routes/v1/reconciliation.ts`
- `packages/api/src/routes/v1/recon/jobs.ts`

**Action:**
- Review error handling in each route
- Replace generic 500 errors with specific error codes (400, 403, 404, 429)
- Add error context (explain WHY, not just WHAT)
- Add traceId to all errors

**Success Criteria:**
- No 500 errors in core routes
- All errors explain WHY
- All errors include traceId

---

### 1.2 Add Missing Authentication/Authorization
**Files:**
- All route files in `packages/api/src/routes/`

**Action:**
- Verify all routes have `authMiddleware` or `apiKeyMiddleware`
- Verify all routes have `tenantMiddleware` where tenant context is required
- Add missing middleware

**Success Criteria:**
- All routes require authentication
- All routes enforce tenant isolation
- No unauthenticated access possible

---

### 1.3 Improve Error Messages
**Files:**
- All route files, error handlers

**Action:**
- Update all error messages to explain WHY
- Include context (current usage, limits, upgrade path)
- Add traceId to all errors

**Success Criteria:**
- All errors explain WHY
- All errors include helpful context
- All errors include traceId

---

## Priority 2: Missing Routes (Week 2)

### 2.1 Create Exception Resolution Endpoints
**Route:** `PUT /api/v1/reconciliation/exceptions/:exceptionId`

**Action:**
- Create route file: `packages/api/src/routes/v1/exceptions.ts`
- Add exception resolution logic
- Add audit trail entry creation
- Add authentication/authorization

**Success Criteria:**
- Exception resolution endpoint exists
- Exceptions can be resolved via API
- Audit trail entries created

---

### 2.2 Create Audit Trail Export Endpoint
**Route:** `GET /api/v1/audit-trail/export`

**Action:**
- Add export endpoint to `packages/api/src/routes/v1/audit-trail.ts`
- Add CSV/JSON export logic
- Add plan limit checks (log retention)
- Add authentication/authorization

**Success Criteria:**
- Audit trail export endpoint exists
- Exports work for all plans
- Plan limits enforced

---

## Priority 3: Feature Gates (Week 3)

### 3.1 Add Feature Gates to Premium Routes
**Routes:**
- `/api/v1/receipt-matching/*`
- `/api/v1/advanced-matching-rules/*`
- `/api/v1/bulk-operations/*`

**Action:**
- Add `featureGate` middleware to each route
- Verify plan requirements (Growth+)
- Add error messages explaining upgrade path

**Success Criteria:**
- Premium features gated at API level
- Error messages explain upgrade path
- No frontend-only gating

---

### 3.2 Add Feature Gates to Enterprise Routes
**Routes:**
- `/api/v1/custom-integrations/*`
- `/api/v1/dedicated-infrastructure/*`
- `/api/v1/sla/*`

**Action:**
- Add `featureGate` middleware to each route
- Add enterprise plan check
- Add error messages explaining enterprise requirement

**Success Criteria:**
- Enterprise features gated at API level
- Error messages explain enterprise requirement
- No frontend-only gating

---

## Priority 4: Pricing Enforcement (Week 4)

### 4.1 Verify Adapter Limit Enforcement
**Action:**
- Check if adapter count is enforced
- Add enforcement if missing
- Add error messages explaining limit

**Success Criteria:**
- Adapter limits enforced at API level
- Error messages explain limit
- Upgrade path clear

---

### 4.2 Verify Log Retention Enforcement
**Action:**
- Check if log retention is enforced
- Add enforcement if missing
- Add error messages explaining retention period

**Success Criteria:**
- Log retention enforced
- Old logs deleted per plan
- Error messages explain retention

---

### 4.3 Update Pricing Page
**File:** `packages/web/src/app/pricing/page.tsx`

**Action:**
- Remove "real-time" claims
- Remove "100% accurate" claims
- Remove "zero downtime" claims
- Remove "AI-powered reconciliation" claims
- Update SOC 2 language (planned, not certified)

**Success Criteria:**
- Pricing page matches backend reality
- No unprovable claims
- All claims demonstrable

---

## Priority 5: RLS Verification (Week 5)

### 5.1 Verify RLS on All Database Queries
**Action:**
- Audit all database queries
- Verify tenant_id filter on all queries
- Fix any queries missing tenant_id filter

**Success Criteria:**
- All queries enforce tenant isolation
- No cross-tenant access possible
- RLS policies verified

---

## Priority 6: Remove Dead Routes (Week 6)

### 6.1 Remove Routes Without Backend Support
**Routes to Verify:**
- `/api/v2/compliance/*`
- `/api/v2/knowledge/*`
- `/api/v2/ai-agents/*`
- `/api/v2/network-effects/*`

**Action:**
- Verify if routes are production-ready
- Remove routes if not production-ready
- Remove UI references to removed routes

**Success Criteria:**
- No routes without backend support
- No UI references to removed routes
- All routes have valid purpose

---

### 6.2 Remove Console Pages Without Backend Support
**Pages to Verify:**
- `/console/ai-analysis`
- `/console/advanced-matching-rules`
- `/console/custom-integrations`
- `/console/dedicated-infrastructure`

**Action:**
- Verify if pages have backend support
- Remove pages if not production-ready
- Redirect to functional alternatives

**Success Criteria:**
- No console pages without backend support
- All pages have valid purpose
- Redirects work correctly

---

## Priority 7: GTM Narrative (Week 7)

### 7.1 Create Unified Narrative
**Deliverables:**
- 30-second explanation
- 3-minute explanation
- 1-page narrative memo
- Explicit "who this is NOT for"

**Action:**
- Create narrative document
- Align sales, marketing, investors
- Update all external-facing materials

**Success Criteria:**
- Unified narrative exists
- All audiences use same truth
- No conflicting claims

---

## Priority 8: Final Verification (Week 8)

### 8.1 Run Final Verification Checklist
**Checklist:**
- [ ] Product matches canon
- [ ] Demo works in production
- [ ] Pricing gates cannot be bypassed
- [ ] RLS is airtight
- [ ] No over-promising UI remains
- [ ] Settler can be sold without explanation

**Action:**
- Run through checklist
- Fix any gaps
- Document verification results

**Success Criteria:**
- All checklist items pass
- No gaps identified
- Verification documented

---

## Success Metrics

### Week 1-2: Critical Fixes
- **Metric:** Zero 500 errors in core routes
- **Target:** 100% of core routes return appropriate error codes
- **Measurement:** Automated tests, error monitoring

### Week 3-4: Feature Gates & Pricing
- **Metric:** All premium/enterprise features gated
- **Target:** 100% of premium/enterprise routes have featureGate middleware
- **Measurement:** Code review, automated tests

### Week 5-6: RLS & Dead Routes
- **Metric:** Zero cross-tenant access possible
- **Target:** 100% of database queries enforce tenant isolation
- **Measurement:** Automated tests, security audit

### Week 7-8: GTM & Verification
- **Metric:** Unified narrative exists
- **Target:** All external materials aligned
- **Measurement:** Document review, stakeholder sign-off

---

## Risk Mitigation

### Risk 1: Breaking Changes
- **Mitigation:** Test all changes in staging before production
- **Rollback Plan:** Keep previous version available

### Risk 2: Missing Dependencies
- **Mitigation:** Verify all dependencies exist before implementing
- **Contingency:** Create missing dependencies if needed

### Risk 3: Timeline Slippage
- **Mitigation:** Prioritize critical fixes first
- **Contingency:** Extend timeline if needed, but don't compromise quality

---

## Next Steps

1. **Start Week 1:** Fix 500 errors, add authentication, improve error messages
2. **Week 2:** Create missing routes (exception resolution, audit trail export)
3. **Week 3-4:** Add feature gates, verify pricing enforcement
4. **Week 5-6:** Verify RLS, remove dead routes
5. **Week 7-8:** Create GTM narrative, run final verification

---

**This document is READY FOR EXECUTION. Follow priorities, track progress, verify success.**
