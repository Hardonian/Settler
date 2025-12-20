# Secrets Quick Start Guide

This guide helps you quickly set up all required secrets for GitHub, Vercel, and Supabase.

## 🎯 Overview

Your application requires secrets in three places:
1. **GitHub Secrets** - For CI/CD workflows
2. **Vercel Environment Variables** - For frontend builds and deployments
3. **Supabase Secrets** - For edge functions and database operations

## 📝 Step-by-Step Setup

### Step 1: Set Up GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings → Secrets and variables → Actions**
3. Click **New repository secret**
4. Add each secret from the list below:

**Minimum Required Secrets:**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ACCESS_TOKEN=your-access-token
SUPABASE_PROJECT_REF=your-project-ref-id
SUPABASE_DB_PASSWORD=your-database-password
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
JWT_SECRET=<generate with: openssl rand -base64 32>
ENCRYPTION_KEY=<generate with: openssl rand -hex 16>
RESEND_API_KEY=re_your_api_key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id
```

**Where to Find Values:**
- **Supabase**: Dashboard → Settings → API / Database
- **Resend**: Dashboard → API Keys
- **Stripe**: Dashboard → Developers → API keys / Webhooks
- **Vercel**: Dashboard → Settings → Tokens / General

### Step 2: Set Up Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Settings → Environment Variables**
4. Add each variable:

**Critical Variables:**
```
SUPABASE_URL (Encrypted, Production/Preview/Development)
SUPABASE_ANON_KEY (Encrypted, Production/Preview/Development)
SUPABASE_SERVICE_ROLE_KEY (Encrypted, Production/Preview/Development)
DATABASE_URL (Encrypted, Production/Preview/Development)
DIRECT_URL (Encrypted, Production/Preview)
JWT_SECRET (Encrypted, Production/Preview)
ENCRYPTION_KEY (Encrypted, Production/Preview)
RESEND_API_KEY (Encrypted, Production/Preview)
RESEND_FROM_EMAIL (Plain, Production/Preview) = noreply@settler.dev
STRIPE_SECRET_KEY (Encrypted, Production/Preview)
STRIPE_WEBHOOK_SECRET (Encrypted, Production/Preview)
NEXT_PUBLIC_SUPABASE_URL (Plain, Production/Preview/Development) = same as SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY (Plain, Production/Preview/Development) = same as SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL (Plain, Production/Preview) = https://settler.dev
NEXT_PUBLIC_APP_URL (Plain, Production/Preview) = https://settler.dev
```

**Important Notes:**
- Use **Encrypted** type for secrets
- Use **Plain** type for `NEXT_PUBLIC_*` variables (safe to expose)
- Set environment scoping (Production/Preview/Development)
- `NEXT_PUBLIC_*` variables use the same values as their server-side counterparts

### Step 3: Set Up Supabase Edge Function Secrets

**Via CLI (Recommended):**
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Set secrets
supabase secrets set UPSTASH_REDIS_REST_URL="your-url" --project-ref your-project-ref
supabase secrets set UPSTASH_REDIS_REST_TOKEN="your-token" --project-ref your-project-ref
supabase secrets set IP_RPM="60" --project-ref your-project-ref
supabase secrets set USER_RPM="120" --project-ref your-project-ref
supabase secrets set CACHE_MAX_AGE="300" --project-ref your-project-ref
supabase secrets set STRIPE_SECRET_KEY="sk_test_..." --project-ref your-project-ref
supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_..." --project-ref your-project-ref
supabase secrets set RESEND_API_KEY="re_..." --project-ref your-project-ref
supabase secrets set FRONTEND_URL="https://settler.dev" --project-ref your-project-ref
```

**Via Dashboard:**
1. Go to Supabase Dashboard → Your Project
2. Navigate to **Edge Functions**
3. Click on a function → **Settings** → **Secrets**
4. Add secrets as needed

### Step 4: Set Up Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in values in `.env`:
   - Use same values as GitHub secrets where applicable
   - For local Supabase, use your local Supabase instance or remote project
   - Generate `JWT_SECRET` and `ENCRYPTION_KEY` using commands below

3. Verify `.env` is gitignored (already configured ✅)

## 🔐 Generate Secrets

```bash
# Generate JWT Secret (32+ characters)
openssl rand -base64 32

# Generate Encryption Key (32 characters)
openssl rand -hex 16

# Generate Random Password
openssl rand -base64 24
```

## ✅ Verification

### Test GitHub Secrets
```bash
# Push a commit to trigger CI/CD
git push origin main

# Check GitHub Actions workflow logs
# Verify no "secret not found" errors
```

### Test Vercel Variables
```bash
# Trigger a new deployment
# Check Vercel build logs
# Verify build succeeds
# Check runtime logs for missing variables
```

### Test Supabase Secrets
```bash
# Deploy an edge function
supabase functions deploy your-function --project-ref your-project-ref

# Check function logs
# Verify secrets are accessible
```

### Test Local Development
```bash
# Start development server
npm run dev

# Check console for missing environment variable errors
# Test API endpoints
```

## 📋 Quick Reference

| Platform | Location | Type | Count |
|----------|----------|------|-------|
| GitHub | Repository Settings → Secrets | Secrets | ~20-30 |
| Vercel | Project Settings → Environment Variables | Encrypted/Plain | ~15-20 |
| Supabase | Edge Functions → Secrets | Secrets | ~5-10 |
| Local | `.env` file | Plain text | ~15-20 |

## 🚨 Common Issues

### "Secret not found" in GitHub Actions
- Verify secret name matches exactly (case-sensitive)
- Check secret is set in repository settings
- Ensure workflow has access to secrets

### Build fails in Vercel
- Check build logs for missing variable names
- Verify variables are set for correct environment (Production/Preview)
- Ensure `NEXT_PUBLIC_*` variables are set for client-side access

### Edge function can't access secrets
- Verify secrets are set via CLI or dashboard
- Check secret names match exactly
- Ensure project reference is correct

### Local development errors
- Verify `.env` file exists and has values
- Check variable names match code expectations
- Ensure `.env` is not committed to git

## 📚 Full Documentation

- **Complete Secrets List**: [SECRETS_MANAGEMENT.md](./SECRETS_MANAGEMENT.md)
- **Setup Checklist**: [SECRETS_CHECKLIST.md](./SECRETS_CHECKLIST.md)
- **Environment Schema**: [config/env.schema.ts](../config/env.schema.ts)
- **Vercel Sync Guide**: [vercel-env-sync-guide.md](./vercel-env-sync-guide.md)

## 🆘 Need Help?

1. Check the full documentation in `docs/SECRETS_MANAGEMENT.md`
2. Review environment variable schema in `config/env.schema.ts`
3. Check GitHub Actions workflow logs for specific errors
4. Verify all secrets are set using the checklist

---

**Remember**: Never commit secrets to version control! All `.env` files are gitignored.