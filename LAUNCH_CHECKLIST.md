# 🚀 LAUNCH CHECKLIST

## Pre-Launch (45 minutes)

- [ ] **Apply RLS Migration** (5 min)
  ```bash
  export DATABASE_URL="postgresql://..."
  psql $DATABASE_URL -f supabase/migrations/20250122000000_rls_enforcement_critical.sql
  npx tsx scripts/verify-rls-status.ts
  ```

- [ ] **Update Stripe Products** (5 min)
  ```bash
  export STRIPE_SECRET_KEY="sk_live_..."
  npx tsx scripts/update-stripe-products.ts
  ```

- [ ] **Run Smoke Tests** (5 min)
  ```bash
  export NEXT_PUBLIC_APP_URL="https://your-app.com"
  npx tsx scripts/smoke-test.ts
  ```

- [ ] **Manual Testing** (30 min)
  - [ ] Signup flow works
  - [ ] Billing setup works
  - [ ] Reconciliation works
  - [ ] Usage tracking works
  - [ ] Tenant isolation works

## Post-Launch Monitoring

- [ ] Monitor usage_events table
- [ ] Monitor billing enforcement
- [ ] Monitor RLS policies
- [ ] Monitor unit economics

## Status

✅ All automated steps complete
⚠️ Manual steps remaining (45 min)
🚀 Ready for launch
