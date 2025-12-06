# Migration Guardian – Supabase + Prisma + Upstash

## Overview

The Migration Guardian is a background agent that automatically keeps Prisma migrations fully applied to your connected Supabase Postgres database. It verifies in concrete, non-theoretical ways that:

- Migrations were actually executed against the live Supabase DB
- The resulting DB schema matches Prisma's expectations
- Redis (Upstash) is reachable
- The state reached is the **authoritative GO-LIVE migration state** for this environment

## Usage

### Run Once

```bash
npm run migration:guardian
```

### Run as Background Agent

You can set this up to run automatically via:

1. **Cron Job** (Linux/Mac):
   ```bash
   # Run every hour
   0 * * * * cd /path/to/workspace && npm run migration:guardian
   ```

2. **GitHub Actions** (CI/CD):
   ```yaml
   - name: Run Migration Guardian
     run: npm run migration:guardian
   ```

3. **Systemd Timer** (Linux):
   Create a systemd service and timer to run periodically

## Prerequisites

1. **Prisma Setup**:
   - Prisma must be installed: `npm install prisma @prisma/client`
   - Prisma schema must exist at `prisma/schema.prisma`
   - Migrations directory must exist at `prisma/migrations`

2. **Environment Variables**:
   - At least one of: `.env.local`, `.env.development`, `.env`, or `.env.production`
   - Must contain `DATABASE_URL` or `SUPABASE_DB_URL` pointing to your Supabase Postgres database
   - Optional: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for Redis connectivity check

3. **Database Access**:
   - The database must be reachable from the machine running the script
   - For Supabase, ensure your IP is allowlisted or connection pooling is configured

## What It Does

1. **Discovers Environment**: Finds and loads the appropriate `.env` file
2. **Tests Database Connection**: Verifies connectivity to Supabase Postgres
3. **Checks Prisma Status**: Determines if any migrations are pending
4. **Applies Migrations**: If pending migrations exist, applies them safely
5. **Archives Migrations**: Creates copies of applied migrations in `prisma/_archive/`
6. **Checks Redis**: Verifies Upstash Redis connectivity (if configured)
7. **Reality Verification**: Performs concrete checks:
   - Prisma migration status
   - DB schema matches Prisma models
   - Database health check
8. **Logs Everything**: Maintains `MIGRATION_LOG.md` with full details

## Output

The script creates/updates `MIGRATION_LOG.md` in the repository root with:

- Run ID and timestamp
- Environment and database information
- Pre-run migration status
- Commands executed
- Apply results
- Archive information
- Redis connectivity status
- Reality verification results
- Final outcome state

## Outcome States

- **`GO-LIVE VERIFIED`**: All migrations applied, schema verified, ready for production
- **`GO-LIVE VERIFIED (NO CHANGES NEEDED)`**: No pending migrations, everything verified
- **`PARTIAL – MANUAL ACTION REQUIRED`**: Some checks failed, manual intervention needed
- **`FAILED – SEE ERRORS ABOVE`**: Critical errors occurred, review log for details

## Safety Features

- **Production Mode Detection**: Automatically detects if operating on a production database and logs warnings
- **Non-Destructive**: Never modifies or deletes original migration files (only creates archives)
- **Reality Checks**: Doesn't assume success - verifies everything with actual DB queries
- **Error Handling**: Comprehensive error logging with actionable next steps

## Troubleshooting

### "Prisma is not installed"
```bash
npm install prisma @prisma/client
```

### "No DATABASE_URL found"
Ensure your `.env` file contains either:
- `DATABASE_URL=postgresql://...`
- `SUPABASE_DB_URL=postgresql://...`
- Or `SUPABASE_URL` + `SUPABASE_DB_PASSWORD` (will construct URL automatically)

### "Database connection failed"
- Check Supabase password is correct
- Verify IP allowlist settings in Supabase dashboard
- Ensure `sslmode=require` is set for Supabase connections

### "Schema verification failed"
- Ensure Prisma schema matches your database
- Run `npx prisma db pull` to sync schema from database
- Or run `npx prisma migrate dev` to create missing migrations

## Archive Location

Applied migrations are archived to:
```
prisma/_archive/YYYY-MM-DD_HH-MM-SS/migration-id/
```

This directory is automatically added to `.gitignore` to keep archives private.
