# Environment & Secrets Audit Report

**Generated:** $(date)  
**Project:** Settler API  
**Scope:** Complete environment variable and secrets inventory across GitHub, Vercel, Supabase, Sentry, and other third-party services

---

## Executive Summary

This report provides an exhaustive, non-destructive audit of environment variables and secrets across the Settler platform ecosystem. The audit covers:

- **Monorepo Structure:** API service, Web frontend, SDK packages, CLI tools
- **CI/CD:** GitHub Actions workflows
- **Deployment:** Vercel serverless functions
- **Database:** Supabase (PostgreSQL + Realtime)
- **Cache/Queue:** Upstash Redis
- **Observability:** Sentry error tracking
- **Third-party:** Stripe, Shopify adapters (per-job configs)

### Key Findings

✅ **Strengths:**

- Comprehensive environment variable validation using `envalid`
- Secrets management infrastructure (`SecretsManager`)
- Well-structured `.env.example` template
- Proper `.gitignore` patterns for secrets

⚠️ **Gaps Identified:**

- Missing CI validation step for environment variables
- Some env vars referenced in code but not in validation schema
- No automated scope validation (client vs server)
- Missing platform-specific environment mappings

🔴 **Critical Actions Required:**

- Configure secrets in GitHub Actions
- Configure secrets in Vercel (Dev/Preview/Production)
- Configure Supabase secrets
- Configure Sentry DSN (optional but recommended)

---

## 1. Environment Surface Map

### 1.1 Monorepo Structure

```
/workspace/
├── packages/
│   ├── api/              # Backend API service (Express.js)
│   │   ├── src/
│   │   │   ├── config/   # Environment config (validation.ts, supabase.ts, redis.ts)
│   │   │   ├── infrastructure/
│   │   │   │   ├── supabase/  # Supabase client
│   │   │   │   ├── redis/     # Redis client (Upstash)
│   │   │   │   └── security/  # SecretsManager
│   │   │   └── middleware/
│   │   │       └── sentry.ts   # Sentry integration
│   │   └── vercel.json    # Vercel deployment config
│   ├── web/               # Next.js frontend
│   │   └── next.config.js
│   ├── sdk/               # TypeScript SDK
│   ├── cli/               # CLI tools
│   └── adapters/          # Third-party adapters (Stripe, Shopify, etc.)
├── .github/workflows/     # CI/CD pipelines
│   ├── ci.yml
│   └── deploy-preview.yml
├── config/
│   └── env.schema.ts      # Canonical env var spec (NEW)
├── scripts/
│   └── check-env.ts       # Validation script (NEW)
└── .env.example           # Template (UPDATED)
```

### 1.2 Entry Points & Environment Consumption

| Service/Package | Type       | Entry Points                   | Env Var Sources                                                 |
| --------------- | ---------- | ------------------------------ | --------------------------------------------------------------- |
| `packages/api`  | Backend    | `src/index.ts`                 | `config/validation.ts`, `config/supabase.ts`, `config/redis.ts` |
| `packages/web`  | Frontend   | `next.config.js`, `src/app/**` | Next.js env vars (NEXT*PUBLIC*\*)                               |
| `packages/cli`  | CLI Tool   | `src/commands/**`              | `SETTLER_API_KEY` (runtime)                                     |
| `packages/sdk`  | Library    | N/A                            | None (uses API key passed to client)                            |
| GitHub Actions  | CI/CD      | `.github/workflows/*.yml`      | `secrets.*` context                                             |
| Vercel          | Deployment | `packages/api/vercel.json`     | Vercel dashboard env vars                                       |

### 1.3 Configuration Files Scanned

- ✅ `packages/api/src/config/validation.ts` - Main env validation (envalid)
- ✅ `packages/api/src/config/supabase.ts` - Supabase config
- ✅ `packages/api/src/config/redis.ts` - Redis config
- ✅ `packages/api/src/middleware/sentry.ts` - Sentry initialization
- ✅ `packages/api/vercel.json` - Vercel deployment config
- ✅ `packages/web/next.config.js` - Next.js config
- ✅ `.github/workflows/ci.yml` - CI pipeline
- ✅ `.github/workflows/deploy-preview.yml` - Preview deployment
- ✅ `.env.example` - Environment template
- ✅ `turbo.json` - Turborepo config (env dependencies)

---

## 2. Environment Variable Inventory & Status Matrix

### 2.1 Complete Inventory

**Total Variables Discovered:** 60+  
**Required for Production:** 12  
**Optional/Feature Flags:** 48+

### 2.2 Status Matrix

