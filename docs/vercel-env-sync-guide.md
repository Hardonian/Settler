# Vercel Environment Variable Sync Guide

This guide helps you sync environment variables from GitHub secrets to Vercel.

## Overview

- **Vercel Environment Variables**: canonical app deployment source for build/runtime values.
- **Doppler (optional)**: upstream secret vault; values must still be synced into Vercel for hosted app behavior.
- **Supabase**: owns Supabase-side secrets only (database platform concerns).
- **GitHub Secrets**: CI/workflow-only unless intentionally mirrored into Vercel.
- **`NEXT_PUBLIC_` Variables**: explicitly public and browser-exposed; server-only secrets must never be duplicated with `NEXT_PUBLIC_` prefix.

## Quick Sync Methods

### Method 1: Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. For each variable below, click **Add** and enter:
   - **Key**: Variable name
   - **Value**: Copy from GitHub secrets (see mapping below)
   - **Environment**: Select appropriate environments (Production, Preview, Development)

### Method 2: Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link your project (if not already linked)
vercel link

# Import environment variables from JSON file
vercel env pull .env.local
# Then manually add each variable using:
vercel env add VARIABLE_NAME production
```

### Method 3: GitHub Integration (Auto-sync)

If GitHub integration is enabled in Vercel:

- Some variables may auto-sync from GitHub secrets
- However, `NEXT_PUBLIC_` variables typically need manual setup
- Review this guide to ensure all variables are properly configured

## Required Variables

### 🔴 Critical (Must Have)

- **SUPABASE_URL** (Private)
  - Source: GitHub secret `SUPABASE_URL`
  - Environments: production, preview, development
  - Description: Supabase project URL

- **SUPABASE_ANON_KEY** (Private)
  - Source: GitHub secret `SUPABASE_ANON_KEY`
  - Environments: production, preview, development
  - Description: Supabase anonymous key (server-side)

- **SUPABASE_SERVICE_ROLE_KEY** (Private)
  - Source: GitHub secret `SUPABASE_SERVICE_ROLE_KEY`
  - Environments: production, preview, development
  - Description: Supabase service role key (NEVER expose to client)

- **NEXT_PUBLIC_SUPABASE_URL** (Public)
  - Source: GitHub secret `SUPABASE_URL`
  - Environments: production, preview, development
  - Description: Supabase URL exposed to client (use same value as SUPABASE_URL)

- **NEXT_PUBLIC_SUPABASE_ANON_KEY** (Public)
  - Source: GitHub secret `SUPABASE_ANON_KEY`
  - Environments: production, preview, development
  - Description: Supabase anonymous key exposed to client (use same value as SUPABASE_ANON_KEY)

- **DATABASE_URL** (Private)
  - Source: GitHub secret `DATABASE_URL`
  - Environments: production, preview, development
  - Description: PostgreSQL connection string

- **JWT_SECRET** (Private)
  - Source: GitHub secret `JWT_SECRET`
  - Environments: production, preview
  - Description: JWT token signing secret (32+ characters)

- **ENCRYPTION_KEY** (Private)
  - Source: GitHub secret `ENCRYPTION_KEY`
  - Environments: production, preview
  - Description: AES-256-GCM encryption key (exactly 32 characters)

- **RESEND_API_KEY** (Private)
  - Source: GitHub secret `RESEND_API_KEY`
  - Environments: production, preview
  - Description: Resend API key for transactional emails

- **STRIPE_SECRET_KEY** (Private)
  - Source: GitHub secret `STRIPE_SECRET_KEY`
  - Environments: production, preview
  - Description: Stripe secret key (NEVER expose to client)

### 🟡 Important (Recommended)

- **DIRECT_URL** (Private)
  - Source: GitHub secret `DIRECT_URL`
  - Environments: production, preview
  - Description: Direct database connection (bypass pooler)

- **UPSTASH_REDIS_REST_URL** (Private)
  - Source: GitHub secret `UPSTASH_REDIS_REST_URL`
  - Environments: production, preview
  - Description: Upstash Redis REST API URL

- **UPSTASH_REDIS_REST_TOKEN** (Private)
  - Source: GitHub secret `UPSTASH_REDIS_REST_TOKEN`
  - Environments: production, preview
  - Description: Upstash Redis REST API token

- **REDIS_URL** (Private)
  - Source: GitHub secret `REDIS_URL`
  - Environments: production, preview
  - Description: Redis connection URL (fallback)

- **RESEND_FROM_EMAIL** (Private)
  - Source: GitHub secret `RESEND_FROM_EMAIL`
  - Environments: production, preview
  - Description: Default sender email address

- **STRIPE_WEBHOOK_SECRET** (Private)
  - Source: GitHub secret `STRIPE_WEBHOOK_SECRET`
  - Environments: production, preview
  - Description: Stripe webhook secret for verification

- **SENTRY_DSN** (Private)
  - Source: GitHub secret `SENTRY_DSN`
  - Environments: production, preview
  - Description: Sentry DSN for error tracking

- **NEXT_PUBLIC_SENTRY_DSN** (Public)
  - Source: GitHub secret `SENTRY_DSN`
  - Environments: production, preview
  - Description: Sentry DSN for client-side error tracking (use same value as SENTRY_DSN)

- **NEXT_PUBLIC_SITE_URL** (Public)
  - Source: GitHub secret `NEXT_PUBLIC_SITE_URL`
  - Environments: production, preview
  - Description: Public site URL (e.g., https://settler.dev)

- **NEXT_PUBLIC_APP_URL** (Public)
  - Source: GitHub secret `NEXT_PUBLIC_APP_URL`
  - Environments: production, preview
  - Description: Public app URL (e.g., https://settler.dev)

- **NEXT_PUBLIC_GA4_MEASUREMENT_ID** (Public)
  - Source: GitHub secret `NEXT_PUBLIC_GA4_MEASUREMENT_ID`
  - Environments: production
  - Description: Google Analytics 4 measurement ID

- **NEXT_PUBLIC_POSTHOG_KEY** (Public)
  - Source: GitHub secret `NEXT_PUBLIC_POSTHOG_KEY`
  - Environments: production
  - Description: PostHog API key

## Special Notes

### `NEXT_PUBLIC_` Variables

Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. These should:

1. Use the same values as their server-side counterparts (e.g., `NEXT_PUBLIC_SUPABASE_URL` = `SUPABASE_URL`)
2. Be set in Vercel dashboard (not GitHub secrets)
3. Only contain non-sensitive configuration (never secrets!)

### Security Best Practices

- ✅ **DO** set server-side secrets in Vercel (encrypted)
- ✅ **DO** use `NEXT_PUBLIC_` prefix only for non-sensitive config
- ❌ **DON'T** expose secret keys with `NEXT_PUBLIC_` prefix
- ❌ **DON'T** commit environment variables to git

### Variable Mapping

| GitHub Secret                    | Vercel Key                       | Public? | Required |
| -------------------------------- | -------------------------------- | ------- | -------- |
| `SUPABASE_URL`                   | `SUPABASE_URL`                   | No      | Yes      |
| `SUPABASE_ANON_KEY`              | `SUPABASE_ANON_KEY`              | No      | Yes      |
| `SUPABASE_SERVICE_ROLE_KEY`      | `SUPABASE_SERVICE_ROLE_KEY`      | No      | Yes      |
| `SUPABASE_URL`                   | `NEXT_PUBLIC_SUPABASE_URL`       | Yes     | Yes      |
| `SUPABASE_ANON_KEY`              | `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Yes     | Yes      |
| `DATABASE_URL`                   | `DATABASE_URL`                   | No      | Yes      |
| `DIRECT_URL`                     | `DIRECT_URL`                     | No      | No       |
| `JWT_SECRET`                     | `JWT_SECRET`                     | No      | Yes      |
| `ENCRYPTION_KEY`                 | `ENCRYPTION_KEY`                 | No      | Yes      |
| `UPSTASH_REDIS_REST_URL`         | `UPSTASH_REDIS_REST_URL`         | No      | No       |
| `UPSTASH_REDIS_REST_TOKEN`       | `UPSTASH_REDIS_REST_TOKEN`       | No      | No       |
| `REDIS_URL`                      | `REDIS_URL`                      | No      | No       |
| `RESEND_API_KEY`                 | `RESEND_API_KEY`                 | No      | Yes      |
| `RESEND_FROM_EMAIL`              | `RESEND_FROM_EMAIL`              | No      | No       |
| `STRIPE_SECRET_KEY`              | `STRIPE_SECRET_KEY`              | No      | Yes      |
| `STRIPE_WEBHOOK_SECRET`          | `STRIPE_WEBHOOK_SECRET`          | No      | No       |
| `SENTRY_DSN`                     | `SENTRY_DSN`                     | No      | No       |
| `SENTRY_DSN`                     | `NEXT_PUBLIC_SENTRY_DSN`         | Yes     | No       |
| `NEXT_PUBLIC_SITE_URL`           | `NEXT_PUBLIC_SITE_URL`           | Yes     | No       |
| `NEXT_PUBLIC_APP_URL`            | `NEXT_PUBLIC_APP_URL`            | Yes     | No       |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | Yes     | No       |
| `NEXT_PUBLIC_POSTHOG_KEY`        | `NEXT_PUBLIC_POSTHOG_KEY`        | Yes     | No       |

