# Database Migration Ready

## Migration Files Created

### 1. Webhook Models Migration
**File:** `supabase/migrations/20250120000009_webhook_models.sql`

This migration updates the existing webhook tables to match the Prisma schema:
- Adds `metadata` column to `webhooks` table
- Adds `deleted_at` column to `webhooks` table  
- Converts `events` from TEXT[] to JSONB for Prisma compatibility
- Updates column types (VARCHAR to TEXT) for compatibility
- Adds `error_message` and `metadata` columns to `webhook_deliveries` table
- Adds `updated_at` column to `webhook_deliveries` table
- Updates defaults and adds missing indexes

## How to Run Migrations

### Option 1: Using GitHub Actions (Recommended)
The migrations will run automatically via:
- `.github/workflows/supabase-migrate.yml`
- `.github/workflows/production-migrations.yml`
- `.github/workflows/auto-migrate-on-merge.yml`

These workflows use GitHub secrets:
- `DATABASE_URL` (preferred)
- `SUPABASE_URL` + `SUPABASE_DB_PASSWORD`
- Or individual `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

### Option 2: Manual Run
```bash
# Using the migration script
npm run db:migrate:auto

# Or using the shell script
./scripts/run-migrations.sh
```

### Option 3: Direct Supabase CLI
```bash
# If using Supabase CLI
supabase db push --include-all
```

## Migration Script

Created `scripts/run-migrations.sh` that:
1. Checks for DATABASE_URL or SUPABASE_URL
2. Runs Supabase migrations
3. Runs Prisma migrations (if applicable)

## What This Migration Does

The migration is **idempotent** - it checks if columns exist before adding them, so it's safe to run multiple times.

### Changes to `webhooks` table:
- ✅ Adds `metadata JSONB` column
- ✅ Adds `deleted_at TIMESTAMPTZ` column
- ✅ Converts `events` from TEXT[] to JSONB
- ✅ Updates `url` and `secret` to TEXT type
- ✅ Adds GIN index on `events` for JSONB queries

### Changes to `webhook_deliveries` table:
- ✅ Adds `error_message TEXT` column
- ✅ Adds `metadata JSONB` column
- ✅ Adds `updated_at TIMESTAMPTZ` column
- ✅ Updates `status` default to 'pending'
- ✅ Updates `attempts` default to 1
- ✅ Updates `url` to TEXT type
- ✅ Adds index on `created_at`

## Verification

After running migrations, verify with:
```sql
-- Check webhooks table structure
\d webhooks

-- Check webhook_deliveries table structure  
\d webhook_deliveries

-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('webhooks', 'webhook_deliveries')
ORDER BY table_name, ordinal_position;
```

## Next Steps

1. **In GitHub Actions**: Migrations will run automatically on merge to main
2. **Manual**: Run `npm run db:migrate:auto` with DATABASE_URL set
3. **Verify**: Check that all columns exist and Prisma can connect

All migrations are ready to run when the database connection is available!