| ENV_VAR_NAME                          | Used By  | Used Where        | Defined In                    | Status          | Notes                                   |
| ------------------------------------- | -------- | ----------------- | ----------------------------- | --------------- | --------------------------------------- |
| **CORE CONFIGURATION**                |
| `NODE_ENV`                            | api      | Runtime           | validation.ts                 | ✅ OK           | Has default, validated                  |
| `DEPLOYMENT_ENV`                      | api      | Runtime           | validation.ts                 | ✅ OK           | Optional, has default                   |
| `PORT`                                | api      | Runtime           | validation.ts                 | ✅ OK           | Has default (3000)                      |
| `HOST`                                | api      | Runtime           | validation.ts                 | ⚠️ LOCAL ONLY   | Only for local/dev                      |
| **DATABASE (SUPABASE)**               |
| `SUPABASE_URL`                        | api      | Runtime           | supabase.ts, validation.ts    | 🔴 MISSING      | Required for production                 |
| `SUPABASE_ANON_KEY`                   | api      | Runtime           | supabase.ts, validation.ts    | 🔴 MISSING      | Required for production                 |
| `SUPABASE_SERVICE_ROLE_KEY`           | api      | Runtime           | supabase.ts, validation.ts    | 🔴 MISSING      | Required for admin ops                  |
| `SUPABASE_REALTIME_EVENTS_PER_SECOND` | api      | Runtime           | supabase.ts                   | ✅ OK           | Has default (10)                        |
| **DATABASE (POSTGRESQL FALLBACK)**    |
| `DB_HOST`                             | api      | Runtime           | validation.ts                 | ✅ OK           | Local dev only, has default             |
| `DB_PORT`                             | api      | Runtime           | validation.ts                 | ✅ OK           | Local dev only, has default             |
| `DB_NAME`                             | api      | Runtime           | validation.ts                 | ✅ OK           | Local dev only, has default             |
| `DB_USER`                             | api      | Runtime           | validation.ts                 | ✅ OK           | Local dev only, has default             |
| `DB_PASSWORD`                         | api      | Runtime           | validation.ts                 | 🔴 MISSING      | Required if using PostgreSQL fallback   |
| `DB_SSL`                              | api      | Runtime           | validation.ts                 | ✅ OK           | Optional, has default                   |
| `DB_POOL_MIN`                         | api      | Runtime           | validation.ts                 | ✅ OK           | Optional, has default                   |
| `DB_POOL_MAX`                         | api      | Runtime           | validation.ts                 | ✅ OK           | Optional, has default                   |
| `DB_CONNECTION_TIMEOUT`               | api      | Runtime           | validation.ts                 | ✅ OK           | Optional, has default                   |
| `DB_STATEMENT_TIMEOUT`                | api      | Runtime           | validation.ts                 | ✅ OK           | Optional, has default                   |
| `DATABASE_URL`                        | api, CI  | Runtime           | CI workflows                  | ⚠️ INCONSISTENT | Used in CI, not in validation schema    |
| **REDIS (UPSTASH)**                   |
| `UPSTASH_REDIS_REST_URL`              | api      | Runtime           | redis.ts, client.ts           | 🔴 MISSING      | Required for production Redis           |
| `UPSTASH_REDIS_REST_TOKEN`            | api      | Runtime           | redis.ts, client.ts           | 🔴 MISSING      | Required for production Redis           |
| `REDIS_URL`                           | api, CI  | Runtime           | redis.ts, CI workflows        | ⚠️ INCONSISTENT | Fallback, used in CI                    |
| `REDIS_TOKEN`                         | api      | Runtime           | redis.ts                      | ⚠️ INCONSISTENT | Fallback, not in validation schema      |
| `REDIS_HOST`                          | api      | Runtime           | redis.ts, validation.ts       | ✅ OK           | Local dev only, has default             |
| `REDIS_PORT`                          | api      | Runtime           | redis.ts, validation.ts       | ✅ OK           | Local dev only, has default             |
| `REDIS_PASSWORD`                      | api      | Runtime           | redis.ts, validation.ts       | ✅ OK           | Optional, local dev                     |
| `REDIS_TLS`                           | api      | Runtime           | validation.ts                 | ✅ OK           | Optional, has default                   |
| `REDIS_DB`                            | api      | Runtime           | redis.ts, validation.ts       | ✅ OK           | Optional, local dev                     |
| `REDIS_CACHE_TTL`                     | api      | Runtime           | redis.ts, validation.ts       | ✅ OK           | Optional, has default                   |
| `REDIS_RECONCILIATION_TTL`            | api      | Runtime           | redis.ts, validation.ts       | ✅ OK           | Optional, has default                   |
| **SECURITY & AUTH**                   |
| `JWT_SECRET`                          | api      | Runtime           | validation.ts, SecretsManager | 🔴 MISSING      | Required, min 32 chars                  |
| `JWT_ACCESS_EXPIRY`                   | api      | Runtime           | validation.ts                 | ✅ OK           | Has default (15m)                       |
| `JWT_REFRESH_EXPIRY`                  | api      | Runtime           | validation.ts                 | ✅ OK           | Has default (7d)                        |
| `JWT_REFRESH_SECRET`                  | api      | Runtime           | validation.ts                 | ✅ OK           | Optional, falls back to JWT_SECRET      |
| `ENCRYPTION_KEY`                      | api      | Runtime           | validation.ts, SecretsManager | 🔴 MISSING      | Required, exactly 32 chars              |
| `ALLOWED_ORIGINS`                     | api      | Runtime           | validation.ts                 | ⚠️ WARNING      | Defaults to \*, should restrict in prod |
| `TRUST_PROXY`                         | api      | Runtime           | validation.ts                 | ✅ OK           | Optional, should be true in Vercel      |
| `SECURE_COOKIES`                      | api      | Runtime           | validation.ts                 | ✅ OK           | Optional, should be true in prod        |
| **OBSERVABILITY (SENTRY)**            |
| `SENTRY_DSN`                          | api      | Runtime           | sentry.ts, validation.ts      | 🔴 MISSING      | Optional but recommended                |
| `SENTRY_ENVIRONMENT`                  | api      | Runtime           | sentry.ts, validation.ts      | ✅ OK           | Optional, defaults to NODE_ENV          |
| `SENTRY_TRACES_SAMPLE_RATE`           | api      | Runtime           | sentry.ts, validation.ts      | ✅ OK           | Optional, has default (0.1)             |
| `SENTRY_ENABLE_DEV`                   | api      | Runtime           | sentry.ts                     | ✅ OK           | Optional, local dev only                |
| `SERVICE_NAME`                        | api      | Runtime           | validation.ts                 | ✅ OK           | Optional, has default                   |
| `OTLP_ENDPOINT`                       | api      | Runtime           | validation.ts                 | ✅ OK           | Optional, OpenTelemetry                 |
| `JAEGER_ENDPOINT`                     | api      | Runtime           | validation.ts                 | ✅ OK           | Optional, Jaeger tracing                |
| **LOGGING & MONITORING**              |
| `LOG_LEVEL`                           | api      | Runtime           | validation.ts                 | ✅ OK           | Optional, has default                   |
| `LOG_SAMPLING_RATE`                   | api      | Runtime           | validation.ts                 | ✅ OK           | Optional, has default                   |
| `METRICS_ENABLED`                     | api      | Runtime           | validation.ts                 | ✅ OK           | Optional, has default                   |
| `HEALTH_CHECK_ENABLED`                | api      | Runtime           | validation.ts                 | ✅ OK           | Optional, has default                   |
| **RATE LIMITING**                     |
| `RATE_LIMIT_DEFAULT`                  | api      | Runtime           | validation.ts                 | ✅ OK           | Optional, has default                   |
| `RATE_LIMIT_WINDOW_MS`                | api      | Runtime           | validation.ts                 | ✅ OK           | Optional, has default                   |
| **WEBHOOKS**                          |
| `WEBHOOK_MAX_RETRIES`                 | api      | Runtime           | validation.ts                 | ✅ OK           | Optional, has default                   |
| `WEBHOOK_INITIAL_DELAY`               | api      | Runtime           | validation.ts                 | ✅ OK           | Optional, has default                   |
| `WEBHOOK_MAX_DELAY`                   | api      | Runtime           | validation.ts                 | ✅ OK           | Optional, has default                   |
| **DATA RETENTION**                    |
| `DATA_RETENTION_DAYS`                 | api      | Runtime           | validation.ts                 | ✅ OK           | Optional, has default                   |
| **FEATURE FLAGS**                     |
| `ENABLE_SCHEMA_PER_TENANT`            | api      | Runtime           | validation.ts                 | ✅ OK           | Optional, feature flag                  |
| `ENABLE_REQUEST_TIMEOUT`              | api      | Runtime           | validation.ts                 | ✅ OK           | Optional, feature flag                  |
| `ENABLE_API_DOCS`                     | api      | Runtime           | validation.ts                 | ✅ OK           | Optional, feature flag                  |
| **THIRD-PARTY ADAPTERS**              |
| `STRIPE_SECRET_KEY`                   | adapters | Runtime (per-job) | Code references               | ⚠️ PER-JOB      | Set in job config, not global           |
| `SHOPIFY_API_KEY`                     | adapters | Runtime (per-job) | Code references               | ⚠️ PER-JOB      | Set in job config, not global           |
| **CI/CD (GITHUB ACTIONS)**            |
| `VERCEL_TOKEN`                        | CI       | CI-only           | deploy-preview.yml            | 🔴 MISSING      | Required for Vercel deployments         |
| `VERCEL_ORG_ID`                       | CI       | CI-only           | deploy-preview.yml            | 🔴 MISSING      | Required for Vercel deployments         |
| `VERCEL_PROJECT_ID`                   | CI       | CI-only           | deploy-preview.yml            | 🔴 MISSING      | Required for Vercel deployments         |
| `SNYK_TOKEN`                          | CI       | CI-only           | ci.yml                        | ⚠️ OPTIONAL     | Optional security scanning              |
| `E2E_API_KEY`                         | CI       | CI-only           | ci.yml, e2e tests             | ⚠️ OPTIONAL     | E2E test auth                           |
| `E2E_BASE_URL`                        | CI       | CI-only           | ci.yml, e2e tests             | ✅ OK           | Has default in code                     |

