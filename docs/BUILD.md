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
  - `installCommand`: `npx pnpm@10.13.1 install --frozen-lockfile`
  - `buildCommand`: `pnpm --filter @settler/web... build`
  - `nodeVersion`: `24.x`
- CI uses the same Node major and pnpm version.

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