## Verification

After syncing variables:

1. **Check Vercel Dashboard**: Verify all variables are set correctly
2. **Test Deployment**: Trigger a new deployment and check build logs
3. **Runtime Check**: Use `/api/health` endpoint to verify environment configuration
4. **Client Check**: Verify `NEXT_PUBLIC_` variables are accessible in browser console

## Contract Verification

Run these after sync to catch drift before deploy:

```bash
pnpm run verify:env:contract
```

## Troubleshooting

### Variables not syncing from GitHub

- Check GitHub integration is enabled in Vercel project settings
- Some variables (especially `NEXT_PUBLIC_`) may need manual setup
- Verify GitHub secrets are set in repository settings

### Build failures due to missing variables

- Check Vercel build logs for specific missing variable names
- Ensure variables are set for the correct environment (Production/Preview)
- Verify variable names match exactly (case-sensitive)

### Client-side variables not accessible

- Ensure `NEXT_PUBLIC_` prefix is used correctly
- Check variable is set in Vercel dashboard (not just GitHub)
- Verify deployment includes the variable (may need to redeploy)

## Next Steps

1. ✅ Sync all critical variables using Method 1 (Vercel Dashboard)
2. ✅ Verify variables are set correctly
3. ✅ Test deployment to ensure everything works
4. ✅ Document any custom variables specific to your setup

For complete list of all environment variables, see `docs/github-secrets-checklist.md`.
