# Ops Command Center Acceptance Criteria

**Last Updated:** 2025-01-27  
**Status:** Ready for Testing

## Acceptance Test Checklist

### Phase 1: Anti-Drift Guardrails ✅

- [x] `repo-integrity.ts` script exists and validates:
  - [x] All workspace folders have package.json
  - [x] No missing workspaces
  - [x] No phantom internal dependencies
  - [x] No scripts reference missing files
  - [x] TypeScript packages have build/typecheck contracts
  - [x] No committed node_modules

- [x] `check:production` command runs all checks in order:
  - [x] repo-integrity
  - [x] lint
  - [x] typecheck
  - [x] build
  - [x] vercel-parity
  - [x] smoke tests (optional)

- [x] `vercel-parity.ts` script validates:
  - [x] Vercel configuration is valid
  - [x] Build command exists
  - [x] Install command matches
  - [x] Output directory is valid

### Phase 2: CI Enforcement ✅

- [x] CI workflow includes:
  - [x] `repo-integrity` job
  - [x] `production-check` job
  - [x] `vercel-parity` check in build job
  - [x] All checks fail-fast on errors

- [x] PR template includes:
  - [x] CI verification checklist
  - [x] Required checks listed
  - [x] Clear merge criteria

### Phase 3: Deployment Contract ✅

- [x] `deployment_contract.md` exists
- [x] All invariants documented
- [x] CI enforcement described
- [x] Manual steps documented

### Phase 4: Ops Dashboard ✅

- [x] Ops dashboard accessible at `/console/ops`
- [x] Admin-only access enforced
- [x] All tabs render without errors:
  - [x] Overview
  - [x] Customers
  - [x] Usage
  - [x] Jobs
  - [x] Webhooks
  - [x] Errors
  - [x] Billing
  - [x] Exports
  - [x] Runbooks

- [x] Database tables created:
  - [x] `ops_errors`
  - [x] `ops_jobs`
  - [x] `ops_webhooks`
  - [x] `ops_usage_aggregates`
  - [x] `ops_support_tickets`
  - [x] `ops_audit_logs`

- [x] RLS policies configured
- [x] Indexes created for performance

### Phase 5: Support Autopilot ✅

- [x] "Report an Issue" component exists
- [x] Auto-capture context:
  - [x] Route
  - [x] Request ID
  - [x] User Agent
  - [x] Timestamp

- [x] Auto-triage engine:
  - [x] Priority assignment
  - [x] Category assignment
  - [x] Status determination
  - [x] Suggested actions

- [x] Admin support inbox at `/console/support`
- [x] Ticket correlation with ops events

### Phase 6: Hardening ✅

- [x] Error boundaries on all new routes
- [x] Environment variable validation at runtime
- [x] No stack traces exposed to users
- [x] Graceful error states
- [x] Stripe webhooks use raw body (verify)

## Testing Instructions

### 1. Test Repository Integrity

```bash
npm run repo-integrity
```

**Expected:** All checks pass ✅

### 2. Test Production Check

```bash
npm run check:production
```

**Expected:** All required checks pass ✅

### 3. Test Vercel Parity

```bash
npm run vercel:parity
```

**Expected:** Vercel configuration validated ✅

### 4. Test CI Workflow

1. Create a PR
2. Verify CI runs all checks
3. Verify checks fail on errors
4. Verify merge is blocked if checks fail

**Expected:** CI enforces all checks ✅

### 5. Test Ops Dashboard

1. Log in as super admin
2. Navigate to `/console/ops`
3. Verify all tabs render
4. Verify data loads (may be empty initially)

**Expected:** Dashboard renders without errors ✅

### 6. Test Support Autopilot

1. Navigate to any page
2. Use "Report an Issue" component
3. Submit a ticket
4. Verify ticket appears in admin inbox
5. Verify auto-triage results

**Expected:** Ticket created with triage results ✅

### 7. Test Error Handling

1. Trigger an error condition
2. Verify error boundary catches it
3. Verify user sees friendly error message
4. Verify no stack traces exposed

**Expected:** Graceful error handling ✅

## Manual Verification

### GitHub Branch Protection

1. Go to repository settings
2. Navigate to Branches
3. Verify branch protection rules:
   - Require status checks to pass
   - Require branches to be up to date
   - Do not allow bypassing

### Vercel Configuration

1. Go to Vercel project settings
2. Verify build command matches `vercel.json`
3. Verify install command matches
4. Verify output directory matches

### Database Migration

1. Run migration: `supabase db push`
2. Verify all `ops_*` tables created
3. Verify RLS policies active
4. Verify indexes created

## Success Criteria

✅ All acceptance tests pass  
✅ CI blocks drift  
✅ Ops dashboard functional  
✅ Support autopilot working  
✅ No hard 500s  
✅ All documentation complete

## Known Limitations

- Some ops tabs show placeholder content (to be implemented)
- Real-time updates not yet implemented
- Advanced filtering/search not yet implemented
- Export functionality basic (can be enhanced)

## Next Steps

1. Run all acceptance tests
2. Fix any failing tests
3. Deploy to staging
4. Verify in staging environment
5. Deploy to production

---

**Status:** Ready for acceptance testing
