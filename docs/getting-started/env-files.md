# Environment Files

This project uses a small set of env-file locations with different trust boundaries.

## Canonical local development files

- Root `.env.local`: shared values needed by root-level scripts.
- `packages/web/.env.local`: web-only local secrets and client-exposed keys.
- `packages/api/.env.local` (if used): API-only local runtime values.

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

## Verification

Use:

```bash
pnpm doctor -- --skip-pipeline --first-run
```

This surfaces missing variables and common setup drift before running demos or migrations.
