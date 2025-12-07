# Deployment Setup Guide

## Quick Start - One-Time Setup

### 1. Add GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SUPABASE_PROJECT_REF` - Supabase project reference ID
- `SUPABASE_ACCESS_TOKEN` - Supabase access token (for CLI)

**Stripe (Required for billing):**
- `STRIPE_SECRET_KEY` - Your Stripe secret key (sk_live_... or sk_test_...)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret (get from Stripe Dashboard after setting up webhook)

### 2. Commit to Main

Once secrets are added, commit to main branch:

```bash
git add .
git commit -m "feat: Complete billing system implementation"
git push origin main
```

### 3. Automatic Deployment

The GitHub Actions workflow will automatically:
- ✅ Run database migrations
- ✅ Seed add-ons
- ✅ Create Stripe products (if Stripe key is set)
- ✅ Deploy edge functions
- ✅ Initialize billing system
- ✅ Verify deployment

## What Happens on Deploy

### Automatic Steps

1. **Database Migrations** (`deploy-billing-migrations.yml`)
   - Runs Prisma migrations
   - Deploys Supabase migrations
   - Creates all billing tables

2. **Add-On Seeding** (`init-billing-on-deploy.yml`)
   - Seeds 10 add-ons (5 standard + 5 premium)
   - Creates add-on records in database

3. **Stripe Setup** (if `STRIPE_SECRET_KEY` is set)
   - Creates Stripe products
   - Creates Stripe prices
   - Outputs product/price IDs (add to secrets if needed)

4. **Edge Functions Deployment** (`deploy-edge-functions.yml`)
   - Deploys all 8 billing edge functions
   - Sets up function environment variables

5. **Verification**
   - Verifies database tables exist
   - Verifies add-ons are seeded
   - Verifies Stripe products (if configured)
   - Verifies database functions

## Post-Deployment Steps

### 1. Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://your-domain.com/api/billing/webhook`
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `invoice.upcoming`
5. Copy webhook secret
6. Add to GitHub Secrets as `STRIPE_WEBHOOK_SECRET`

### 2. Verify Stripe Products

After first deployment, check if Stripe products were created:
- Go to Stripe Dashboard → Products
- Verify all 6 products exist (1 base + 5 add-ons)
- If missing, run: `npm run billing:setup-stripe`

### 3. Test Billing Flow

1. Create billing account: `POST /api/billing/create-customer`
2. Subscribe: `POST /api/billing/subscribe`
3. Purchase add-on: `POST /api/billing/addon/purchase`
4. Report usage: `POST /api/billing/usage/report`
5. Get estimate: `GET /api/billing/invoice/estimate`

## Manual Setup (If Needed)

### Run Migrations Manually

```bash
# Prisma migrations
npm run prisma:migrate

# Supabase migrations
supabase db push
```

### Seed Add-Ons Manually

```bash
npm run billing:seed
```

### Setup Stripe Products Manually

```bash
npm run billing:setup-stripe
```

### Initialize System Manually

```bash
npm run billing:init
```

## Environment Variables

All required environment variables are documented in `.env.example`.

**Minimum required for billing:**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY` (for production)
- `STRIPE_WEBHOOK_SECRET` (after webhook setup)

## Troubleshooting

### Migrations Fail
- Check `DATABASE_URL` is correct
- Verify Supabase credentials
- Check migration files are valid

### Stripe Products Not Created
- Verify `STRIPE_SECRET_KEY` is set
- Check Stripe key has product creation permissions
- Run `npm run billing:setup-stripe` manually

### Edge Functions Fail to Deploy
- Verify `SUPABASE_ACCESS_TOKEN` is set
- Check `SUPABASE_PROJECT_REF` is correct
- Ensure Supabase CLI has deployment permissions

### Add-Ons Not Seeded
- Check `SUPABASE_SERVICE_ROLE_KEY` is set
- Verify database tables exist
- Run `npm run billing:seed` manually

## Verification

After deployment, verify everything works:

```bash
# Check database
npm run db:check

# Verify billing system
npm run billing:init

# Test API endpoints
curl https://your-domain.com/api/billing/invoice/estimate?billing_account_id=test
```

## Support

If deployment fails:
1. Check GitHub Actions logs
2. Verify all secrets are set correctly
3. Run verification script: `npx tsx scripts/verify-deployment.ts`
4. Check error logs in Supabase Dashboard

---

**That's it! Once you add the secrets and push to main, everything deploys automatically.**
