# GitHub Secrets Setup Guide

## Quick Reference

Copy-paste this list when adding secrets to GitHub:

### Required Secrets

```
DATABASE_URL
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_PROJECT_REF
SUPABASE_ACCESS_TOKEN
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
```

---

## Detailed Instructions

### 1. Go to GitHub Secrets

**Path:** Repository → Settings → Secrets and variables → Actions → New repository secret

### 2. Add Each Secret

#### DATABASE_URL
- **Value:** Your PostgreSQL connection string
- **Format:** `postgresql://user:password@host:port/database`
- **Where:** Supabase Dashboard → Project Settings → Database → Connection string

#### SUPABASE_URL
- **Value:** Your Supabase project URL
- **Format:** `https://xxxxx.supabase.co`
- **Where:** Supabase Dashboard → Project Settings → API → Project URL

#### SUPABASE_ANON_KEY
- **Value:** Supabase anonymous key
- **Format:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where:** Supabase Dashboard → Project Settings → API → anon public key

#### SUPABASE_SERVICE_ROLE_KEY
- **Value:** Supabase service role key (⚠️ Keep secret!)
- **Format:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where:** Supabase Dashboard → Project Settings → API → service_role secret key

#### SUPABASE_PROJECT_REF
- **Value:** Your Supabase project reference ID
- **Format:** `abcdefghijklmnop`
- **Where:** Supabase Dashboard → Project Settings → General → Reference ID

#### SUPABASE_ACCESS_TOKEN
- **Value:** Supabase access token for CLI
- **Format:** `sbp_...`
- **Where:** Supabase Dashboard → Account Settings → Access Tokens → Generate new token

#### STRIPE_SECRET_KEY
- **Value:** Your Stripe secret key
- **Format:** `sk_live_...` (production) or `sk_test_...` (testing)
- **Where:** Stripe Dashboard → Developers → API keys → Secret key

#### STRIPE_WEBHOOK_SECRET
- **Value:** Stripe webhook signing secret
- **Format:** `whsec_...`
- **Where:** Stripe Dashboard → Developers → Webhooks → (after creating webhook) → Signing secret
- **Note:** Create webhook first, then add this secret

---

## Webhook Setup (After First Deploy)

1. Deploy the system first (without webhook secret)
2. Go to Stripe Dashboard → Developers → Webhooks
3. Click "Add endpoint"
4. URL: `https://your-domain.com/api/billing/webhook`
5. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `invoice.upcoming`
6. Copy the "Signing secret" (starts with `whsec_`)
7. Add to GitHub Secrets as `STRIPE_WEBHOOK_SECRET`
8. Re-run the deployment workflow or push a commit

---

## Verification

After adding secrets, verify they're set:

1. Go to Repository → Settings → Secrets and variables → Actions
2. You should see all 8 secrets listed
3. Secrets are masked (you can't see values, only names)

---

## Security Notes

- ✅ Secrets are encrypted at rest
- ✅ Secrets are only available to GitHub Actions
- ✅ Secrets are never logged in workflow output
- ✅ Use different keys for test/production environments

---

## Testing Secrets

After adding secrets, you can test by:

1. Pushing to main branch
2. Checking GitHub Actions tab
3. Viewing workflow run logs
4. Verifying no "secret not found" errors

---

**Once all secrets are added, you're ready to deploy!**
