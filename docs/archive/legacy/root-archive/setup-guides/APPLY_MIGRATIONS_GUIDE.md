# Apply Database Migrations Guide

## Quick Start

To apply all pending migrations, you need to set the `DATABASE_URL` environment variable and run:

```bash
# Set your database URL
export DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Apply pending migrations
npm run db:migrate:pending
```

## Available Migration Commands

### 1. Apply Pending Migrations (Recommended)
```bash
npm run db:migrate:pending
```
- Checks which migrations have been applied
- Only applies migrations that haven't been run yet
- Tracks applied migrations in `schema_migrations` table

### 2. Apply All Migrations (Full Reset)
```bash
npm run db:migrate:auto
```
- Applies ALL migrations in order
- Useful for fresh database setup
- May skip migrations that already exist (handles duplicates)

### 3. Manual Migration Script
```bash
npm run db:migrate:apply
```
- Bash script for applying migrations
- Requires `DATABASE_URL` or Supabase environment variables

## Setting Up DATABASE_URL

### Option 1: Environment Variable (Recommended)
```bash
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

### Option 2: .env File
Create a `.env` file in the project root:
```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### Option 3: Supabase Connection String
Get your connection string from:
- Supabase Dashboard → Settings → Database → Connection string
- Use the "Connection pooling" or "Direct connection" option

## Migration Status

The `db:migrate:pending` command tracks applied migrations in the `schema_migrations` table:

```sql
-- Check applied migrations
SELECT version, applied_at FROM schema_migrations ORDER BY applied_at;
```

## Troubleshooting

### Error: DATABASE_URL not set
**Solution:** Set the `DATABASE_URL` environment variable before running migrations.

### Error: Connection refused
**Possible causes:**
1. Database is not accessible
2. Wrong connection string
3. Firewall blocking connection

**Solution:** Verify your connection string and database accessibility.

### Error: Migration already exists
**Solution:** This is normal - migrations with `IF NOT EXISTS` clauses will skip existing objects. The migration will still be marked as applied.

### Error: Permission denied
**Solution:** Ensure your database user has CREATE/ALTER permissions.

## Migration Files

Migrations are located in: `supabase/migrations/`

All `.sql` files in this directory will be applied in alphabetical order.

## Verification

After applying migrations, verify tables exist:

```sql
-- Check critical tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('billing_accounts', 'api_keys', 'receipts', 'usage_events');
```

## Production Deployment

For production deployments:

1. **Set DATABASE_URL** in your deployment platform (Vercel, etc.)
2. **Run migrations** as part of your deployment process
3. **Verify** migrations were applied successfully

### Vercel Example
Add to your `vercel.json` or deployment script:
```json
{
  "buildCommand": "npm run db:migrate:pending && npm run build"
}
```

Or run migrations manually after deployment:
```bash
vercel env pull .env.production
npm run db:migrate:pending
```

## Safety Notes

- ✅ Migrations are tracked - won't apply the same migration twice
- ✅ Uses transactions - failed migrations are rolled back
- ✅ Handles "already exists" errors gracefully
- ⚠️ Always backup your database before applying migrations in production
- ⚠️ Test migrations in staging/preview environment first

## Next Steps

After applying migrations:

1. ✅ Verify tables exist
2. ✅ Check RLS policies are enabled
3. ✅ Verify helper functions exist (`current_user_id()`, etc.)
4. ✅ Test console endpoints
5. ✅ Run health check: `/api/health/console`
