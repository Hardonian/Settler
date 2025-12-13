# External Services Setup Guide

**Step-by-step setup for all external services**

---

## 1. Sentry (Error Tracking)

### Step 1: Create Account
1. Go to https://sentry.io/signup/
2. Sign up with email or GitHub
3. Choose "Next.js" as platform
4. Create project: "Settler Web"

### Step 2: Get DSN
1. After creating project, copy DSN
2. Format: `https://xxx@sentry.io/xxx`
3. Save for next step

### Step 3: Install Package
```bash
cd packages/web
npm install @sentry/nextjs
```

**⚠️ Important:** The package is already installed. If you encounter build timeouts, set `SENTRY_SKIP_AUTO_INSTALL=1` in Vercel environment variables (see Step 4).

### Step 4: Configure Vercel
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `NEXT_PUBLIC_SENTRY_DSN` = [Your DSN]
   - `SENTRY_DSN` = [Your DSN]
   - `SENTRY_ENVIRONMENT` = `production`
   - `SENTRY_TRACES_SAMPLE_RATE` = `0.1`
   - `SENTRY_SKIP_AUTO_INSTALL` = `1` (⚠️ **Required** - prevents build timeout)
3. Redeploy

### Step 5: Test
1. Trigger test error (add temporary error in code)
2. Check Sentry dashboard
3. Verify error appears
4. Remove test error

**✅ Done when:** Errors appear in Sentry dashboard

---

## 2. Stripe (Billing)

### Step 1: Create Products
1. Go to https://dashboard.stripe.com/products
2. Click "Add product"
3. Create "Settler Commercial":
   - Name: "Settler Commercial"
   - Description: "Platform integrations and advanced features"
   - Pricing: $99/month (recurring)
   - Copy Price ID (starts with `price_`)

4. Create "Settler Commercial Annual":
   - Name: "Settler Commercial (Annual)"
   - Pricing: $990/year (recurring)
   - Copy Price ID

### Step 2: Get API Keys
1. Stripe Dashboard → Developers → API Keys
2. Copy "Secret key" (starts with `sk_`)
3. Copy "Publishable key" (starts with `pk_`) (if needed)

### Step 3: Set Up Webhook
1. Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://settler.dev/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.updated`
5. Copy "Signing secret" (starts with `whsec_`)

### Step 4: Configure Vercel
1. Vercel Dashboard → Environment Variables
2. Add:
   - `STRIPE_SECRET_KEY` = [Your secret key]
   - `STRIPE_PUBLIC_KEY` = [Your publishable key] (if needed)
   - `STRIPE_PRICE_ID_PRO` = [Commercial monthly price ID]
   - `STRIPE_PRICE_ID_PRO_ANNUAL` = [Commercial annual price ID] (if using)
   - `STRIPE_WEBHOOK_SECRET` = [Webhook signing secret]
3. Redeploy

### Step 5: Test
1. Use test card: `4242 4242 4242 4242`
2. Complete test checkout
3. Verify webhook received
4. Verify subscription created in database

**✅ Done when:** Test payment works, webhook processes, subscription syncs

---

## 3. Resend (Email)

### Step 1: Create Account
1. Go to https://resend.com/
2. Sign up with email
3. Verify email

### Step 2: Verify Domain
1. Resend Dashboard → Domains → Add Domain
2. Add: `settler.dev` (or your domain)
3. Add DNS records:
   - SPF record
   - DKIM record
   - DMARC record (optional)
4. Wait for verification (can take 24-48 hours)

### Step 3: Get API Key
1. Resend Dashboard → API Keys
2. Create new API key
3. Copy API key (starts with `re_`)

### Step 4: Configure Vercel
1. Vercel Dashboard → Environment Variables
2. Add:
   - `RESEND_API_KEY` = [Your API key]
   - `RESEND_FROM_EMAIL` = `noreply@settler.dev`
   - `RESEND_FROM_NAME` = `Settler`
3. Redeploy

### Step 5: Test
1. Send test email
2. Verify email received
3. Check spam folder if not received

**✅ Done when:** Test email received

---

## 4. Supabase (Database)

### Step 1: Verify Connection
1. Go to https://supabase.com/dashboard
2. Select your project
3. Settings → Database → Connection String
4. Verify matches `.env` file

