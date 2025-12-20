# Secrets Setup Checklist

Quick reference checklist for setting up all required secrets across platforms.

## ✅ GitHub Secrets Checklist

Set these in: **Repository Settings → Secrets and variables → Actions**

### Critical (Required)
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `SUPABASE_ACCESS_TOKEN`
- [ ] `SUPABASE_PROJECT_REF`
- [ ] `SUPABASE_DB_PASSWORD`
- [ ] `DATABASE_URL`
- [ ] `DIRECT_URL`
- [ ] `JWT_SECRET` (32+ chars)
- [ ] `ENCRYPTION_KEY` (32 chars)
- [ ] `RESEND_API_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `VERCEL_TOKEN`
- [ ] `VERCEL_ORG_ID`
- [ ] `VERCEL_PROJECT_ID`

### Important (Recommended)
- [ ] `UPSTASH_REDIS_REST_URL`
- [ ] `UPSTASH_REDIS_REST_TOKEN`
- [ ] `REDIS_URL`
- [ ] `SENTRY_DSN`
- [ ] `SNYK_TOKEN`
- [ ] `OPENAI_API_KEY` (if using AI features)
- [ ] `PRODUCTION_URL`
- [ ] `E2E_API_KEY`
- [ ] `E2E_BASE_URL`

### Optional (Environment-Specific)
- [ ] `SUPABASE_PROJECT_REF_PREVIEW`
- [ ] `SUPABASE_URL_PREVIEW`
- [ ] `SUPABASE_ANON_KEY_PREVIEW`
- [ ] `SUPABASE_SERVICE_ROLE_KEY_PREVIEW`
- [ ] `DATABASE_URL_PREVIEW`
- [ ] `DIRECT_URL_PREVIEW`
- [ ] `SUPABASE_DB_PASSWORD_STAGING`
- [ ] `SUPABASE_DB_PASSWORD_PRODUCTION`

---

## ✅ Vercel Environment Variables Checklist

Set these in: **Vercel Dashboard → Project → Settings → Environment Variables**

### Critical (Required)
- [ ] `SUPABASE_URL` (Encrypted, Production/Preview/Development)
- [ ] `SUPABASE_ANON_KEY` (Encrypted, Production/Preview/Development)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (Encrypted, Production/Preview/Development)
- [ ] `DATABASE_URL` (Encrypted, Production/Preview/Development)
- [ ] `DIRECT_URL` (Encrypted, Production/Preview)
- [ ] `JWT_SECRET` (Encrypted, Production/Preview)
- [ ] `ENCRYPTION_KEY` (Encrypted, Production/Preview)
- [ ] `RESEND_API_KEY` (Encrypted, Production/Preview)
- [ ] `RESEND_FROM_EMAIL` (Plain, Production/Preview)
- [ ] `STRIPE_SECRET_KEY` (Encrypted, Production/Preview)
- [ ] `STRIPE_WEBHOOK_SECRET` (Encrypted, Production/Preview)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` (Plain, Production/Preview/Development)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Plain, Production/Preview/Development)

### Important (Recommended)
- [ ] `UPSTASH_REDIS_REST_URL` (Encrypted, Production/Preview)
- [ ] `UPSTASH_REDIS_REST_TOKEN` (Encrypted, Production/Preview)
- [ ] `REDIS_URL` (Encrypted, Production/Preview)
- [ ] `SENTRY_DSN` (Encrypted, Production/Preview)
- [ ] `NEXT_PUBLIC_SENTRY_DSN` (Plain, Production/Preview)
- [ ] `NEXT_PUBLIC_SITE_URL` (Plain, Production/Preview)
- [ ] `NEXT_PUBLIC_APP_URL` (Plain, Production/Preview)
- [ ] `TRUST_PROXY` (Plain, Production/Preview) = `true`
- [ ] `SECURE_COOKIES` (Plain, Production/Preview) = `true`

