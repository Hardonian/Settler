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
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB"
pnpm exec tsx scripts/run-migrations-remote.ts
```

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
- [Architecture Overview](./architecture.md)
- [Remote Setup Guide](./REMOTE_SETUP_GUIDE.md)
