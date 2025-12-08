# Infrastructure Setup Guide

**Last Updated:** 2025-01-XX  
**Purpose:** Step-by-step guide for provisioning external services

---

## Overview

This guide walks through setting up all external services required for Settler production deployment.

**Services Required:**
1. ✅ Supabase (Database, Auth, RLS)
2. ✅ Upstash Redis (Job queues, caching, rate limiting)
3. ✅ Resend (Transactional email)
4. ⚠️ Sentry (Error tracking - optional but recommended)
5. ⚠️ Logflare (Log aggregation - optional)

---

## 1. Supabase Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up / Log in
3. Click "New Project"
4. Fill in:
   - **Name:** Settler Production (or your project name)
   - **Database Password:** Generate strong password (save it!)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free tier is fine to start

### Step 2: Get API Keys

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL:** `https://your-project.supabase.co`
   - **anon/public key:** `eyJhbGc...` (starts with `eyJ`)
   - **service_role key:** `eyJhbGc...` (⚠️ Keep secret!)

### Step 3: Run Migrations

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

**Or use the API:**
```bash
# Set environment variables
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Run migrations via API
npm run db:migrate:prod
```

### Step 4: Configure Storage (Optional)

1. Go to **Storage** in Supabase Dashboard
2. Create buckets:
   - `exports` (Private)
   - `uploads` (Private)
   - `public-assets` (Public)

3. Set up RLS policies (see `docs/supabase-gaps.md`)

### Step 5: Set Environment Variables

**In Vercel:**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**In Supabase Dashboard (for Edge Functions):**
- Go to **Settings** → **Edge Functions** → **Secrets**
- Add same variables

---

## 2. Upstash Redis Setup

### Step 1: Create Upstash Redis Database