### Step 2: Verify Migrations
1. Supabase Dashboard → Database → Migrations
2. Verify all migrations applied
3. Check for these tables:
   - `stripe_events`
   - `billing_accounts`
   - `subscriptions`

### Step 3: Get Service Role Key
1. Supabase Dashboard → Settings → API
2. Copy "Service Role Key" (starts with `eyJ`)
3. **⚠️ Keep this secret!** Never expose to client

### Step 4: Configure Vercel
1. Vercel Dashboard → Environment Variables
2. Add:
   - `SUPABASE_URL` = [Your Supabase URL]
   - `SUPABASE_ANON_KEY` = [Your anon key]
   - `SUPABASE_SERVICE_ROLE_KEY` = [Your service role key]
3. Redeploy

**✅ Done when:** Database accessible, migrations applied

---

## 5. Upstash (Redis)

### Step 1: Create Database
1. Go to https://console.upstash.com/
2. Create new database
3. Choose region (closest to your users)
4. Copy Redis URL (starts with `rediss://`)

### Step 2: Get REST API Credentials
1. Upstash Dashboard → Your Database → REST API
2. Copy REST URL
3. Copy REST Token

### Step 3: Configure Vercel
1. Vercel Dashboard → Environment Variables
2. Add:
   - `UPSTASH_REDIS_REST_URL` = [Your REST URL]
   - `UPSTASH_REDIS_REST_TOKEN` = [Your REST Token]
   - `REDIS_URL` = [Your Redis URL] (if using TCP)
3. Redeploy

**✅ Done when:** Redis accessible, can set/get values

---

## 6. Product Analytics (PostHog)

### Step 1: Create Account
1. Go to https://posthog.com/
2. Sign up (free tier available)
3. Create project: "Settler"

### Step 2: Install SDK
```bash
cd packages/web
npm install posthog-js
```

### Step 3: Get API Key
1. PostHog Dashboard → Project Settings → API Keys
2. Copy "Project API Key"

### Step 4: Configure
1. Add to Vercel env vars: `NEXT_PUBLIC_POSTHOG_KEY`
2. Add to code: Initialize PostHog client
3. Track key events:
   - Signup
   - API key created
   - First reconciliation
   - Payment

**✅ Done when:** Events tracked in PostHog dashboard

---

## 7. Uptime Monitoring (UptimeRobot)

### Step 1: Create Account
1. Go to https://uptimerobot.com/
2. Sign up (free tier: 50 monitors)

### Step 2: Add Monitor
1. Dashboard → Add New Monitor
2. Monitor Type: HTTP(s)
3. Friendly Name: "Settler API"
4. URL: `https://settler.dev/health`
5. Monitoring Interval: 5 minutes
6. Alert Contacts: Your email

### Step 3: Test
1. Wait for first check
2. Verify monitor shows "UP"
3. Test alert (pause monitor temporarily)

**✅ Done when:** Monitor shows "UP", alerts configured

---

## Quick Setup Checklist

**Do these in order:**

- [ ] **Sentry** (30 min) — Error tracking
- [ ] **Stripe** (1 hour) — Billing
- [ ] **Supabase** (30 min) — Database (already set up, verify)
- [ ] **Upstash** (15 min) — Redis (already set up, verify)
- [ ] **Resend** (30 min) — Email (optional but recommended)
- [ ] **PostHog** (30 min) — Analytics (optional but recommended)
- [ ] **UptimeRobot** (15 min) — Uptime monitoring (optional but recommended)

**Total Time:** ~3-4 hours

---

## Environment Variables Summary

**Copy this list and check off as you set each:**

### Required
- [ ] `NEXT_PUBLIC_SENTRY_DSN`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `STRIPE_PRICE_ID_PRO`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `UPSTASH_REDIS_REST_URL`
- [ ] `UPSTASH_REDIS_REST_TOKEN`
- [ ] `JWT_SECRET`
- [ ] `ENCRYPTION_KEY`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `NEXT_PUBLIC_SITE_URL`

### Optional (but recommended)
- [ ] `RESEND_API_KEY`
- [ ] `RESEND_FROM_EMAIL`
- [ ] `NEXT_PUBLIC_POSTHOG_KEY`
- [ ] `SENTRY_ENVIRONMENT`
- [ ] `SENTRY_TRACES_SAMPLE_RATE`

---

**Last Updated:** January 2026