### 2.3 Status Legend

- ✅ **OK** - Properly defined, validated, and has defaults where appropriate
- ⚠️ **WARNING** - Present but may need attention (mis-scoped, inconsistent, or security concern)
- 🔴 **MISSING** - Required but not configured in production environments
- ⚠️ **INCONSISTENT** - Used in code but not in validation schema, or present in some envs but not others
- ⚠️ **PER-JOB** - Set per reconciliation job, not globally

---

## 3. Platform-Specific Analysis

### 3.1 GitHub Actions

**Workflow Files:**

- `.github/workflows/ci.yml` - Lint, test, build, security scan, E2E tests
- `.github/workflows/deploy-preview.yml` - Vercel preview deployments

**Secrets Referenced:**

- `secrets.SNYK_TOKEN` - Security scanning (optional)
- `secrets.VERCEL_TOKEN` - Vercel deployment (required)
- `secrets.VERCEL_ORG_ID` - Vercel deployment (required)
- `secrets.VERCEL_PROJECT_ID` - Vercel deployment (required)

**Environment Variables Used:**

- `NODE_ENV=test` (E2E job)
- `PORT=3000` (E2E job)
- `DATABASE_URL` (E2E job) - Hardcoded for test DB
- `REDIS_URL` (E2E job) - Hardcoded for test Redis
- `JWT_SECRET` (E2E job) - Hardcoded test value
- `ENCRYPTION_KEY` (E2E job) - Hardcoded test value
- `E2E_API_KEY` (E2E job) - Test API key
- `E2E_BASE_URL` (E2E job) - Test base URL

