# Reality System - Next Steps Checklist

This checklist ensures all next steps are completed for full Reality System deployment.

## ✅ Phase 0-4: Foundation (COMPLETED)

- [x] Canonical data layer migration created
- [x] Reality Dashboard (internal ops) built
- [x] Weekly reality loop function implemented
- [x] Board/Investor dashboard built
- [x] Public trust page updated
- [x] Documentation created

## 🔄 Deployment Steps

### Step 1: Apply Database Migration

- [ ] **Apply migration file**
  - File: `supabase/migrations/20260203000000_reality_system_canonical_data.sql`
  - Method: Supabase Dashboard SQL Editor OR `supabase db push`
  - Verify: Check tables exist (`reality_metrics`, `reality_events`, `weekly_snapshots`)

- [ ] **Apply cron jobs migration** (optional)
  - File: `supabase/migrations/20260203000001_reality_system_cron_jobs.sql`
  - Method: Supabase Dashboard SQL Editor
  - Verify: Check `cron.job` table for scheduled jobs

### Step 2: Deploy Edge Functions

- [ ] **Deploy `collect-reality-metrics` function**
  - File: `supabase/functions/collect-reality-metrics/index.ts`
  - Method: Supabase Dashboard → Edge Functions OR `supabase functions deploy collect-reality-metrics`
  - Verify: Function appears in dashboard and can be invoked

- [ ] **Deploy `weekly-reality-loop` function**
  - File: `supabase/functions/weekly-reality-loop/index.ts`
  - Method: Supabase Dashboard → Edge Functions OR `supabase functions deploy weekly-reality-loop`
  - Verify: Function appears in dashboard and can be invoked

### Step 3: Schedule Automated Jobs

Choose ONE of the following:

- [ ] **Option A: Supabase pg_cron** (if available)
  - Execute: `supabase/migrations/20260203000001_reality_system_cron_jobs.sql`
  - Verify: `SELECT * FROM cron.job WHERE jobname IN ('collect-reality-metrics', 'weekly-reality-loop');`

- [ ] **Option B: GitHub Actions**
  - File: `.github/workflows/reality-system.yml` (already created)
  - Add secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
  - Verify: Workflow runs on schedule

- [ ] **Option C: External Cron Service**
  - Set up hourly call to `collect-reality-metrics`
  - Set up weekly (Monday 9 AM UTC) call to `weekly-reality-loop`
  - Verify: Functions are being called

### Step 4: Collect Initial Metrics

- [ ] **Trigger initial metric collection**
  ```bash
  curl -X POST "https://your-project.supabase.co/functions/v1/collect-reality-metrics" \
    -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d '{}'
  ```

- [ ] **Verify metrics populated**
  ```sql
  SELECT category, name, value, status FROM reality_metrics ORDER BY category, name;
  ```

### Step 5: Verify Dashboards

- [ ] **Internal Dashboard** (`/console/reality`)
  - Access as admin user
  - Verify all 7 sections display
  - Check metrics show PROVEN/ASSUMED/BROKEN badges

- [ ] **Investor Dashboard** (`/investor/reality`)
  - Access with privileged credentials
  - Verify KPIs display correctly
  - Check Risk Index and Evidence Index

- [ ] **Public Trust Page** (`/trust`)
  - Access publicly (no auth)
  - Verify reads from reality_metrics
  - Check status badges display

## 🔬 Validation Phases

### Phase 5: Money Reality

- [ ] **Run validation**
  ```bash
  npx tsx scripts/validate-reality-phases.ts 5
  ```

- [ ] **Review evidence**
  - File: `docs/reality-system/evidence/phase-5-evidence.json`
  - File: `docs/reality-system/evidence/phase-5-evidence.md`

- [ ] **Verify billing lifecycle**
  - [ ] Successful payment flow works
  - [ ] Failed payment handled gracefully
  - [ ] Entitlements update immediately
  - [ ] Access gates correctly

- [ ] **Generate deliverable**
  - Create: `billing_evidence.md`

### Phase 6: User Reality

- [ ] **Run validation**
  ```bash
  npx tsx scripts/validate-reality-phases.ts 6
  ```

- [ ] **Review evidence**
  - File: `docs/reality-system/evidence/phase-6-evidence.json`

- [ ] **Verify onboarding**
  - [ ] Zero-touch onboarding works
  - [ ] First output < 3 minutes
  - [ ] Resume after exit works
  - [ ] Time-to-value tracked

- [ ] **Generate deliverable**
  - Create: `onboarding_success_path.md`

### Phase 7: Tenant Isolation

- [ ] **Run validation**
  ```bash
  npx tsx scripts/validate-reality-phases.ts 7
  ```

- [ ] **Review evidence**
  - File: `docs/reality-system/evidence/phase-7-evidence.json`

- [ ] **Execute attack tests**
  - [ ] Cross-tenant access attempt (should fail)
  - [ ] JWT replay attempt (should fail)
  - [ ] Role escalation attempt (should fail)
  - [ ] All violations logged

- [ ] **Generate deliverable**
  - Create: `tenant_isolation_report.md`

### Phase 8: Failure Injection

- [ ] **Run validation**
  ```bash
  npx tsx scripts/validate-reality-phases.ts 8
  ```

- [ ] **Execute failure tests**
  - [ ] Break Supabase connection (verify degraded mode)
  - [ ] Break env vars (verify SAFE_MODE)
  - [ ] Break Stripe webhooks (verify graceful handling)
  - [ ] Verify no hard 500s

- [ ] **Generate deliverable**
  - Create: `failure_injection_results.md`

### Phase 9: Deployment Reality

