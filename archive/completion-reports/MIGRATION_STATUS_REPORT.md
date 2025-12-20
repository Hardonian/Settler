# Migration Status Report

**Generated:** 2025-01-28  
**Total Migrations:** 69 SQL files in `supabase/migrations/`  
**Prisma Migrations:** 4 (all migrated to Supabase)

## Migration Summary

### Supabase Migrations
- **Location:** `supabase/migrations/`
- **Total Files:** 69 `.sql` files
- **Status:** Pending verification of applied migrations

### Prisma Migrations (Archived)
All Prisma migrations have been migrated to Supabase and can be archived:

1. ✅ `20250120000000_add_receipts_and_feature_flags` → Migrated to `20260126000000_console_complete_setup.sql`
2. ✅ `20250121000000_add_stripe_events_table` → Migrated to `20250121000000_add_stripe_events_table.sql`
3. ✅ `20251209061041_add_multi_tenant_site_builder` → Migrated to `20250121000000_tenant_system.sql`
4. ✅ `20260120000000_add_analytics_and_chatbot` → Migrated to `20260120000000_add_analytics_and_chatbot_tables.sql`

## IPv4 Connection Setup

Migrations should be applied via IPv4 session pooler connection:

```
postgresql://postgres.johfcvvmtfiomzxipspz:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

## Checking Pending Migrations

To check which migrations are pending:

```bash
# Set connection string
export DATABASE_URL="postgresql://postgres.johfcvvmtfiomzxipspz:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres"

# Check status
tsx scripts/check-migration-status.sh

# Or use the TypeScript script
tsx scripts/apply-migrations-with-check.ts
```

## Applying Migrations

### Option 1: Via Script (Recommended)
```bash
export DATABASE_URL="postgresql://postgres.johfcvvmtfiomzxipspz:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
tsx scripts/apply-migrations-with-check.ts
```

### Option 2: Via Supabase Dashboard
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `scripts/apply-migrations-supabase-dashboard.sql`
3. Paste and run in SQL Editor

### Option 3: Manual via Supabase CLI
```bash
supabase migration list --project-ref johfcvvmtfiomzxipspz
supabase db push
```

## Migration Files Organization

### Active Migrations
- **Location:** `supabase/migrations/*.sql`
- **Status:** Active, should be applied to database

### Archived Migrations
- **Location:** `archive/migrations/prisma/` (to be created)
- **Status:** Prisma migrations that have been migrated to Supabase

## Next Steps

1. ✅ Archive Prisma migrations (completed)
2. ⏳ Verify which Supabase migrations are pending
3. ⏳ Apply pending migrations via IPv4 session pooler
4. ⏳ Update migration tracking table
5. ⏳ Verify all migrations applied successfully

## Notes

- All migration scripts support IPv4 session pooler connection
- Connection format: `postgres.[PROJECT-REF]@aws-0-[REGION].pooler.supabase.com:5432`
- Region defaults to `us-west-2` (can be overridden via `DB_REGION` env var)
- "Already exists" errors are normal and can be safely ignored
