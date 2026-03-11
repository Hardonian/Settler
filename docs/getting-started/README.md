# Getting Started

## Canonical onboarding path

```bash
pnpm install
cp .env.local.example .env.local
pnpm demo:settler
```

This path is optimized for first-time contributors and operators.

## Environment setup essentials

Use these minimum variables before running migrations or API/server workflows:

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)

Recommended local placement:

- `packages/web/.env.local` for local development secrets (gitignored)
- root `.env` only when a shared workspace script explicitly requires it

## Environment entrypoint

For env-file placement, variable scope, and safety rules, use:

- [`env-files.md`](./env-files.md)

## Remote database quick setup

```bash
export DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"
pnpm tsx scripts/run-migrations-remote.ts
pnpm tsx scripts/test-setup.ts
```

If you need super-admin bootstrapping, run:

```bash
export USER_EMAIL="admin@settler.dev"
pnpm tsx scripts/configure-super-admin.ts
```

## Inputs and outputs

- **Inputs:** reconciliation feeds, connector payloads, rules, and policy configuration.
- **Outputs:** run results, mismatch queues, and evidence artifacts (`run.json`, `results.json`, `evidence.json`).

## Next docs

- Developer API + SDK: [`docs/api/README.md`](../api/README.md)
- Architecture overview: [`docs/architecture/README.md`](../architecture/README.md)
- Demo walkthrough: [`docs/demo/demo-walkthrough.md`](../demo/demo-walkthrough.md)
- Security and tenant boundaries: [`docs/security/README.md`](../security/README.md)
- CLI quickstart: [`docs/quickstart-cli.md`](../quickstart-cli.md)
