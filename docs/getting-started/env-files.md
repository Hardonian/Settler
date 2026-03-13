# Environment Files

This project uses a small set of env-file locations with different trust boundaries.

## Canonical local development files

- Root `.env.local`: canonical source for root scripts (`pnpm run verify:setup`, `pnpm run doctor`, `pnpm run dev:stack`).
- `packages/web/.env.local`: optional package-local overrides for web runtime.
- `packages/api/.env.local`: optional package-local overrides for API runtime.

Load order for root verification scripts is:

1. `.env`
2. `.env.local`
3. `.env.production`
4. `packages/web/.env.local`
5. `packages/api/.env.local`

Earlier files win (`override: false`), so keep canonical values in root `.env.local` to avoid ambiguity.

## Source templates

- `.env.local.example` is the canonical starter template.
- Copy it before first run:

```bash
cp .env.local.example .env.local
```

## Minimum required variables

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)

## Safety rules

- Never commit populated `.env*` files.
- Treat `SUPABASE_SERVICE_ROLE_KEY` as privileged and server-only.
- Prefer least-privilege API keys for connectors and integrations.

## Doppler and local shell truth

Vercel dashboard env is **not** visible to local commands by default.
Doppler secrets are visible only when a command is launched through Doppler.

Canonical Doppler run pattern:

```bash
doppler run -- pnpm run verify:setup
doppler run -- pnpm run doctor -- --skip-pipeline --first-run
```

If you prefer file-based local execution, materialize `.env.local` first (example):

```bash
doppler secrets download --no-file --format env > .env.local
```

## Verification

Use:

```bash
pnpm run verify:setup
pnpm run doctor -- --skip-pipeline --first-run
```

These commands surface missing variables, show which env files were loaded, and provide remediation guidance before demos or migrations.