### Optional
- [ ] `NEXT_PUBLIC_GA4_MEASUREMENT_ID` (Plain, Production)
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` (Plain, Production)
- [ ] `SENTRY_ENVIRONMENT` (Plain, Production/Preview)
- [ ] `SENTRY_TRACES_SAMPLE_RATE` (Plain, Production/Preview) = `0.1`
- [ ] `LOG_LEVEL` (Plain, Production/Preview) = `info`

---

## ✅ Supabase Edge Function Secrets Checklist

Set these via: **Supabase CLI** or **Dashboard → Edge Functions → Secrets**

### Critical (Required)
- [ ] `UPSTASH_REDIS_REST_URL`
- [ ] `UPSTASH_REDIS_REST_TOKEN`
- [ ] `IP_RPM` (e.g., `60`)
- [ ] `USER_RPM` (e.g., `120`)
- [ ] `CACHE_MAX_AGE` (e.g., `300`)

### Important (Recommended)
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `OPENAI_API_KEY` (if using AI features)
- [ ] `RESEND_API_KEY`
- [ ] `FRONTEND_URL`

**CLI Command:**
```bash
supabase secrets set UPSTASH_REDIS_REST_URL="your-url" --project-ref your-project-ref
supabase secrets set UPSTASH_REDIS_REST_TOKEN="your-token" --project-ref your-project-ref
# ... repeat for each secret
```

---

## ✅ Local Development (.env) Checklist

Copy `.env.example` to `.env` and fill in values:

- [ ] Copy `.env.example` to `.env`
- [ ] Set `SUPABASE_URL`
- [ ] Set `SUPABASE_ANON_KEY`
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Set `DATABASE_URL` or individual DB_* variables
- [ ] Set `JWT_SECRET` (generate: `openssl rand -base64 32`)
- [ ] Set `ENCRYPTION_KEY` (generate: `openssl rand -hex 16`)
- [ ] Set `RESEND_API_KEY` (if using emails)
- [ ] Set `STRIPE_SECRET_KEY` (if using payments)
- [ ] Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (if using Redis)
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` (same as `SUPABASE_URL`)
- [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` (same as `SUPABASE_ANON_KEY`)
- [ ] Set `NEXT_PUBLIC_SITE_URL` (e.g., `http://localhost:3000`)
- [ ] Verify `.env` is in `.gitignore` ✅ (already configured)

---

## 🔐 Secret Generation Commands

```bash
# Generate JWT Secret (32+ characters)
openssl rand -base64 32

# Generate Encryption Key (32 characters)
openssl rand -hex 16

# Generate Random Password
openssl rand -base64 24
```

---

## 📋 Verification Steps

After setting up secrets:

### GitHub
- [ ] Run a test workflow to verify secrets are accessible
- [ ] Check workflow logs for any missing secret errors

### Vercel
- [ ] Trigger a new deployment
- [ ] Check build logs for missing variables
- [ ] Verify runtime environment variables are accessible
- [ ] Test client-side `NEXT_PUBLIC_*` variables in browser console

### Supabase
- [ ] Deploy an edge function to verify secrets are accessible
- [ ] Check function logs for secret access
- [ ] Test edge function execution

### Local
- [ ] Start development server: `npm run dev`
- [ ] Verify no missing environment variable errors
- [ ] Test API endpoints that require secrets

---

## 🚨 Security Reminders

- [ ] Never commit `.env` files (already in `.gitignore`)
- [ ] Never expose secrets in logs or error messages
- [ ] Use different secrets for dev/staging/production
- [ ] Rotate secrets every 90 days
- [ ] Review secret access permissions regularly
- [ ] Use encrypted storage for all secrets
- [ ] Never share secrets via unencrypted channels

---

## 📚 Documentation

- Full details: [SECRETS_MANAGEMENT.md](./SECRETS_MANAGEMENT.md)
- Environment schema: [config/env.schema.ts](../config/env.schema.ts)
- Vercel sync guide: [docs/vercel-env-sync-guide.md](./vercel-env-sync-guide.md)

---

**Last Updated**: Generated from codebase analysis