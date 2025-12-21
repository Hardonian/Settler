# Remote Database Setup Guide

## Quick Setup Using IPv4 Pooler Connection

### Prerequisites

1. **Database Connection String**
   - Format: `postgresql://user:password@host:port/database?sslmode=require`
   - For Supabase Pooler: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require`

2. **Node.js and pnpm** installed

### Option 1: Automated Complete Setup (Recommended)

```bash
# Set your database URL
export DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"

# Optional: Set user email for super admin
export USER_EMAIL="admin@settler.dev"

# Run complete setup
./scripts/setup-complete.sh
```

### Option 2: Step-by-Step Setup

#### Step 1: Run Migrations

```bash
export DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"
pnpm tsx scripts/run-migrations-remote.ts
```

This will:
- ✅ Create `api_call_logs` table
- ✅ Add performance indexes
- ✅ Create log retention policy
- ✅ Enhance RLS policies

#### Step 2: Configure Super Admin

```bash
# Using email
export DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"
export USER_EMAIL="admin@settler.dev"
pnpm tsx scripts/configure-super-admin.ts

# OR using user ID
export DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"
export USER_ID="user-uuid-here"
pnpm tsx scripts/configure-super-admin.ts
```

#### Step 3: Test Setup

```bash
export DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"
pnpm tsx scripts/test-setup.ts
```

### Option 3: Manual SQL Execution

If you prefer to run SQL directly:

```bash
# Connect to database
psql "$DATABASE_URL"

# Then run each migration file:
\i supabase/migrations/20241201000000_create_api_call_logs.sql
\i supabase/migrations/20241201000001_optimize_api_call_logs.sql
\i supabase/migrations/20241201000002_add_log_retention_policy.sql
\i supabase/migrations/20241201000003_enhance_rls_policies.sql

# Configure super admin
UPDATE billing_accounts
SET metadata = jsonb_set(COALESCE(metadata, '{}'), '{role}', '"SUPER_ADMIN"')
WHERE user_id = 'YOUR_USER_ID';
```

## Verification

After setup, verify everything works:

### 1. Check Migrations Applied

```sql
SELECT version, applied_at 
FROM schema_migrations 
ORDER BY applied_at;
```

### 2. Check Table Exists

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'api_call_logs'
);
```

### 3. Check Indexes

```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'api_call_logs';
```

### 4. Check RLS Policies

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'api_call_logs';
```

### 5. Check Super Admin

```sql
SELECT 
  u.email,
  ba.metadata->>'role' as billing_role,
  u.raw_user_meta_data->>'role' as user_role
FROM auth.users u
LEFT JOIN billing_accounts ba ON ba.user_id = u.id
WHERE 
  ba.metadata->>'role' = 'SUPER_ADMIN'
  OR u.raw_user_meta_data->>'role' = 'SUPER_ADMIN'
  OR u.email LIKE '%@settler.dev';
```

## Troubleshooting

### Connection Issues

**Error: "connection refused"**
- Check firewall rules
- Verify connection string format
- Ensure SSL mode is set correctly

**Error: "SSL required"**
- Add `?sslmode=require` to connection string
- For pooler: Use port 6543 (not 5432)

**Error: "authentication failed"**
- Verify username and password
- Check database user permissions
- Ensure user has CREATE TABLE permissions

### Migration Issues

**Error: "relation already exists"**
- Table already created, safe to skip
- Or drop and recreate: `DROP TABLE api_call_logs CASCADE;`

**Error: "permission denied"**
- Ensure database user has CREATE/ALTER permissions
- May need to run as superuser or database owner

**Error: "function already exists"**
- Function already created, safe to skip
- Or drop: `DROP FUNCTION cleanup_old_api_logs();`

### Super Admin Issues

**User not found**
- Verify email exists in `auth.users` table
- Check for typos in email address
- User may need to sign up first

**Role not applying**
- Check both `billing_accounts.metadata` and `auth.users.raw_user_meta_data`
- Verify user_id matches
- Try both methods (billing_account and user metadata)

## Security Notes

1. **Never commit DATABASE_URL** to version control
2. **Use environment variables** for connection strings
3. **Rotate credentials** regularly
4. **Use connection pooling** for production
5. **Enable SSL** for all connections

## Production Checklist

- [ ] Migrations applied successfully
- [ ] All indexes created
- [ ] RLS policies active
- [ ] Super admin configured
- [ ] Log retention policy set
- [ ] Connection pooling enabled
- [ ] SSL/TLS enabled
- [ ] Backups configured
- [ ] Monitoring enabled

## Support

If you encounter issues:

1. Check logs: `SELECT * FROM api_call_logs ORDER BY created_at DESC LIMIT 100;`
2. Check health: `GET /api/console/health`
3. Review error messages in migration scripts
4. Verify database permissions
5. Check connection string format

---

**Ready to proceed?** Run the setup script with your DATABASE_URL!
