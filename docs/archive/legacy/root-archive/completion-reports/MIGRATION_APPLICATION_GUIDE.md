# Database Migration Application Guide

## Migration: Add stripe_events Table

This migration adds the `stripe_events` table required for Stripe webhook idempotency.

### Files Created
- `prisma/migrations/20250121000000_add_stripe_events_table/migration.sql` (Prisma format)
- `supabase/migrations/20250121000000_add_stripe_events_table.sql` (Supabase format)

---

## Option 1: Apply via Supabase (Recommended for Production)

### Using Supabase CLI
```bash
cd /workspace
supabase db push
```

### Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/20250121000000_add_stripe_events_table.sql`
4. Paste and execute

### Using Supabase Migration API
```bash
# If you have SUPABASE_ACCESS_TOKEN set
supabase migration up --db-url $DATABASE_URL
```

---

## Option 2: Apply via Prisma (If using Prisma directly)

### Prerequisites
- `DATABASE_URL` environment variable must be set
- Database must be accessible

### Commands
```bash
cd /workspace

# For production (applies pending migrations)
npx prisma migrate deploy

# For development (creates migration and applies)
npx prisma migrate dev --name add_stripe_events_table

# Generate Prisma client (required after migration)
PRISMA_CLIENT_ENGINE_TYPE=binary npx prisma generate
```

---

## Option 3: Manual SQL Execution

If you have direct database access:

```bash
# Connect to your database
psql $DATABASE_URL

# Then execute:
\i supabase/migrations/20250121000000_add_stripe_events_table.sql
```

Or copy-paste the SQL from the migration file directly.

---

## Verification

After applying the migration, verify the table exists:

```sql
-- Check table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'stripe_events';

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'stripe_events';

-- Verify structure
\d stripe_events
```

Expected output:
- Table `stripe_events` exists
- Unique index on `event_id`
- Indexes on `type`, `status`, `received_at`, `user_id`, `tenant_id`, `billing_account_id`

---

## Prisma Client Generation

After migration, regenerate Prisma client:

```bash
cd /workspace
PRISMA_CLIENT_ENGINE_TYPE=binary npx prisma generate
```

This ensures TypeScript types include the new `StripeEvent` model.

---

## Rollback (If Needed)

To rollback this migration:

```sql
DROP TABLE IF EXISTS "stripe_events" CASCADE;
```

**Warning**: This will delete all webhook event history. Only use if absolutely necessary.

---

## Troubleshooting

### Error: "relation stripe_events already exists"
- The migration was already applied. Safe to ignore.

### Error: "permission denied"
- Ensure database user has CREATE TABLE permissions
- Check RLS policies if using Supabase

### Error: "column already exists"
- Partial migration may have run. Check table structure:
  ```sql
  \d stripe_events
  ```
- Manually add missing columns/indexes if needed

---

## Next Steps

After migration is applied:

1. ✅ Verify table exists
2. ✅ Regenerate Prisma client
3. ✅ Test webhook endpoint (should use new idempotency)
4. ✅ Monitor `stripe_events` table for incoming events

---

Generated: 2025-01-21
