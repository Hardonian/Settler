# Database Migration Runbook

## Overview

This runbook describes how to safely apply the Settler API database migrations to set up a fresh PostgreSQL database or migrate an existing one.

## Prerequisites

- PostgreSQL 14+ installed and running
- Database user with `CREATE TABLE`, `CREATE INDEX`, `CREATE FUNCTION`, and `CREATE EXTENSION` privileges
- `uuid-ossp` and `pgcrypto` extensions available
- Backup of existing database (if migrating)

## Migration Files

### Primary Migration
- **`001-initial-schema.sql`** - Complete initial schema with all tables, indexes, functions, RLS policies, and triggers

### Legacy Migrations (Deprecated)
The following migration files are consolidated into `001-initial-schema.sql` and should not be run separately:
- `multi-tenancy.sql` (consolidated)
- `event-sourcing.sql` (consolidated)
- `cqrs-projections.sql` (consolidated)
- `security.sql` (consolidated)
- `performance-indexes.sql` (consolidated)
- `materialized-views.sql` (consolidated)
- `table-partitions.sql` (optional, for high-scale deployments)

## Fresh Database Setup

### Step 1: Create Database

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Create database
CREATE DATABASE settler;

# Create application user (optional, for production)
CREATE USER settler_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE settler TO settler_user;

# Exit psql
\q
```

### Step 2: Run Initial Schema Migration

```bash
# Option 1: Using psql command line
psql -U postgres -d settler -f packages/api/src/db/migrations/001-initial-schema.sql

# Option 2: Using connection string
psql postgresql://user:password@localhost:5432/settler -f packages/api/src/db/migrations/001-initial-schema.sql

# Option 3: Programmatically (via Node.js)
# The API server will automatically run migrations on startup via initDatabase()
```

### Step 3: Verify Migration

```sql
-- Connect to database
psql -U postgres -d settler

-- Check that all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Expected tables:
-- - tenants
-- - users
-- - api_keys
-- - jobs
-- - executions
-- - matches
-- - unmatched
-- - reports
-- - webhooks
-- - webhook_payloads
-- - webhook_deliveries
-- - webhook_configs
-- - audit_logs
-- - idempotency_keys
-- - revoked_tokens
-- - blocked_ips
-- - security_events
-- - tenant_usage
-- - tenant_quota_usage
-- - feature_flags
-- - feature_flag_changes
-- - event_store
-- - snapshots
-- - saga_state
-- - dead_letter_queue
-- - reconciliation_summary
-- - tenant_usage_view
-- - error_hotspots_view

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION';

-- Exit
\q
```

## Migrating Existing Database

### Pre-Migration Checklist

1. **Backup Database**
   ```bash
   pg_dump -U postgres settler > settler_backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Check Current Schema Version**
   ```sql
   -- Check if tenants table exists (indicates multi-tenancy migration)
   SELECT EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name = 'tenants'
   );
   ```

3. **Review Breaking Changes**
   - The consolidated migration uses `IF NOT EXISTS` clauses, making it idempotent
   - Existing data will be preserved
   - New columns added with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`

### Migration Steps

1. **Test Migration on Staging**
   ```bash
   # Restore backup to staging database
   createdb settler_staging
   psql -U postgres -d settler_staging < settler_backup.sql
   
   # Run migration
   psql -U postgres -d settler_staging -f packages/api/src/db/migrations/001-initial-schema.sql
   
   # Verify data integrity
   ```

2. **Production Migration**
   ```bash
   # Schedule maintenance window
   # Stop API server
   
   # Backup production database
   pg_dump -U postgres settler > settler_prod_backup_$(date +%Y%m%d_%H%M%S).sql
   
   # Run migration
   psql -U postgres -d settler -f packages/api/src/db/migrations/001-initial-schema.sql
   
   # Verify migration success
   # Start API server
   ```

### Post-Migration Verification

```sql
-- Check tenant_id columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'jobs' 
AND column_name = 'tenant_id';

-- Verify RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- Check triggers
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Test tenant isolation
SET app.current_tenant_id = '00000000-0000-0000-0000-000000000000';
SELECT COUNT(*) FROM jobs; -- Should only see jobs for this tenant
RESET app.current_tenant_id;
```

## Rollback Procedure

If migration fails or causes issues:

1. **Stop API Server**
   ```bash
   # Stop all API instances
   ```

2. **Restore from Backup**
   ```bash
   # Drop current database (CAUTION: This deletes all data)
   dropdb settler
   
   # Restore from backup
   createdb settler
   psql -U postgres -d settler < settler_backup_YYYYMMDD_HHMMSS.sql
   ```

3. **Investigate Issues**
   - Check PostgreSQL logs: `/var/log/postgresql/postgresql-*.log`
   - Review migration errors
   - Fix issues and retry migration

## Troubleshooting

### Common Issues

1. **Extension Not Found**
   ```
   ERROR: extension "uuid-ossp" does not exist
   ```
   **Solution:**
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   ```

2. **Permission Denied**
   ```
   ERROR: permission denied to create extension
   ```
   **Solution:** Run as superuser or grant privileges:
   ```sql
   GRANT CREATE ON DATABASE settler TO settler_user;
   ```

3. **RLS Policy Already Exists**
   ```
   ERROR: policy "tenant_isolation_jobs" for table "jobs" already exists
   ```
   **Solution:** This is expected if running migration multiple times. The migration uses `CREATE POLICY IF NOT EXISTS` where possible.

4. **Tenant ID Not Set**
   ```
   ERROR: invalid input syntax for type uuid
   ```
   **Solution:** Ensure tenant context is set before queries:
   ```sql
   SET app.current_tenant_id = 'your-tenant-uuid';
   ```

### Performance Considerations

- **Large Tables:** For tables with millions of rows, consider running index creation separately:
  ```sql
  CREATE INDEX CONCURRENTLY idx_jobs_tenant_id ON jobs(tenant_id);
  ```

- **Materialized Views:** Refresh after migration:
  ```sql
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_reconciliation_summary_daily;
  ```

- **Statistics:** Update table statistics:
  ```sql
  ANALYZE jobs;
  ANALYZE executions;
  ```

## Environment Variables

After migration, ensure these environment variables are set:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=settler
DB_USER=settler_user
DB_PASSWORD=your_secure_password
ENCRYPTION_KEY=your_32_or_64_byte_hex_key
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
```

## Next Steps

1. Create initial tenant:
   ```sql
   INSERT INTO tenants (name, slug, tier) 
   VALUES ('Default Tenant', 'default', 'free') 
   RETURNING id;
   ```

2. Create admin user:
   ```sql
   INSERT INTO users (tenant_id, email, password_hash, role) 
   VALUES (
     'tenant-uuid-from-above',
     'admin@example.com',
     'bcrypt-hashed-password',
     'admin'
   );
   ```

3. Start API server - it will automatically verify schema on startup

## Support

For migration issues:
- Check logs: `packages/api/logs/`
- Review error messages in PostgreSQL logs
- Contact: support@settler.io
