# Deployment Readiness (Operator Truth)

This document defines the minimum verifiable path to deploy Settler without hidden assumptions.

## 1) Preconditions

- Node `>=22` and pnpm `>=10.13.1`.
- Postgres/Supabase credentials available.
- Vercel and Supabase CI credentials available if using GitHub Actions deployments.

## 2) Local readiness

1. Copy env template:
   - `cp .env.local.example .env.local`
2. Fill required local keys:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Install and verify baseline:
   - `pnpm install --frozen-lockfile`
   - `pnpm lint && pnpm typecheck && pnpm build`
4. Start stack:
   - `pnpm dev:stack`

## 3) CI readiness

Ensure GitHub secrets are populated for workflows you intend to run:

- Build/deploy: `TURBO_TOKEN`, `TURBO_TEAM`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- Supabase migration: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `DATABASE_URL`
- Billing: `STRIPE_SECRET_KEY` (and webhook secret when webhook verification is tested)

## 4) Staging/production runtime readiness

### Mandatory before production cutover

- `JWT_SECRET` is strong/non-default.
- `ENCRYPTION_KEY` is exactly 32 chars.
- `ALLOWED_ORIGINS` is restricted (not `*`).
- `DATABASE_URL` points to production DB.
- `SUPABASE_SERVICE_ROLE_KEY` set for privileged API jobs.

### Conditional by feature

- Billing: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Email: `RESEND_API_KEY`, sender fields
- Redis-backed performance/rate-limit path: `REDIS_URL` or Upstash pair
- Enterprise adapter credential crypto: `CREDENTIAL_ENCRYPTION_KEY` or `SUPABASE_VAULT_KEY`

## 5) Rollback posture

- Kernel emergency disable: set `SETTLER_DISABLE_KERNEL=1`.
- Kernel shadow mode: set `SETTLER_KERNEL_EXECUTION_MODE=shadow`.
- Disable specific kernel operations: `SETTLER_DISABLE_OPERATION=<comma-separated-ops>`.

## 6) Misconfiguration behavior to expect

- API env validation throws on critical prod key violations (`JWT_SECRET`, `ENCRYPTION_KEY`, `DB_PASSWORD` placeholder state).
- Web Supabase client bootstrap throws when public Supabase env is absent.
- Billing webhook verification fails closed when webhook secret is missing.