1. Go to [console.upstash.com](https://console.upstash.com)
2. Sign up / Log in
3. Click "Create Database"
4. Fill in:
   - **Name:** settler-redis (or your name)
   - **Type:** Regional (or Global for multi-region)
   - **Region:** Choose same as Supabase
   - **Plan:** Free tier (10K commands/day) or Pay-as-you-go

### Step 2: Get Connection Details

1. Click on your database
2. Copy:
   - **REST URL:** `https://your-redis.upstash.io`
   - **REST Token:** `AX...` (for REST API)
   - **TCP Endpoint:** `your-redis.upstash.io:6379`
   - **TCP Password:** `your-password` (for BullMQ)

### Step 3: Test Connection

```bash
# Test REST API
curl https://your-redis.upstash.io/get/mykey \
  -H "Authorization: Bearer your-rest-token"

# Test TCP (for BullMQ)
# Use Redis CLI or test in code
```

### Step 4: Set Environment Variables

**In Vercel:**
```
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-rest-token
REDIS_HOST=your-redis.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-tcp-password
REDIS_TLS=true
```

---

## 3. Resend Setup

### Step 1: Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up / Log in
3. Verify your email

### Step 2: Get API Key

1. Go to **API Keys**
2. Click "Create API Key"
3. Name it: "Settler Production"
4. Copy the API key: `re_...` (starts with `re_`)

### Step 3: Verify Domain (Production)

1. Go to **Domains**
2. Click "Add Domain"
3. Enter your domain: `settler.dev` (or your domain)
4. Add DNS records (TXT, MX) as instructed
5. Wait for verification (can take up to 24 hours)

**For Development:**
- Use Resend's test domain: `onboarding@resend.dev`
- No domain verification needed

### Step 4: Set Environment Variables

**In Vercel:**
```
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@settler.dev
RESEND_FROM_NAME=Settler
```

**Note:** Update `RESEND_FROM_EMAIL` to your verified domain once verified.

---

## 4. Sentry Setup (Optional but Recommended)

### Step 1: Create Sentry Project

1. Go to [sentry.io](https://sentry.io)
2. Sign up / Log in
3. Click "Create Project"
4. Select:
   - **Platform:** Node.js
   - **Project Name:** Settler API

### Step 2: Get DSN

1. After creating project, copy the DSN:
   - `https://your-key@sentry.io/your-project-id`

### Step 3: Set Environment Variables

**In Vercel:**
```
SENTRY_DSN=https://your-key@sentry.io/your-project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

### Step 4: Configure Alerts (Optional)

1. Go to **Alerts** in Sentry
2. Create alert rules:
   - Error rate > 5%
   - New issues
   - Performance degradation

---

## 5. Logflare Setup (Optional)

### Step 1: Create Logflare Account

1. Go to [logflare.app](https://logflare.app)
2. Sign up / Log in
3. Connect Supabase project (if using Supabase)

### Step 2: Set Up Log Drain (Vercel)

1. In Vercel Dashboard → **Settings** → **Log Drains**
2. Add Logflare endpoint:
   - `https://api.logflare.app/api/logs?source=your-source-id`

### Step 3: View Logs

- Logs will appear in Logflare dashboard
- Set up alerts if needed

---

## 6. Vercel Environment Variables

### Setting Variables in Vercel

1. Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**
2. Add all variables from `.env.example`
3. Set for:
   - **Production**
   - **Preview** (optional)
   - **Development** (optional)

### Required Variables Checklist

**Supabase:**
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

**Redis:**
- [ ] `UPSTASH_REDIS_REST_URL`
- [ ] `UPSTASH_REDIS_REST_TOKEN`
- [ ] `REDIS_HOST`
- [ ] `REDIS_PORT`
- [ ] `REDIS_PASSWORD`
- [ ] `REDIS_TLS=true`

**Email:**
- [ ] `RESEND_API_KEY`
- [ ] `RESEND_FROM_EMAIL`
- [ ] `RESEND_FROM_NAME`

**Security:**
- [ ] `JWT_SECRET` (generate: `openssl rand -base64 32`)
- [ ] `ENCRYPTION_KEY` (generate: `openssl rand -hex 16`)

**Observability (Optional):**
- [ ] `SENTRY_DSN`
- [ ] `SENTRY_ENVIRONMENT`
- [ ] `SENTRY_TRACES_SAMPLE_RATE`

---

## 7. Testing Setup

### Test Supabase Connection

```bash
# Test database connection
npm run db:check

# Test migrations
npm run db:migrate:local
```

### Test Redis Connection

```typescript
// In your code
import { isRedisAvailable } from '@/infrastructure/redis/client';
console.log('Redis available:', isRedisAvailable());
```

### Test Resend Email

```typescript
// In your code
import { sendVerificationEmail } from '@/lib/email';
await sendVerificationEmail('test@example.com', 'https://...');
```

### Test Sentry

```typescript
// Trigger an error
throw new Error('Test error');
// Check Sentry dashboard
```

---

## 8. Cost Estimates

### Free Tier (Development)

- **Supabase:** Free (500 MB database, 2 GB bandwidth)
- **Upstash Redis:** Free (10K commands/day, 256 MB)
- **Resend:** Free (100 emails/day, 3K/month)
- **Sentry:** Free (5K events/month)
- **Logflare:** Free (limited)

**Total:** $0/month

### Production (Small Scale)

- **Supabase:** $25/month (Pro plan)
- **Upstash Redis:** ~$6-10/month (100K requests/day)
- **Resend:** $20/month (50K emails/month)
- **Sentry:** $26/month (50K events/month)
- **Logflare:** $0-20/month

**Total:** ~$75-100/month

### Production (Medium Scale)

- **Supabase:** $25/month
- **Upstash Redis:** ~$20-30/month (500K requests/day)
- **Resend:** $80/month (200K emails/month)
- **Sentry:** $26/month
- **Logflare:** $20/month

**Total:** ~$170-180/month

---

## 9. Troubleshooting

### Supabase Connection Issues

**Error:** "Connection refused"
- Check `SUPABASE_URL` is correct
- Check database is running (Supabase Dashboard)

**Error:** "Invalid API key"
- Verify `SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
- Check key hasn't been rotated

### Redis Connection Issues

**Error:** "Connection timeout"
- Check `REDIS_HOST` and `REDIS_PORT`
- Verify `REDIS_TLS=true` for Upstash
- Check firewall/network settings

**Error:** "Authentication failed"
- Verify `REDIS_PASSWORD` is correct
- Check if using TCP password (not REST token)

### Resend Email Issues

**Error:** "Invalid API key"
- Verify `RESEND_API_KEY` is correct
- Check API key hasn't been revoked

**Error:** "Domain not verified"
- Verify domain DNS records
- Wait for DNS propagation (up to 24 hours)
- Use test domain for development

---

## 10. Security Checklist

- [ ] All API keys are stored in Vercel environment variables (not in code)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is never exposed to client
- [ ] `JWT_SECRET` and `ENCRYPTION_KEY` are strong random values
- [ ] Redis password is kept secret
- [ ] Resend API key is kept secret
- [ ] Sentry DSN is not sensitive (but keep private)
- [ ] All services use HTTPS/TLS
- [ ] Database has RLS enabled on all tables
- [ ] Rate limiting is enabled

---

## References

- [Supabase Documentation](https://supabase.com/docs)
- [Upstash Redis Documentation](https://docs.upstash.com/redis)
- [Resend Documentation](https://resend.com/docs)
- [Sentry Documentation](https://docs.sentry.io/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