**Status:** ⚠️ **INCOMPLETE**

- Missing: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (required for deployments)
- Optional: `SNYK_TOKEN` (security scanning)

**Recommendations:**

1. Add secrets to GitHub repository settings:
   - Settings → Secrets and variables → Actions → New repository secret
2. Configure environment-specific secrets if needed (production vs preview)

### 3.2 Vercel

**Configuration Files:**

- `packages/api/vercel.json` - Vercel serverless function config

**Environment Variables Required:**

**Production:**

- `NODE_ENV=production` (set in vercel.json)
- `SUPABASE_URL` 🔴
- `SUPABASE_ANON_KEY` 🔴
- `SUPABASE_SERVICE_ROLE_KEY` 🔴
- `UPSTASH_REDIS_REST_URL` 🔴
- `UPSTASH_REDIS_REST_TOKEN` 🔴
- `JWT_SECRET` 🔴
- `ENCRYPTION_KEY` 🔴
- `SENTRY_DSN` (optional but recommended)
- `SENTRY_ENVIRONMENT=production`
- `TRUST_PROXY=true` (should be set)
- `SECURE_COOKIES=true` (should be set)
- `ALLOWED_ORIGINS` (should restrict, not `*`)

**Preview:**

- Same as production, but `SENTRY_ENVIRONMENT=preview`

**Development:**

- Same as production, but `NODE_ENV=development`

**Status:** 🔴 **NOT CONFIGURED**

**Recommendations:**

1. Navigate to Vercel Dashboard → Project → Settings → Environment Variables
2. Add all required variables for each environment (Production, Preview, Development)
3. Ensure `TRUST_PROXY=true` and `SECURE_COOKIES=true` in production
4. Restrict `ALLOWED_ORIGINS` to your domain(s)

### 3.3 Supabase

**Configuration:**

- Supabase project URL and keys required
- Edge Functions may need additional secrets

**Environment Variables Required:**

