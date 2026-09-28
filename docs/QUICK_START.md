# Quick Start Guide

## Prerequisites

- Node.js 24.x (see `.nvmrc`)
- pnpm 10.x (see `package.json`)
- PostgreSQL (Supabase or local Postgres)

## Install Dependencies

From the repository root:

```bash
pnpm install
cp .env.example .env
```

Update `.env` with your Postgres/Supabase credentials.

## Run Migrations

```bash
pnpm tb:start
pnpm exec prisma migrate dev
```

Production migrations are applied only by the serialized GitHub Actions workflow described in [MIGRATIONS.md](./MIGRATIONS.md).

## Start the Web Console

```bash
pnpm --filter @settler/web dev
```

Access the app at:

- Web app: `http://localhost:3000`
- Console: `http://localhost:3000/console`

## Verify Setup (Optional)

```bash
pnpm run verify:fast
```

## Next Steps

- [Console Documentation](./CONSOLE.md)
- [API Documentation](./API.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Remote Setup Guide](./getting-started/README.md)
