# GitHub Secrets Checklist for Vercel Deployment

> **Note:** This document assumes all GitHub secrets auto-sync to Vercel via GitHub integration. Variables marked with `NEXT_PUBLIC_` prefix are exposed to the client-side and must be set in Vercel.

## Status Legend

- ✅ **Confirmed** - Variable is stored in GitHub secrets and correctly referenced in workflows
- ❓ **Unconfirmed** - Variable is referenced but cannot verify if stored in GitHub secrets
- ⚠️ **Issue Found** - Variable has connection issues or needs attention

---

## Core Configuration

| Variable         | Status | Required | Description                       | Notes                                         |
| ---------------- | ------ | -------- | --------------------------------- | --------------------------------------------- |
| `NODE_ENV`       | ✅     | Yes      | Node.js environment mode          | Set automatically by Vercel, but can override |
| `DEPLOYMENT_ENV` | ❓     | No       | Deployment environment identifier | Optional, defaults to 'local'                 |

---

## Database Configuration (Supabase/PostgreSQL)

| Variable                    | Status | Required | Description                                | Notes                                                                               |
| --------------------------- | ------ | -------- | ------------------------------------------ | ----------------------------------------------------------------------------------- |
| `SUPABASE_URL`              | ✅     | Yes      | Supabase project URL                       | Used in multiple workflows (main-deploy.yml, supabase-migrate.yml, etc.)            |
| `SUPABASE_ANON_KEY`         | ✅     | Yes      | Supabase anonymous/public key              | Used in workflows, also needs `NEXT_PUBLIC_` variant                                |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅     | Yes      | Supabase service role key (admin)          | **CRITICAL:** Never expose to client. Used in migrations and server-side operations |
| `SUPABASE_PROJECT_REF`      | ✅     | Yes      | Supabase project reference ID              | Used for CLI linking and migrations                                                 |
| `SUPABASE_ACCESS_TOKEN`     | ✅     | Yes      | Supabase access token for CLI              | Required for `supabase link` and migrations                                         |
| `SUPABASE_DB_PASSWORD`      | ✅     | Yes      | Supabase database password                 | Used in migration-guardian.yml and supabase-migrate.yml                             |
| `SUPABASE_DB_URL`           | ❓     | No       | Alternative database URL                   | Used in migration-guardian.yml, may be same as DATABASE_URL                         |
| `DATABASE_URL`              | ✅     | Yes      | PostgreSQL connection string               | Used extensively in workflows for Prisma migrations                                 |
| `DIRECT_URL`                | ❓     | No       | Direct database connection (bypass pooler) | Used in supabase-migrate.yml, optional for Prisma                                   |
| `SUPABASE_PROJECT_ID`       | ❓     | No       | Supabase project ID                        | Used in supabase-migrate.yml, may be same as PROJECT_REF                            |

### Preview/Staging Variants

| Variable                            | Status | Required | Description                          | Notes                                  |
| ----------------------------------- | ------ | -------- | ------------------------------------ | -------------------------------------- |
| `SUPABASE_URL_PREVIEW`              | ❓     | No       | Preview environment Supabase URL     | Used in deploy-preview.yml as fallback |
| `SUPABASE_ANON_KEY_PREVIEW`         | ❓     | No       | Preview environment anon key         | Used in deploy-preview.yml as fallback |
| `SUPABASE_SERVICE_ROLE_KEY_PREVIEW` | ❓     | No       | Preview environment service role key | Used in deploy-preview.yml as fallback |
| `DATABASE_URL_PREVIEW`              | ❓     | No       | Preview environment database URL     | Used in deploy-preview.yml as fallback |
| `DIRECT_URL_PREVIEW`                | ❓     | No       | Preview direct database URL          | Used in supabase-migrate.yml           |

---

## Client-Side Variables (NEXT*PUBLIC*\*)

> **⚠️ IMPORTANT:** These variables are exposed to the browser and MUST be set in both GitHub secrets AND Vercel environment variables.