- [ ] **Run validation**
  ```bash
  npx tsx scripts/validate-reality-phases.ts 9
  ```

- [ ] **Deploy to non-primary platform**
  - [ ] Choose platform (Vercel, Railway, etc.)
  - [ ] Deploy and verify
  - [ ] Test build reproducibility
  - [ ] Test env portability

- [ ] **Generate deliverable**
  - Create: `deploy_matrix.md`

### Phase 10: Admin Self-Sufficiency

- [ ] **Run validation**
  ```bash
  npx tsx scripts/validate-reality-phases.ts 10
  ```

- [ ] **Verify admin capabilities**
  - [ ] Manage tenants/users/roles via UI
  - [ ] Edit content via UI
  - [ ] Manage billing visibility via UI
  - [ ] Revoke access via UI
  - [ ] View audit logs via UI

- [ ] **Generate deliverable**
  - Create: `admin_capabilities.md`

### Phase 11: Economic Reality

- [ ] **Run validation**
  ```bash
  npx tsx scripts/validate-reality-phases.ts 11
  ```

- [ ] **Calculate unit economics**
  - [ ] Cost per tenant
  - [ ] Cost per action
  - [ ] Burn vs revenue
  - [ ] Unit economics model

- [ ] **Generate deliverable**
  - Create: `unit_economics.md`

### Phase 12: Legal & Risk Reality

- [ ] **Run validation**
  ```bash
  npx tsx scripts/validate-reality-phases.ts 12
  ```

- [ ] **Verify compliance actions**
  - [ ] Data deletion works
  - [ ] Data export works
  - [ ] Access revocation works
  - [ ] All actions logged

- [ ] **Generate deliverable**
  - Create: `compliance_gap_report.md`

### Phase 13: GTM Reality

- [ ] **Run validation**
  ```bash
  npx tsx scripts/validate-reality-phases.ts 13
  ```

- [ ] **Verify conversion flow**
  - [ ] Pricing CTA fires
  - [ ] Leads captured
  - [ ] Attribution works
  - [ ] Conversion tracking

- [ ] **Generate deliverable**
  - Create: `gtm_conversion_flow.md`

### Phase 14: Competitive & Defensibility

- [ ] **Run validation**
  ```bash
  npx tsx scripts/validate-reality-phases.ts 14
  ```

- [ ] **Assess defensibility**
  - [ ] Switching costs analysis
  - [ ] Cloneability assessment
  - [ ] Proprietary surface identification
  - [ ] Defensibility score

- [ ] **Generate deliverable**
  - Create: `competitive_moat.md`

### Phase 15: Investor Hostile Review

- [ ] **Run validation**
  ```bash
  npx tsx scripts/validate-reality-phases.ts 15
  ```

- [ ] **Conduct hostile review**
  - [ ] Attempt to invalidate market
  - [ ] Attempt to invalidate revenue
  - [ ] Attempt to invalidate scalability
  - [ ] Attempt to invalidate defensibility
  - [ ] Score readiness 1-10

- [ ] **Generate deliverable**
  - Create: `diligence_failures.md`

### Run All Phases

- [ ] **Run all validation phases**
  ```bash
  npx tsx scripts/validate-reality-phases.ts all
  ```

- [ ] **Review summary**
  - File: `docs/reality-system/evidence/validation-summary.json`

## 📊 Ongoing Operations

### Weekly

- [ ] **Review weekly snapshot**
  - Check: `weekly_snapshots` table
  - Review: Risks and required actions
  - Action: Address critical risks

- [ ] **Review metrics status**
  - Check: PROVEN vs ASSUMED ratio
  - Goal: Increase PROVEN percentage
  - Action: Complete validation phases for ASSUMED metrics

### Monthly

- [ ] **Review Reality Report**
  - File: `REALITY_REPORT.md`
  - Update: Status of all phases
  - Action: Plan next month's validation work

- [ ] **Review evidence documents**
  - Location: `docs/reality-system/evidence/`
  - Verify: All phases have evidence
  - Action: Complete missing phases

## 🎯 Success Criteria

- [ ] All migrations applied
- [ ] All functions deployed
- [ ] Automated jobs running
- [ ] Initial metrics collected
- [ ] All dashboards accessible
- [ ] All validation phases completed
- [ ] All evidence documents generated
- [ ] 80%+ metrics PROVEN
- [ ] Zero BROKEN metrics
- [ ] Weekly snapshots generating
- [ ] Investor readiness score ≥ 7/10

## 📝 Quick Commands Reference

```bash
# Setup everything
./scripts/setup-reality-system.sh

# Collect metrics manually
curl -X POST "${SUPABASE_URL}/functions/v1/collect-reality-metrics" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"

# Run weekly loop manually
curl -X POST "${SUPABASE_URL}/functions/v1/weekly-reality-loop" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"

# Run single validation phase
npx tsx scripts/validate-reality-phases.ts 5

# Run all validation phases
npx tsx scripts/validate-reality-phases.ts all

# Check metrics status
psql $DATABASE_URL -c "SELECT category, COUNT(*) FILTER (WHERE status='proven') as proven, COUNT(*) FILTER (WHERE status='assumed') as assumed FROM reality_metrics GROUP BY category;"
```

## 📚 Documentation

- Full README: `/docs/reality-system/README.md`
- Deployment Guide: `/docs/reality-system/DEPLOYMENT.md`
- Quick Start: `/docs/reality-system/QUICK_START.md`
- Main Report: `/REALITY_REPORT.md`

---

**Last Updated:** 2026-02-03  
**Status:** Foundation Complete | Validation In Progress
