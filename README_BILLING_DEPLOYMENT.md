# 🚀 Billing System - Zero-Config Deployment

## What You Need to Do

**Just 2 steps:**

1. **Add GitHub Secrets** (one-time setup)
2. **Commit to main** - Everything else is automatic!

---

## Step 1: Add GitHub Secrets

Go to: **GitHub Repo → Settings → Secrets and variables → Actions → New repository secret**

### Required Secrets:

```
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_PROJECT_REF=xxx
SUPABASE_ACCESS_TOKEN=xxx
STRIPE_SECRET_KEY=sk_live_... (or sk_test_...)
STRIPE_WEBHOOK_SECRET=whsec_... (get after webhook setup)
```

### Where to Find:

- **Supabase**: Dashboard → Project Settings → API
- **Stripe**: Dashboard → Developers → API keys
- **Stripe Webhook Secret**: Dashboard → Developers → Webhooks → (after creating webhook)

---

## Step 2: Commit to Main

```bash
git add .
git commit -m "feat: Complete billing system with auto-deployment"
git push origin main
```

**That's it!** 🎉

---

## What Happens Automatically

When you push to main, GitHub Actions will:

1. ✅ **Run Database Migrations**
   - Creates all billing tables
   - Creates database functions
   - Sets up indexes

2. ✅ **Seed Add-Ons**
   - Creates 10 add-ons (5 standard + 5 premium)
   - Populates add-on catalog

3. ✅ **Create Stripe Products** (if Stripe key is set)
   - Creates base plan product
   - Creates 5 add-on products
   - Creates all prices

4. ✅ **Deploy Edge Functions**
   - Deploys 8 billing edge functions
   - Configures function environment

5. ✅ **Initialize System**
   - Verifies all components
   - Checks connections
   - Reports any issues

---

## Post-Deployment (One-Time)

### Configure Stripe Webhook

After first deployment:

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Click **"Add endpoint"**
3. URL: `https://your-domain.com/api/billing/webhook`
4. Select events:
   - `customer.subscription.*`
   - `invoice.*`
5. Copy the **webhook secret**
6. Add to GitHub Secrets as `STRIPE_WEBHOOK_SECRET`
7. Push again (or re-run workflow)

---

## Verification

After deployment, verify everything works:

```bash
# Check setup
npx tsx scripts/check-billing-setup.ts

# Or via npm
npm run billing:init
```

---

## Manual Commands (If Needed)

If something fails, you can run manually:

```bash
# Migrations
npm run db:push

# Seed add-ons
npm run billing:seed

# Setup Stripe
npm run billing:setup-stripe

# Initialize
npm run billing:init
```

---

## Troubleshooting

### Migrations Fail
- ✅ Check `DATABASE_URL` format
- ✅ Verify Supabase credentials
- ✅ Check GitHub Actions logs

### Stripe Products Not Created
- ✅ Verify `STRIPE_SECRET_KEY` is set
- ✅ Run manually: `npm run billing:setup-stripe`
- ✅ Check Stripe Dashboard for products

### Edge Functions Not Deploying
- ✅ Verify `SUPABASE_ACCESS_TOKEN` is set
- ✅ Check `SUPABASE_PROJECT_REF` is correct
- ✅ Review GitHub Actions logs

---

## File Structure

All deployment files are in place:

- ✅ `.github/workflows/deploy-billing-migrations.yml` - Auto-migrations
- ✅ `.github/workflows/deploy-edge-functions.yml` - Auto-deploy functions
- ✅ `.github/workflows/init-billing-on-deploy.yml` - Auto-initialize
- ✅ `.github/workflows/complete-deployment.yml` - Complete deployment
- ✅ `scripts/init-billing-system.ts` - Initialization script
- ✅ `scripts/post-migration-seed.ts` - Seed script
- ✅ `scripts/auto-setup-stripe.ts` - Stripe auto-setup
- ✅ `scripts/verify-deployment.ts` - Verification script

---

## Status Check

After deployment, the system will be:

- ✅ Database tables created
- ✅ Add-ons seeded
- ✅ Stripe products created (if key provided)
- ✅ Edge functions deployed
- ✅ Ready for customers

---

## Next Steps After Deployment

1. **Test Billing Flow**
   - Create billing account
   - Subscribe to plan
   - Purchase add-on
   - Verify usage tracking

2. **Configure Webhook** (see above)

3. **Monitor**
   - Check GitHub Actions for any errors
   - Monitor Supabase logs
   - Check Stripe Dashboard

4. **Launch**
   - Enable billing for customers
   - Monitor first subscriptions
   - Gather feedback

---

**🎊 That's it! Add secrets, commit, and you're done! 🎊**