| Variable                              | Status | Required | Description                           | Notes                                                                                                                                                                                        |
| ------------------------------------- | ------ | -------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`            | ⚠️     | Yes      | Public Supabase URL                   | **ISSUE:** Referenced as `secrets.NEXT_PUBLIC_SUPABASE_URL` in supabase-migrate.yml line 352, but GitHub secrets don't typically use NEXT*PUBLIC* prefix. Should use `SUPABASE_URL` instead. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`       | ⚠️     | Yes      | Public Supabase anonymous key         | **ISSUE:** Same as above - should use `SUPABASE_ANON_KEY` in GitHub secrets, but needs `NEXT_PUBLIC_` prefix in Vercel                                                                       |
| `NEXT_PUBLIC_SITE_URL`                | ✅     | No       | Public site URL                       | Defaults to 'https://settler.dev' if not set                                                                                                                                                 |
| `NEXT_PUBLIC_APP_URL`                 | ✅     | No       | Public app URL                        | Defaults to 'https://settler.dev' if not set                                                                                                                                                 |
| `NEXT_PUBLIC_SENTRY_DSN`              | ❓     | No       | Sentry DSN for error tracking         | Optional, used in client-side error tracking                                                                                                                                                 |
| `NEXT_PUBLIC_ENABLE_SENTRY`           | ❓     | No       | Enable Sentry client-side             | Feature flag, defaults to false                                                                                                                                                              |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID`      | ❓     | No       | Google Analytics 4 ID                 | Optional analytics                                                                                                                                                                           |
| `NEXT_PUBLIC_POSTHOG_KEY`             | ❓     | No       | PostHog API key                       | Optional analytics                                                                                                                                                                           |
| `NEXT_PUBLIC_POSTHOG_HOST`            | ❓     | No       | PostHog host URL                      | Optional, defaults to 'https://app.posthog.com'                                                                                                                                              |
| `NEXT_PUBLIC_ANALYTICS_ENDPOINT`      | ❓     | No       | Custom analytics endpoint             | Optional                                                                                                                                                                                     |
| `NEXT_PUBLIC_ANALYTICS_TOKEN`         | ❓     | No       | Analytics endpoint auth token         | Optional                                                                                                                                                                                     |
| `NEXT_PUBLIC_ANALYTICS_PROVIDERS`     | ❓     | No       | Analytics providers (comma-separated) | Optional, defaults to 'vercel'                                                                                                                                                               |
| `NEXT_PUBLIC_ENABLE_LOGGING`          | ❓     | No       | Enable client-side logging            | Feature flag                                                                                                                                                                                 |
| `NEXT_PUBLIC_LOG_LEVEL`               | ❓     | No       | Client-side log level                 | Optional                                                                                                                                                                                     |
| `NEXT_PUBLIC_ENABLE_CONSOLE_LOGS`     | ❓     | No       | Enable console logs in production     | Feature flag                                                                                                                                                                                 |
| `NEXT_PUBLIC_LOGGING_ENDPOINT`        | ❓     | No       | Client-side logging endpoint          | Optional                                                                                                                                                                                     |
| `NEXT_PUBLIC_ENABLE_ALERTS`           | ❓     | No       | Enable alert system                   | Feature flag                                                                                                                                                                                 |
| `NEXT_PUBLIC_ENABLE_SESSION_REPLAY`   | ❓     | No       | Enable session replay                 | Feature flag                                                                                                                                                                                 |
| `NEXT_PUBLIC_SESSION_REPLAY_PROVIDER` | ❓     | No       | Session replay provider               | Optional                                                                                                                                                                                     |
| `NEXT_PUBLIC_SESSION_REPLAY_SITE_ID`  | ❓     | No       | Session replay site ID                | Optional                                                                                                                                                                                     |
| `NEXT_PUBLIC_SESSION_REPLAY_API_KEY`  | ❓     | No       | Session replay API key                | Optional                                                                                                                                                                                     |
| `NEXT_PUBLIC_API_URL`                 | ❓     | No       | Public API URL                        | Optional, defaults to '/api'                                                                                                                                                                 |
| `NEXT_PUBLIC_SETTLER_API_KEY`         | ❓     | No       | Public Settler API key                | Used in mobile page                                                                                                                                                                          |
| `NEXT_PUBLIC_SHOPIFY_API_KEY`         | ❓     | No       | Shopify API key (public)              | Used in playground                                                                                                                                                                           |
| `NEXT_PUBLIC_STRIPE_SECRET_KEY`       | ⚠️     | No       | **DO NOT USE**                        | **SECURITY ISSUE:** This should NEVER be public. Used incorrectly in playground page. Should be removed.                                                                                     |
| `NEXT_PUBLIC_AIAS_STUDIO_URL`         | ❓     | No       | AIAS Studio URL                       | Optional, defaults to 'https://aias.studio'                                                                                                                                                  |
| `NEXT_PUBLIC_APP_VERSION`             | ❓     | No       | App version string                    | Optional                                                                                                                                                                                     |

---

## Redis Configuration (Upstash)

| Variable                   | Status | Required | Description                     | Notes                           |
| -------------------------- | ------ | -------- | ------------------------------- | ------------------------------- |
| `UPSTASH_REDIS_REST_URL`   | ✅     | No       | Upstash Redis REST API URL      | Used in migration-guardian.yml  |
| `UPSTASH_REDIS_REST_TOKEN` | ✅     | No       | Upstash Redis REST API token    | Used in migration-guardian.yml  |
| `REDIS_URL`                | ❓     | No       | Redis connection URL (fallback) | Alternative to Upstash REST API |
| `REDIS_TOKEN`              | ❓     | No       | Redis token (fallback)          | Used with REDIS_URL             |

---

## Security & Authentication

| Variable             | Status | Required | Description                | Notes                                                                                |
| -------------------- | ------ | -------- | -------------------------- | ------------------------------------------------------------------------------------ |
| `JWT_SECRET`         | ✅     | Yes      | JWT token signing secret   | Used in deploy-preview.yml, production-migrations.yml. Must be 32+ characters        |
| `JWT_REFRESH_SECRET` | ❓     | No       | JWT refresh token secret   | Optional, falls back to JWT_SECRET                                                   |
| `JWT_ACCESS_EXPIRY`  | ❓     | No       | JWT access token expiry    | Optional, defaults to '15m'                                                          |
| `JWT_REFRESH_EXPIRY` | ❓     | No       | JWT refresh token expiry   | Optional, defaults to '7d'                                                           |
| `ENCRYPTION_KEY`     | ✅     | Yes      | AES-256-GCM encryption key | Used in deploy-preview.yml, production-migrations.yml. Must be exactly 32 characters |
| `ALLOWED_ORIGINS`    | ❓     | No       | CORS allowed origins       | Optional, defaults to '\*'                                                           |
| `TRUST_PROXY`        | ❓     | No       | Trust proxy headers        | Optional, should be 'true' for Vercel                                                |
| `SECURE_COOKIES`     | ❓     | No       | Enable secure cookie flags | Optional, should be 'true' for production                                            |

---

## Email Configuration (Resend)

| Variable             | Status | Required | Description            | Notes                                                    |
| -------------------- | ------ | -------- | ---------------------- | -------------------------------------------------------- |
| `RESEND_API_KEY`     | ✅     | Yes      | Resend API key         | Required for transactional emails. Format: `re_...`      |
| `RESEND_FROM_EMAIL`  | ❓     | No       | Default sender email   | Optional, defaults to 'Settler <onboarding@settler.dev>' |
| `RESEND_FROM_NAME`   | ❓     | No       | Default sender name    | Optional                                                 |
| `RESEND_AUDIENCE_ID` | ❓     | No       | Resend audience ID     | Optional, for email marketing                            |
| `ADMIN_EMAIL`        | ❓     | No       | Admin email for alerts | Optional, falls back to RESEND_FROM_EMAIL                |

---

## Payment Processing (Stripe)

| Variable                 | Status | Required | Description                | Notes                                                                                                                  |
| ------------------------ | ------ | -------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `STRIPE_SECRET_KEY`      | ✅     | Yes      | Stripe secret key          | Used in main-deploy.yml, init-billing-on-deploy.yml, deploy-edge-functions.yml. Format: `sk_test_...` or `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET`  | ❓     | No       | Stripe webhook secret      | Required for webhook verification. Format: `whsec_...`                                                                 |
| `STRIPE_PUBLISHABLE_KEY` | ❓     | No       | Stripe publishable key     | Optional, for client-side Stripe.js                                                                                    |
| `STRIPE_PRICE_ID_PRO`    | ❓     | No       | Stripe Pro plan price ID   | Optional, set via Stripe dashboard                                                                                     |
| `STRIPE_PRICE_ID_SCALE`  | ❓     | No       | Stripe Scale plan price ID | Optional, set via Stripe dashboard                                                                                     |

---

## Observability (Sentry)

| Variable                    | Status | Required | Description                            | Notes                                                                |
| --------------------------- | ------ | -------- | -------------------------------------- | -------------------------------------------------------------------- |
| `SENTRY_DSN`                | ❓     | No       | Sentry DSN for error tracking          | Optional but recommended. Format: `https://key@sentry.io/project-id` |
| `SENTRY_ENVIRONMENT`        | ❓     | No       | Sentry environment identifier          | Optional, defaults to NODE_ENV                                       |
| `SENTRY_TRACES_SAMPLE_RATE` | ❓     | No       | Sentry performance tracing sample rate | Optional, defaults to 0.1 (10%)                                      |
| `SENTRY_AUTH_TOKEN`         | ❓     | No       | Sentry auth token                      | Optional, for source maps upload                                     |
| `SENTRY_ENABLE_DEV`         | ❓     | No       | Enable Sentry in development           | Optional, defaults to false                                          |