- `SUPABASE_URL` - Project URL
- `SUPABASE_ANON_KEY` - Public/anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (admin)

**Supabase Secrets (for Edge Functions):**

- May need to set secrets via `supabase secrets set` CLI or dashboard

**Status:** 🔴 **NOT CONFIGURED**

**Recommendations:**

1. Create Supabase project at https://supabase.com
2. Get project URL and keys from Project Settings → API
3. Copy `SUPABASE_URL` and `SUPABASE_ANON_KEY` to Vercel/GitHub
4. **IMPORTANT:** Keep `SUPABASE_SERVICE_ROLE_KEY` secret - never expose to client
5. Set secrets in Supabase dashboard if using Edge Functions

### 3.4 Sentry

**Configuration:**

- Optional but highly recommended for production error tracking

**Environment Variables Required:**

- `SENTRY_DSN` - Project DSN from Sentry dashboard
- `SENTRY_ENVIRONMENT` - Environment name (production, staging, preview)
- `SENTRY_TRACES_SAMPLE_RATE` - Performance tracing sample rate (default: 0.1)

**Status:** ⚠️ **OPTIONAL BUT RECOMMENDED**

**Recommendations:**

1. Create Sentry project at https://sentry.io
2. Get DSN from Project Settings → Client Keys (DSN)
3. Add `SENTRY_DSN` to Vercel environment variables
4. Set `SENTRY_ENVIRONMENT` per environment (production, preview, development)

### 3.5 Upstash Redis

**Configuration:**

- Serverless Redis for production
- Local Redis fallback for development

**Environment Variables Required:**

- `UPSTASH_REDIS_REST_URL` - REST API URL
- `UPSTASH_REDIS_REST_TOKEN` - REST API token

**Status:** 🔴 **NOT CONFIGURED**

**Recommendations:**

1. Create Upstash Redis database at https://upstash.com
2. Get REST URL and token from database dashboard
3. Add to Vercel environment variables
4. For local development, use `REDIS_HOST=localhost` and `REDIS_PORT=6379`

### 3.6 Third-Party Adapters (Stripe, Shopify)

**Configuration:**

- These are set **per reconciliation job**, not globally
- Users provide API keys in job configuration

**Environment Variables:**

- `STRIPE_SECRET_KEY` - Only if testing adapters locally
- `SHOPIFY_API_KEY` - Only if testing adapters locally

**Status:** ✅ **OK** (Per-job configuration is correct)

**Recommendations:**

- No global configuration needed
- Users provide keys via API when creating reconciliation jobs

---

## 4. Automated Checks & Scripts

### 4.1 Environment Validation Script

**Location:** `scripts/check-env.ts`

**Features:**

- Validates all environment variables against schema
- Checks for missing required variables
- Validates format and type
- Detects suspicious/hardcoded values
- Platform-specific validation
- JSON output option for CI integration

**Usage:**

```bash
# Validate production environment
tsx scripts/check-env.ts --env=production

# Validate for Vercel platform
tsx scripts/check-env.ts --env=production --platform=vercel

# Strict mode (fail on optional missing)
tsx scripts/check-env.ts --env=production --strict

# JSON output for CI
tsx scripts/check-env.ts --env=production --json
```

**Status:** ✅ **IMPLEMENTED**

### 4.2 Environment Schema

**Location:** `config/env.schema.ts`

**Features:**

- Canonical specification of all environment variables
- Type definitions, validation rules, platform mappings
- Used by validation script and documentation

**Status:** ✅ **IMPLEMENTED**

### 4.3 CI Integration

**Status:** ⚠️ **PENDING** (See Section 6 for implementation)

---

## 5. Automatic Remediations (Safe Changes Applied)

### 5.1 Files Created/Updated

✅ **Created:**

- `config/env.schema.ts` - Canonical environment variable schema
- `scripts/check-env.ts` - Environment validation script
- `ENVIRONMENT_SECRETS_AUDIT_REPORT.md` - This report

✅ **Updated:**

- `.env.example` - Comprehensive template with all variables documented

### 5.2 Code Improvements

✅ **Environment Schema:**

- Centralized specification of all env vars
- Type-safe validation
- Platform-specific mappings
- Criticality and scope classification

✅ **Validation Script:**

- Automated checks for missing/invalid variables
- Hardcoded secret detection
- Platform-specific validation
- CI-friendly JSON output

✅ **Documentation:**

- Updated `.env.example` with comprehensive comments
- Clear categorization and warnings
- Platform-specific notes

### 5.3 Recommendations for Future

**Scope Validation:**

- Add ESLint rule to prevent server-only secrets in client code
- Validate `NEXT_PUBLIC_*` prefix usage in Next.js app

