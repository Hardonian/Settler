# Build & Deployment Parity

## Toolchain (pinned)

- Node.js: `24.12.0` (`.nvmrc` and `.node-version`)
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
  - Node runtime: controlled by root `package.json#engines.node` (`>=24.0.0 <25.0.0`) because `nodeVersion` is not a valid Vercel config key.
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

## Build performance baseline and safe optimization backlog

Baseline captured on 2026-10-18 with Node.js 24.15.0, pnpm 10.13.1, and Turbo 2.11.7 on Windows:

- Two clean successful `pnpm build` runs took 4m56s and 4m50s wall time.
- Turbo task execution took 3m42s and 3m10s.
- The final run reused 10 of 13 task results; remote caching was disabled.
- The Next.js production compile took 78-81s. Static generation of 177 pages took 4.1-5.6s.
- `packages/api` and `packages/web` prebuild scripts rebuilt dependencies that Turbo had already scheduled, and each regenerated Prisma Client.
- The `/verify` bundle emitted `fs` resolution and expression-based dynamic import warnings from `packages/web/src/lib/verify.ts`.

Prioritized future work, subject to before/after measurement and full verification:

1. Configure authenticated Turbo remote caching for CI and trusted developer environments.
2. Model generated Prisma artifacts and package outputs explicitly in the Turbo graph, then remove redundant package builds from API/web prebuild scripts only after proving equivalent dependency and freshness guarantees.
3. Audit Turbo inputs for the web task so API-only changes do not invalidate the web build unless they change a declared web dependency.
4. Split the Node-only proof verifier from the browser/WASM verifier so the `/verify` client bundle cannot traverse `fs` or expression-based imports.
5. Profile Next.js compilation and trace finalization separately before considering route or bundler changes.

Optimization guardrails:

- Do not remove lint, strict TypeScript, tests, tenant/security checks, determinism checks, replay checks, or build-environment validation to improve elapsed time.
- Use `pnpm verify:fast` for the local edit loop; retain the full required verification suite for pull requests.
- Accept a build optimization only when cold- and warm-cache timings improve and generated artifacts, cache inputs/outputs, and clean-checkout builds remain correct.
