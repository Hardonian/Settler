# Settler OSS Quickstart

This quickstart is for the open-source repository and assumes no enterprise environment variables are set.

## Prerequisites

- Node.js 22+
- pnpm 10.13.1+
- Postgres-compatible database (local Postgres or Supabase)

## One-command setup

```bash
pnpm install && cp .env.example .env
```

Set at minimum:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

## Run locally

```bash
pnpm exec tsx scripts/run-migrations-remote.ts
pnpm --filter @settler/web dev
```

Open `http://localhost:3000`.

## Verify OSS mode (enterprise env absent)

```bash
pnpm verify:oss
```

This command runs the full verify suite with enterprise URL environment variables explicitly unset.