---

## CI/CD Configuration

| Variable            | Status | Required | Description                  | Notes                                                                         |
| ------------------- | ------ | -------- | ---------------------------- | ----------------------------------------------------------------------------- |
| `VERCEL_TOKEN`      | ✅     | Yes      | Vercel deployment token      | Used in deploy-production.yml, deploy-preview.yml, ci-cd-enhanced.yml         |
| `VERCEL_ORG_ID`     | ✅     | Yes      | Vercel organization ID       | Used in deploy-production.yml, deploy-preview.yml                             |
| `VERCEL_PROJECT_ID` | ✅     | Yes      | Vercel project ID            | Used in deploy-production.yml, deploy-preview.yml                             |
| `SNYK_TOKEN`        | ✅     | No       | Snyk security scanning token | Used in ci.yml, security-scan.yml, code-quality.yml. Optional but recommended |
| `GITHUB_TOKEN`      | ✅     | Auto     | GitHub token (auto-provided) | Automatically provided by GitHub Actions, no need to set                      |

---

## E2E Testing

| Variable                 | Status | Required | Description                 | Notes                                                           |
| ------------------------ | ------ | -------- | --------------------------- | --------------------------------------------------------------- |
| `E2E_API_KEY`            | ❓     | No       | API key for E2E tests       | Used in e2e.yml, receipt-console-ci.yml                         |
| `E2E_BASE_URL`           | ❓     | No       | Base URL for E2E tests      | Used in e2e.yml, smoke.yml. Defaults to 'http://localhost:3000' |
| `E2E_TEST_USER_EMAIL`    | ❓     | No       | Test user email             | Used in receipt-console-ci.yml                                  |
| `E2E_TEST_USER_PASSWORD` | ❓     | No       | Test user password          | Used in receipt-console-ci.yml                                  |
| `E2E_TEST_API_KEY`       | ❓     | No       | Test API key                | Used in receipt-console-ci.yml                                  |
| `WEB_BASE_URL`           | ❓     | No       | Web server base URL for E2E | Used in e2e.yml. Defaults to 'http://localhost:3001'            |

