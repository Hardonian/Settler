# First Deployment Checklist

## Pre-Deployment

- [ ] All GitHub Secrets added (see `GITHUB_SECRETS_SETUP.md`)
- [ ] Supabase project created and configured
- [ ] Stripe account created (test or live)
- [ ] Domain configured (for webhook endpoint)

## GitHub Secrets Required

- [ ] `DATABASE_URL`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `SUPABASE_PROJECT_REF`
- [ ] `SUPABASE_ACCESS_TOKEN`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET` (add after first deploy)

## Deployment

- [ ] Commit all changes to main branch
- [ ] Push to trigger GitHub Actions
- [ ] Monitor GitHub Actions workflow
- [ ] Verify all steps complete successfully

## Post-Deployment

- [ ] Verify database tables created (check Supabase Dashboard)
- [ ] Verify add-ons seeded (check `add_ons` table)
- [ ] Verify Stripe products created (check Stripe Dashboard)
- [ ] Verify edge functions deployed (check Supabase Functions)
- [ ] Configure Stripe webhook endpoint
- [ ] Add `STRIPE_WEBHOOK_SECRET` to GitHub Secrets
- [ ] Test billing flow end-to-end

## Verification Commands

```bash
# Check setup
npx tsx scripts/check-billing-setup.ts

# Verify initialization
npm run billing:init
```

## Testing

- [ ] Create billing account
- [ ] Subscribe to base plan
- [ ] Purchase add-on
- [ ] Report usage
- [ ] Get invoice estimate
- [ ] Verify webhook processing

---

**Once all checked, system is ready for production!**