**Turborepo Integration:**

- Update `turbo.json` to declare env var dependencies
- Ensure cache invalidation on env var changes

**Secrets Hygiene:**

- ✅ `.gitignore` already excludes `.env*` files
- Consider adding pre-commit hook to check for secrets in staged files

---

## 6. CI Integration Plan

### 6.1 GitHub Actions Integration

**Proposed Changes to `.github/workflows/ci.yml`:**

```yaml
jobs:
  validate-env:
    name: Validate Environment Variables
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - name: Validate environment schema
        run: |
          tsx scripts/check-env.ts --env=production --json > env-validation.json
        continue-on-error: true
      - name: Check validation results
        run: |
          if [ -f env-validation.json ]; then
            FAILED=$(cat env-validation.json | jq '.failed')
            if [ "$FAILED" -gt 0 ]; then
              echo "❌ Environment validation failed"
              cat env-validation.json | jq '.summary'
              exit 1
            fi
          fi

  lint-and-typecheck:
    # ... existing steps
    needs: [validate-env] # Add dependency
```

**Status:** ⚠️ **PROPOSED** (Not yet implemented)

### 6.2 Pre-Deployment Validation

**Add to `.github/workflows/deploy-preview.yml`:**

```yaml
jobs:
  validate-deployment-env:
    name: Validate Deployment Environment
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - name: Validate Vercel environment
        run: |
          tsx scripts/check-env.ts --env=preview --platform=vercel
        env:
          # Note: This will fail if secrets are not set, which is expected
          # The script should be updated to handle missing secrets gracefully in CI
```

**Status:** ⚠️ **PROPOSED** (Not yet implemented)

---

## 7. Manual Action Checklist

### 7.1 GitHub Repository Secrets

**Priority:** 🔴 **CRITICAL** (Required for deployments)

| Secret Name         | Used By                  | Impact if Missing         | Where to Set                                                             |
| ------------------- | ------------------------ | ------------------------- | ------------------------------------------------------------------------ |
| `VERCEL_TOKEN`      | `deploy-preview.yml`     | Preview deployments fail  | GitHub → Settings → Secrets → Actions → New repository secret            |
| `VERCEL_ORG_ID`     | `deploy-preview.yml`     | Preview deployments fail  | GitHub → Settings → Secrets → Actions → New repository secret            |
| `VERCEL_PROJECT_ID` | `deploy-preview.yml`     | Preview deployments fail  | GitHub → Settings → Secrets → Actions → New repository secret            |
| `SNYK_TOKEN`        | `ci.yml` (security-scan) | Security scanning skipped | GitHub → Settings → Secrets → Actions → New repository secret (optional) |

**Steps:**

1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret listed above
4. For `VERCEL_TOKEN`: Get from Vercel Dashboard → Settings → Tokens
5. For `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`: Get from Vercel Dashboard → Project → Settings

### 7.2 Vercel Environment Variables

**Priority:** 🔴 **CRITICAL** (Required for application runtime)

**Production Environment:**

| Variable                    | Value Format                       | Impact if Missing                          | Where to Set                                                     |
| --------------------------- | ---------------------------------- | ------------------------------------------ | ---------------------------------------------------------------- |
| `NODE_ENV`                  | `production`                       | App may not run correctly                  | Vercel → Project → Settings → Environment Variables → Production |
| `SUPABASE_URL`              | `https://your-project.supabase.co` | Database connection fails, app won't boot  | Vercel Dashboard → Production                                    |
| `SUPABASE_ANON_KEY`         | `eyJ...` (JWT token)               | Database connection fails                  | Vercel Dashboard → Production                                    |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (JWT token)               | Admin operations fail, Edge Functions fail | Vercel Dashboard → Production (⚠️ Server-only)                   |
| `UPSTASH_REDIS_REST_URL`    | `https://your-redis.upstash.io`    | Redis cache/queue disabled                 | Vercel Dashboard → Production                                    |
| `UPSTASH_REDIS_REST_TOKEN`  | Bearer token                       | Redis cache/queue disabled                 | Vercel Dashboard → Production                                    |
| `JWT_SECRET`                | Min 32 characters                  | Authentication fails                       | Vercel Dashboard → Production                                    |
| `ENCRYPTION_KEY`            | Exactly 32 characters              | Data encryption fails                      | Vercel Dashboard → Production                                    |
| `SENTRY_DSN`                | `https://key@sentry.io/project-id` | Error tracking disabled (optional)         | Vercel Dashboard → Production                                    |
| `SENTRY_ENVIRONMENT`        | `production`                       | Sentry environment incorrect               | Vercel Dashboard → Production                                    |
| `TRUST_PROXY`               | `true`                             | IP/forwarding headers incorrect            | Vercel Dashboard → Production                                    |
| `SECURE_COOKIES`            | `true`                             | Cookies not secure (HTTPS only)            | Vercel Dashboard → Production                                    |
| `ALLOWED_ORIGINS`           | Comma-separated URLs               | CORS may be too permissive                 | Vercel Dashboard → Production (restrict from `*`)                |