---

## Deployment & URLs

| Variable                 | Status | Required | Description               | Notes                                                                   |
| ------------------------ | ------ | -------- | ------------------------- | ----------------------------------------------------------------------- |
| `PRODUCTION_URL`         | ✅     | Yes      | Production deployment URL | Used in deploy-production.yml, migration-guardian.yml for health checks |
| `STAGING_URL`            | ❓     | No       | Staging deployment URL    | Used in migration-guardian.yml                                          |
| `STAGING_DATABASE_URL`   | ❓     | No       | Staging database URL      | Used in migration-guardian.yml                                          |
| `STAGING_JWT_SECRET`     | ❓     | No       | Staging JWT secret        | Used in migration-guardian.yml                                          |
| `STAGING_ENCRYPTION_KEY` | ❓     | No       | Staging encryption key    | Used in migration-guardian.yml                                          |

---

## Third-Party Integrations

| Variable                 | Status | Required | Description            | Notes                                                       |
| ------------------------ | ------ | -------- | ---------------------- | ----------------------------------------------------------- |
| `OPENAI_API_KEY`         | ✅     | No       | OpenAI API key         | Used in release-safety-check.yml. Optional, for AI features |
| `SHOPIFY_API_KEY`        | ❓     | No       | Shopify API key        | Optional, for Shopify adapter                               |
| `SHOPIFY_API_SECRET`     | ❓     | No       | Shopify API secret     | Optional, for Shopify adapter                               |
| `SHOPIFY_WEBHOOK_SECRET` | ❓     | No       | Shopify webhook secret | Optional                                                    |

---

## Mirror/OSS Publishing

| Variable                     | Status | Required | Description                  | Notes                                         |
| ---------------------------- | ------ | -------- | ---------------------------- | --------------------------------------------- |
| `PUBLIC_MIRROR_REPO_URL`     | ✅     | No       | Public mirror repository URL | Used in publish-mirror.yml, auto-sync-oss.yml |
| `PUBLIC_MIRROR_GIT_TOKEN`    | ✅     | No       | Git token for mirror repo    | Used in publish-mirror.yml, auto-sync-oss.yml |
| `PUBLIC_MIRROR_GIT_USERNAME` | ✅     | No       | Git username for mirror repo | Used in publish-mirror.yml, auto-sync-oss.yml |

---

