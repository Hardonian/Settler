# Environment Variable Sync Summary

This document summarizes all fixes and provides a quick reference for syncing environment variables between GitHub secrets and Vercel.

## ✅ Fixes Implemented

### 1. Security Fix: Removed Client-Side Secret Key Exposure

- **File:** `packages/web/src/app/playground/page.tsx`
- **Change:** Removed `NEXT_PUBLIC_STRIPE_SECRET_KEY` usage
- **Impact:** Prevents secret keys from being exposed to browser
- **Status:** ✅ Fixed

### 2. Workflow Fix: Corrected Supabase URL Reference

- **File:** `.github/workflows/supabase-migrate.yml`
- **Change:** Updated to use `secrets.SUPABASE_URL` instead of `secrets.NEXT_PUBLIC_SUPABASE_URL`
- **Impact:** Ensures workflow uses correct GitHub secret name
- **Status:** ✅ Fixed

## 📋 Tools Created

### 1. GitHub Secrets Verification Script

- **File:** `scripts/verify-github-secrets.ts`
- **Purpose:** Analyzes codebase and workflows to identify required secrets
- **Usage:** `npx tsx scripts/verify-github-secrets.ts`

### 2. Vercel Environment Variable Sync Guide

- **File:** `docs/vercel-env-sync-guide.md`
- **Purpose:** Step-by-step guide for syncing variables to Vercel
- **Includes:** Variable mappings, security best practices, troubleshooting

### 3. Vercel Environment Variables Template

- **File:** `scripts/vercel-env-vars-template.json`
- **Purpose:** JSON template for Vercel CLI import
- **Usage:** Fill in values and use with Vercel CLI

## 🔄 Variable Sync Process

### Step 1: Verify GitHub Secrets

```bash
# Run verification script
npx tsx scripts/verify-github-secrets.ts
```

This will:

- List all secrets referenced in workflows
- Identify missing critical variables
- Check for incorrect NEXT*PUBLIC* usage

### Step 2: Sync to Vercel

**Option A: Vercel Dashboard (Recommended)**

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. For each variable in `docs/vercel-env-sync-guide.md`:
   - Click "Add"
   - Enter key and value (copy from GitHub secrets)
   - Select environments (Production, Preview, Development)

**Option B: Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Add variables one by one
vercel env add SUPABASE_URL production
# Enter value when prompted
```

### Step 3: Verify Sync

1. Check Vercel dashboard shows all variables
2. Trigger a new deployment
3. Check build logs for any missing variable errors
4. Test runtime endpoints (`/api/health`)

## 📊 Variable Categories

### Server-Side Only (GitHub Secrets → Vercel)

These should be encrypted in Vercel:

- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `STRIPE_SECRET_KEY`
- `RESEND_API_KEY`
- `UPSTASH_REDIS_REST_TOKEN`

### Client-Side (NEXT*PUBLIC*\*)

These are exposed to the browser:

- `NEXT_PUBLIC_SUPABASE_URL` (use same value as `SUPABASE_URL`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (use same value as `SUPABASE_ANON_KEY`)
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SENTRY_DSN` (optional)

### Both (Set in Both Places)

Some variables are used in both contexts:

- `SUPABASE_URL` → Also set as `NEXT_PUBLIC_SUPABASE_URL` in Vercel
- `SUPABASE_ANON_KEY` → Also set as `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel

## 🔐 Security Checklist

- [ ] All secret keys are encrypted in Vercel (not plain text)
- [ ] No `NEXT_PUBLIC_` prefix on secret keys
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is server-side only
- [ ] `STRIPE_SECRET_KEY` is server-side only
- [ ] `JWT_SECRET` and `ENCRYPTION_KEY` are server-side only
- [ ] GitHub secrets are set in repository settings
- [ ] Vercel variables are set for correct environments

## 📚 Documentation Files

1. **`docs/github-secrets-checklist.md`** - Complete list of all GitHub secrets
2. **`docs/vercel-env-sync-guide.md`** - Step-by-step Vercel sync guide
3. **`docs/env-sync-summary.md`** - This file (quick reference)
4. **`scripts/verify-github-secrets.ts`** - Verification script
5. **`scripts/sync-vercel-env.ts`** - Guide generator script

## 🚀 Quick Start

1. **Review:** Read `docs/github-secrets-checklist.md`
2. **Verify:** Run `npx tsx scripts/verify-github-secrets.ts`
3. **Sync:** Follow `docs/vercel-env-sync-guide.md`
4. **Test:** Deploy and verify all variables work

## ⚠️ Important Notes

- GitHub secrets are for CI/CD workflows
- Vercel environment variables are for runtime
- `NEXT_PUBLIC_*` variables MUST be set in Vercel (not GitHub secrets)
- Use non-prefixed versions in GitHub secrets
- Duplicate values for `NEXT_PUBLIC_` variants in Vercel

## 🆘 Troubleshooting

### Variables not syncing from GitHub

- Check GitHub integration is enabled in Vercel
- Some variables (especially `NEXT_PUBLIC_`) need manual setup
- Verify GitHub secrets exist in repository settings

### Build failures

- Check Vercel build logs for missing variable names
- Ensure variables are set for correct environment
- Verify variable names match exactly (case-sensitive)

### Client-side variables not accessible

- Ensure `NEXT_PUBLIC_` prefix is used
- Check variable is set in Vercel (not just GitHub)
- May need to redeploy after adding variables

For detailed troubleshooting, see `docs/vercel-env-sync-guide.md`.
