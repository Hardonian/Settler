# Applying Migrations via Supabase Pooler Connection

This guide explains how to apply the enterprise multi-tenant migrations using a Supabase Pooler connection.

## Prerequisites

1. **DATABASE_URL** with pooler connection string
2. Node.js and npm installed
3. `pg` package available (included in dependencies)

## Pooler Connection String Format

```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[HOST].pooler.supabase.com:5432/postgres
```

Example:
```
postgresql://postgres.johfcvvmtfiomzxipspz:your-password@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

## Method 1: Using npm script (Recommended)

```bash
# Set DATABASE_URL environment variable
export DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[HOST].pooler.supabase.com:5432/postgres"

# Run migration script
npm run db:migrate:pooler
```

## Method 2: Using .env.connection file

1. Create `.env.connection` file in project root:
   ```
   DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[HOST].pooler.supabase.com:5432/postgres
   ```

2. Run the script:
   ```bash
   source .env.connection && npm run db:migrate:pooler
   ```

## Method 3: Direct TypeScript execution

```bash
DATABASE_URL="postgresql://..." npx tsx scripts/apply-migrations-direct-pooler.ts
```

## Migrations Applied

The script applies these migrations in order:

1. `20251219001646_enterprise_multi_tenant_core.sql`
   - Creates: profiles, memberships, entitlements, usage_events tables
   - Enhances: subscriptions, tenants tables

2. `20251219001647_enterprise_cms_tables.sql`
   - Creates: cms_pages, cms_page_versions, cms_media tables

3. `20251219001648_enterprise_rls_policies.sql`
   - Enables RLS on all tables
   - Creates helper functions: current_tenant_id(), is_member(), has_role(), is_paid()
   - Applies RLS policies for tenant isolation

## Features

- ✅ **Idempotent**: Skips already-applied migrations
- ✅ **Transaction-safe**: Each migration runs in a transaction
- ✅ **Error handling**: Clear error messages with troubleshooting tips
- ✅ **Tracking**: Records applied migrations in `supabase_migrations.schema_migrations`

## Troubleshooting

### Password Authentication Failed

**Error**: `password authentication failed for user "postgres"`

**Solutions**:
1. Verify password is correct in connection string
2. URL-encode special characters in password
3. Check if password contains brackets `[]` - these need to be URL-encoded
4. Try using direct connection instead of pooler

### Connection Timeout

**Error**: `timeout` or `ECONNREFUSED`

**Solutions**:
1. Verify hostname is correct
2. Check network connectivity
3. Ensure database allows connections from your IP
4. Verify port 5432 is accessible

### SSL Error

**Error**: SSL-related errors

**Solutions**:
1. The script automatically sets `rejectUnauthorized: false` for Supabase connections
2. If issues persist, check Supabase project SSL settings

## Verification

After applying migrations, verify they were applied:

```sql
-- Check applied migrations
SELECT * FROM supabase_migrations.schema_migrations 
ORDER BY inserted_at DESC;

-- Verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'memberships', 'entitlements', 'usage_events', 'cms_pages', 'cms_page_versions', 'cms_media');

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'memberships', 'entitlements', 'usage_events', 'cms_pages', 'cms_page_versions', 'cms_media');
```

## Alternative: Direct Connection

If pooler connection doesn't work, use direct connection:

```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

Note: Direct connections don't use connection pooling and may have connection limits.

## Security Notes

- ⚠️ Never commit `.env.connection` to git
- ⚠️ Use environment variables or secure secret management
- ⚠️ Rotate database passwords regularly
- ⚠️ Use service role key for migrations (not anon key)

## Next Steps

After migrations are applied:

1. **Verify tables**: Check that all tables were created
2. **Test RLS**: Verify RLS policies are working
3. **Seed data**: Optionally seed default entitlements (already included in migration)
4. **Update types**: Regenerate TypeScript types if needed

## Support

If you encounter issues:

1. Check migration logs in console output
2. Review Supabase dashboard for connection issues
3. Verify DATABASE_URL format is correct
4. Try direct connection as fallback