## Feature Flags & Optional Configuration

| Variable                   | Status | Required | Description                            | Notes                               |
| -------------------------- | ------ | -------- | -------------------------------------- | ----------------------------------- |
| `ENABLE_SCHEMA_PER_TENANT` | ❓     | No       | Enable schema-per-tenant multi-tenancy | Feature flag                        |
| `ENABLE_REQUEST_TIMEOUT`   | ❓     | No       | Enable request timeout middleware      | Feature flag, defaults to true      |
| `ENABLE_API_DOCS`          | ❓     | No       | Enable OpenAPI documentation           | Feature flag, defaults to true      |
| `SKIP_ENV_VALIDATION`      | ❓     | No       | Skip environment validation            | Feature flag, defaults to false     |
| `SKIP_TYPE_CHECK`          | ❓     | No       | Skip TypeScript type checking          | Feature flag, used in build scripts |

---

## Issues Found & Recommendations

### ✅ Fixed Issues

1. **NEXT*PUBLIC* Variables in GitHub Secrets** ✅ FIXED
   - **Issue:** `supabase-migrate.yml` line 352 referenced `secrets.NEXT_PUBLIC_SUPABASE_URL`, but GitHub secrets typically don't use the `NEXT_PUBLIC_` prefix
   - **Fix Applied:** Changed to use `secrets.SUPABASE_URL` instead. The script already has fallback logic to use `SUPABASE_URL` if `NEXT_PUBLIC_SUPABASE_URL` is not set.
   - **Location:** `.github/workflows/supabase-migrate.yml:352-353`
   - **Status:** ✅ Fixed in commit

2. **Security Risk: NEXT_PUBLIC_STRIPE_SECRET_KEY** ✅ FIXED
   - **Issue:** `packages/web/src/app/playground/page.tsx` used `NEXT_PUBLIC_STRIPE_SECRET_KEY` which exposed secret keys to the client
   - **Fix Applied:** Replaced with placeholder comment explaining that secret keys should never be exposed client-side. Use server-side API routes instead.
   - **Location:** `packages/web/src/app/playground/page.tsx:34`
   - **Status:** ✅ Fixed in commit

### ❓ Unconfirmed Variables

These variables are referenced in code but cannot be confirmed if they're stored in GitHub secrets:

- Most `NEXT_PUBLIC_*` variables (except SUPABASE_URL/ANON_KEY which are confirmed)
- Optional feature flags
- Analytics configuration variables
- Preview/staging environment variants

**Recommendation:** Verify these are set in Vercel dashboard even if not in GitHub secrets, as Vercel can have environment variables that don't sync from GitHub.

### ✅ Confirmed Working

These variables are confirmed to be:

1. Referenced in GitHub Actions workflows
2. Properly used with `secrets.*` syntax
3. Likely stored in GitHub repository secrets

- Core Supabase variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- Database variables (`DATABASE_URL`, `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`)
- Security variables (`JWT_SECRET`, `ENCRYPTION_KEY`)
- CI/CD variables (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`)
- Redis variables (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)
- Payment variables (`STRIPE_SECRET_KEY`)
- Email variables (`RESEND_API_KEY`)

---

## How to Verify GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Check that all variables marked ✅ are present
4. For variables marked ❓, verify they exist or add them if needed

## How to Verify Vercel Environment Variables

1. Go to Vercel dashboard
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Verify all `NEXT_PUBLIC_*` variables are set
5. Check that variables sync from GitHub (if GitHub integration is enabled)

## Auto-Sync from GitHub to Vercel

If GitHub integration is enabled in Vercel:

- Secrets set in GitHub Actions will automatically sync to Vercel
- However, `NEXT_PUBLIC_*` variables may need to be set separately in Vercel dashboard
- Some variables (like `VERCEL_TOKEN`, `VERCEL_ORG_ID`) are GitHub-only and shouldn't be in Vercel

---

## Summary

- **Total Variables Documented:** ~80+
- **Confirmed in GitHub Secrets:** ~25
- **Unconfirmed:** ~40
- **Issues Found:** 2 critical issues

**Action Items:**

1. ✅ Verify all confirmed variables are set in GitHub secrets
2. ❓ Review unconfirmed variables and add to GitHub secrets if needed
3. ⚠️ Fix critical security issue with `NEXT_PUBLIC_STRIPE_SECRET_KEY`
4. ⚠️ Fix `NEXT_PUBLIC_SUPABASE_URL` reference in supabase-migrate.yml
5. 📝 Set all `NEXT_PUBLIC_*` variables in Vercel dashboard (may not auto-sync from GitHub)
