# Build & Deployment Parity

## Toolchain (pinned)

- Node.js: `24.15.0` (`.nvmrc` and `.node-version`)
- Package manager: `pnpm@10.13.1` (`package.json#packageManager`)
- Install command (local/CI): `pnpm run pnpm:ci:install`

## Local setup

1. `corepack enable && corepack prepare pnpm@10.13.1 --activate`
2. `pnpm run pnpm:ci:install`
3. Copy `.env.example` to `.env` and fill required values.

## One-command workflow

1. `pnpm run doctor`
2. `pnpm run verify`

`doctor` performs toolchain, env, config, asset, runtime-safety, and staged quality checks.
`verify` mirrors CI checks (lint, typecheck, docs parity, build, security audit threshold).

## Vercel parity

- `vercel.json` uses:
  - `installCommand`: `corepack enable && corepack prepare pnpm@10.13.1 --activate && pnpm install --frozen-lockfile`
  - `buildCommand`: `pnpm --filter @settler/web... build`
  - Node runtime: controlled by root `package.json#engines.node` (`>=24.15.0 <25.0.0`) because `nodeVersion` is not a valid Vercel config key.
- CI and Vercel use the same Node major and pnpm version.

## Environment checklist (Preview + Production)

### Required public (`NEXT_PUBLIC_*`)

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Required server-only

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- One of: `DATABASE_URL` or `SUPABASE_DATABASE_URL` or `DIRECT_URL`

### Optional but recommended

- `REDIS_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Security audit policy

- `pnpm run verify` runs `pnpm audit --audit-level=high --prod`.
- High/Critical vulnerabilities fail verify until remediated.
- Do not bypass with `--force`; patch dependency ranges or overrides explicitly.

## Build performance baseline and optimization status

Baseline captured on 2026-10-18 with Node.js 24.15.0, pnpm 10.13.1, and Turbo 2.11.7 on Windows:

- Two clean successful `pnpm build` runs took 4m56s and 4m50s wall time.
- Turbo task execution took 3m42s and 3m10s.
- The final run reused 10 of 13 task results; remote caching was disabled.
- The Next.js production compile took 78-81s. Static generation of 177 pages took 4.1-5.6s.
- `packages/api` and `packages/web` prebuild scripts rebuilt dependencies that Turbo had already scheduled, and each regenerated Prisma Client.
- The `/verify` bundle emitted `fs` resolution and expression-based dynamic import warnings from `packages/web/src/lib/verify.ts`.

Implemented on 2026-10-18:

1. Main CI now passes `TURBO_TOKEN` and `TURBO_TEAM` from repository secrets. Vercel builds connect to managed remote caching automatically. Run `pnpm turbo:cache:check` to verify local/external-CI configuration without printing credentials.
2. Prisma generation is one uncached root task with narrow declared inputs. API and web prebuild hooks no longer rebuild dependencies already ordered by Turbo.
3. `.next/cache` and `.next/dev` are excluded from Turbo artifacts. The web-to-API dependency remains intentionally: web routes import API email-lifecycle, activation-funnel, and billing-hardening outputs, so API changes can legitimately affect the web build.
4. Browser, Node, and shared proof verification are separate modules. The production build no longer emits `fs` resolution or expression-import warnings for `/verify`.
5. `pnpm build:profile` records an uncached execution profile, Turbo run summary, and parsed Next.js trace under ignored `artifacts/`. Use `pnpm build:profile -- --warm` for a cache replay measurement.

Post-change measurements on the same host:

- Forced diagnostic execution: 388.2s wall time; this intentionally bypasses cache reads and is not a direct release-build comparison.
- Cache-miss builds while concurrent commits were landing: 252.0-274.8s wall time, with all 12 reusable dependency tasks hitting cache after the first run.
- Stable warm replay at web hash `0734a0c60e3e0556`: 6.0s wall time, 13 of 14 tasks cached; only the intentionally uncached Prisma generation task ran.
- Final verification after the E2E/test-runtime changes: 431.4s for a genuine web miss on this host (Next reported a 4.0-minute compile), followed immediately by an 8.8s warm replay with 13 of 14 tasks cached. Miss-path variance is therefore material; compare optimizations with repeated profiler runs, not a single wall-clock sample.
- The Next.js trace attributes the dominant miss-path cost to webpack (92-180s) and build-trace collection (66-80s), not static generation (about 5s).

Remote caching cannot be activated in an unauthenticated shell by repository code alone. External CI requires the `TURBO_TOKEN` and `TURBO_TEAM` secrets; `pnpm turbo:cache:check -- --require` fails closed when they are absent. No token material is committed or logged.

## Production-boundary E2E verification

On Windows, `pnpm test:e2e:production:windows` starts the built API and Next.js application on ports 4100 and 3100, respectively. It uses an isolated Docker Compose project for PostgreSQL and Redis, runs the `ci-critical` Playwright project, and always stops its process trees and containers. It does not mutate the developer database or run `prisma db push`.

The 2026-10-18 run passed all nine critical journeys on the first attempt, including browser-only proofpack verification with no proof-verification API request or browser console error. The isolated empty database intentionally exercises only health and unauthenticated boundaries. Full schema-backed E2E remains in CI, where PostgreSQL is disposable.

The repository's non-destructive empty-database migration path currently stops at `20260131000002_restore_operator_mode_tables` because `alert_rules` has not yet been created. Treat repair of that migration dependency as separate schema work; do not bypass it with `prisma db push --accept-data-loss` on a developer or production database.

Optimization guardrails:

- Do not remove lint, strict TypeScript, tests, tenant/security checks, determinism checks, replay checks, or build-environment validation to improve elapsed time.
- Use `pnpm verify:fast` for the local edit loop; retain the full required verification suite for pull requests.
- Accept a build optimization only when cold- and warm-cache timings improve and generated artifacts, cache inputs/outputs, and clean-checkout builds remain correct.