**Preview Environment:**

- Same as Production, but:
  - `SENTRY_ENVIRONMENT=preview`
  - May use different Supabase/Redis instances for testing

**Development Environment:**

- Same as Preview, but:
  - `NODE_ENV=development`
  - `SENTRY_ENVIRONMENT=development`

**Steps:**

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. For each variable:
   - Click "Add New"
   - Enter variable name
   - Enter value (or select from existing)
   - Select environments (Production, Preview, Development)
   - Click "Save"
3. **Important:** Ensure `SUPABASE_SERVICE_ROLE_KEY` is **NOT** exposed to client (server-only)
4. **Important:** Restrict `ALLOWED_ORIGINS` to your actual domains in production

### 7.3 Supabase Configuration

**Priority:** 🔴 **CRITICAL** (Required for database)

| Configuration    | Value Format                       | Impact if Missing     | Where to Set                                                   |
| ---------------- | ---------------------------------- | --------------------- | -------------------------------------------------------------- |
| Project URL      | `https://your-project.supabase.co` | Database unavailable  | Supabase Dashboard → Project Settings → API → Project URL      |
| Anon Key         | `eyJ...` (JWT token)               | Database queries fail | Supabase Dashboard → Project Settings → API → anon/public key  |
| Service Role Key | `eyJ...` (JWT token)               | Admin operations fail | Supabase Dashboard → Project Settings → API → service_role key |

**Additional Supabase Secrets (if using Edge Functions):**

- Set via `supabase secrets set KEY=value` CLI or dashboard

**Steps:**

1. Create Supabase project at https://supabase.com (if not exists)
2. Go to Project Settings → API
3. Copy `Project URL` → Set as `SUPABASE_URL` in Vercel
4. Copy `anon` / `public` key → Set as `SUPABASE_ANON_KEY` in Vercel
5. Copy `service_role` key → Set as `SUPABASE_SERVICE_ROLE_KEY` in Vercel (⚠️ Keep secret!)
6. If using Edge Functions, set additional secrets via CLI or dashboard

### 7.4 Sentry Configuration

**Priority:** ⚠️ **RECOMMENDED** (Optional but highly recommended)

| Configuration | Value Format                       | Impact if Missing       | Where to Set                                            |
| ------------- | ---------------------------------- | ----------------------- | ------------------------------------------------------- |
| DSN           | `https://key@sentry.io/project-id` | Error tracking disabled | Sentry Dashboard → Project Settings → Client Keys (DSN) |

**Steps:**

1. Create Sentry project at https://sentry.io (if not exists)
2. Go to Project Settings → Client Keys (DSN)
3. Copy DSN → Set as `SENTRY_DSN` in Vercel (all environments)
4. Set `SENTRY_ENVIRONMENT` per environment (production, preview, development)
5. Optional: Adjust `SENTRY_TRACES_SAMPLE_RATE` (default: 0.1 = 10%)

### 7.5 Upstash Redis Configuration

**Priority:** 🔴 **CRITICAL** (Required for Redis cache/queue)

| Configuration | Value Format                    | Impact if Missing          | Where to Set                                 |
| ------------- | ------------------------------- | -------------------------- | -------------------------------------------- |
| REST URL      | `https://your-redis.upstash.io` | Redis cache/queue disabled | Upstash Dashboard → Redis → REST API → URL   |
| REST Token    | Bearer token                    | Redis cache/queue disabled | Upstash Dashboard → Redis → REST API → Token |

**Steps:**

1. Create Upstash Redis database at https://upstash.com (if not exists)
2. Go to Redis → REST API
3. Copy `REST URL` → Set as `UPSTASH_REDIS_REST_URL` in Vercel
4. Copy `Token` → Set as `UPSTASH_REDIS_REST_TOKEN` in Vercel
5. For local development, use local Redis (`REDIS_HOST=localhost`)

### 7.6 Security Secrets Generation

**Priority:** 🔴 **CRITICAL** (Required for production)

Generate secure random secrets for:

