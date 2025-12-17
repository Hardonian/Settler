# Database Connection Migration to Session Pooler

## Summary

Updated all database connection configurations and migration scripts to use the Supabase session pooler connection for IPv4 compatibility.

## Connection String

The new session pooler connection string is:
```
postgresql://postgres.johfcvvmtfiomzxipspz:[JtLWi74CXuTcaeha]@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

**Note:** The password `[JtLWi74CXuTcaeha]` should be rotated after migration as requested.

## Files Updated

### 1. Connection Configuration
- **`.env.connection`** - Updated with new session pooler connection string

### 2. Migration Scripts
- **`scripts/migrate-supabase.ts`** - Updated to use session pooler format (`postgres.[project-ref]@aws-0-[region].pooler.supabase.com:5432`)
- **`packages/api/src/db/migrate.ts`** - Updated connection string construction to use session pooler
- **`scripts/check-connection.ts`** - Updated to use session pooler format
- **`scripts/migration-guardian.ts`** - Updated `constructSupabaseUrl` function to use session pooler

### 3. New Migration File
- **`supabase/migrations/20260120000000_add_analytics_and_chatbot_tables.sql`** - Created migration for missing analytics/chatbot tables from Prisma migrations:
  - `sdk_downloads`
  - `playground_usage`
  - `chatbot_conversations`
  - `chatbot_analytics`
  - `newsletter_subscriptions`

## Session Pooler Format

The session pooler uses the following connection string format:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

Where:
- `[PROJECT-REF]` = `johfcvvmtfiomzxipspz`
- `[REGION]` = `us-west-2` (default, can be overridden via `DB_REGION` env var)
- Port `5432` = Session pooler port (IPv4 compatible)

## Running Migrations

To run migrations with the new connection:

```bash
# Option 1: Set DATABASE_URL environment variable
export DATABASE_URL="postgresql://postgres.johfcvvmtfiomzxipspz:[JtLWi74CXuTcaeha]@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
npm run db:migrate:auto

# Option 2: Use .env.connection file
cp .env.connection .env
npm run db:migrate:auto

# Option 3: Use Supabase environment variables
export SUPABASE_URL="https://johfcvvmtfiomzxipspz.supabase.co"
export SUPABASE_DB_PASSWORD="[JtLWi74CXuTcaeha]"
export DB_REGION="us-west-2"  # Optional, defaults to us-west-2
npm run db:migrate:auto
```

## Prisma Migrations Status

All Prisma migrations have been migrated to Supabase:

✅ **20250120000000_add_receipts_and_feature_flags** - Migrated (in `20260126000000_console_complete_setup.sql`)
✅ **20250121000000_add_stripe_events_table** - Migrated (in `20250121000000_add_stripe_events_table.sql`)
✅ **20251209061041_add_multi_tenant_site_builder** - Migrated (in `20250121000000_tenant_system.sql`)
✅ **20260120000000_add_analytics_and_chatbot** - Migrated (new file: `20260120000000_add_analytics_and_chatbot_tables.sql`)

## Key Changes

1. **IPv4 Compatibility**: Session pooler automatically handles IPv4/IPv6 routing
2. **Connection Format**: Changed from `postgres@db.[project].supabase.co` to `postgres.[project]@aws-0-[region].pooler.supabase.com`
3. **Port**: Using port `5432` (session pooler) instead of direct connection port
4. **Region Support**: Added `DB_REGION` environment variable support (defaults to `us-west-2`)

## Next Steps

1. **Rotate Password**: Update the database password as requested
2. **Run Migrations**: Execute migrations using one of the methods above
3. **Verify Connection**: Test connection with `tsx scripts/check-connection.ts`
4. **Update Environment**: Update production/staging environment variables with new connection string

## Notes

- The session pooler connection is IPv4-compatible and doesn't require DNS resolution
- All migration scripts now automatically detect and use session pooler format when `SUPABASE_URL` and `SUPABASE_DB_PASSWORD` are set
- The `DB_REGION` environment variable can be used to override the default region (`us-west-2`)