| Secret               | Length           | Generation Command                                                                                                                                      |
| -------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `JWT_SECRET`         | Min 32 chars     | `openssl rand -base64 32` or `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`                                              |
| `JWT_REFRESH_SECRET` | Min 32 chars     | Same as above                                                                                                                                           |
| `ENCRYPTION_KEY`     | Exactly 32 chars | `openssl rand -base64 24` (24 bytes = 32 base64 chars) or `node -e "console.log(require('crypto').randomBytes(32).toString('base64').substring(0,32))"` |

**Steps:**

1. Generate secrets using commands above
2. Store securely (password manager, secret manager)
3. Set in Vercel environment variables (Production, Preview)
4. **Never** commit to version control

---

## 8. Open Risks & Assumptions

### 8.1 Assumptions

1. **Supabase is primary database:** Assumed Supabase is used in production. PostgreSQL fallback exists for local dev.
2. **Upstash Redis for production:** Assumed Upstash Redis is used in production. Local Redis fallback exists.
3. **Vercel for deployment:** Assumed Vercel is primary deployment platform. Other platforms may need different configs.
4. **No OpenAI/LLM integration yet:** Code references LLM features but no env vars found. May be added later.
5. **Adapter keys are per-job:** Stripe/Shopify keys are provided per reconciliation job, not globally.

### 8.2 Risks

1. **Missing CI validation:** No automated check in CI to prevent deployments with missing env vars.
   - **Mitigation:** Implement CI validation step (Section 6.1)

2. **Hardcoded test values in CI:** CI workflows use hardcoded test values. Should use secrets for production-like testing.
   - **Mitigation:** Use GitHub secrets for test credentials

3. **CORS too permissive:** `ALLOWED_ORIGINS=*` allows all origins. Should restrict in production.
   - **Mitigation:** Set specific domains in Vercel production environment

4. **Service role key exposure risk:** `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to client.
   - **Mitigation:** Ensure it's server-only in Vercel (not `NEXT_PUBLIC_*`)

5. **No scope validation:** No automated check to prevent server-only secrets in client code.
   - **Mitigation:** Add ESLint rule or build-time check

6. **Missing Turborepo env declarations:** `turbo.json` doesn't declare env var dependencies for cache invalidation.
   - **Mitigation:** Add `env` and `globalEnv` to turbo.json pipeline configs

### 8.3 Unknowns

1. **Supabase Edge Functions:** May require additional secrets not documented here.
2. **Future LLM integration:** OpenAI/Anthropic API keys may be needed later.
3. **Other third-party services:** Analytics, email, etc. may be added later.

---

## 9. Next Steps & Recommendations

### Immediate Actions (Before Production)

1. ✅ **Configure GitHub Secrets** (Section 7.1)
2. ✅ **Configure Vercel Environment Variables** (Section 7.2)
3. ✅ **Configure Supabase** (Section 7.3)
4. ✅ **Configure Upstash Redis** (Section 7.5)
5. ✅ **Generate Security Secrets** (Section 7.6)
6. ⚠️ **Configure Sentry** (Section 7.4) - Recommended
7. ⚠️ **Restrict CORS** - Set `ALLOWED_ORIGINS` to specific domains
8. ⚠️ **Set `TRUST_PROXY=true`** in Vercel production
9. ⚠️ **Set `SECURE_COOKIES=true`** in Vercel production

### Short-Term Improvements

1. **Add CI Validation** (Section 6.1)
   - Integrate `check-env.ts` into GitHub Actions
   - Fail builds if required env vars missing

2. **Add Scope Validation**
   - ESLint rule to prevent server secrets in client code
   - Build-time check for `NEXT_PUBLIC_*` usage

3. **Update Turborepo Config**
   - Declare env var dependencies in `turbo.json`
   - Ensure cache invalidation on env changes

4. **Documentation**
   - Add env var documentation to README
   - Create setup guide for new developers

### Long-Term Improvements

1. **Secret Rotation**
   - Document process for rotating secrets
   - Set up alerts for expiring secrets

2. **Environment Parity**
   - Ensure dev/staging/prod environments match
   - Use same validation across all environments

3. **Monitoring**
   - Alert on missing/invalid env vars
   - Track env var usage over time

---

## 10. Appendix

### 10.1 Environment Variable Reference

See `config/env.schema.ts` for complete specification of all environment variables.

### 10.2 Validation Script Usage

See `scripts/check-env.ts` for validation script documentation and usage examples.

### 10.3 Related Documentation

- `.env.example` - Environment variable template
- `config/env.schema.ts` - Canonical env var schema
- `scripts/check-env.ts` - Validation script
- `packages/api/src/config/validation.ts` - Runtime validation (envalid)
- `packages/api/src/infrastructure/security/SecretsManager.ts` - Secrets management

---

**Report Generated:** $(date)  
**Next Review:** After implementing manual actions and CI integration
