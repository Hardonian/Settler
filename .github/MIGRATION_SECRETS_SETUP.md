# GitHub Secrets Setup for Migrations

## Required Secrets

Set these in GitHub repository: `Settings > Secrets and variables > Actions`

### Staging Environment

| Secret Name                    | Description                          | Example                                                                                  |
| ------------------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------- |
| `SUPABASE_DB_URL_STAGING`      | PostgreSQL connection string         | `postgresql://postgres.xxx:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres` |
| `SUPABASE_DB_PASSWORD_STAGING` | Database password                    | `your-staging-password`                                                                  |
| `SUPABASE_PROJECT_ID_STAGING`  | Supabase project ID (optional)       | `abcdefghijklmnop`                                                                       |
| `SUPABASE_ACCESS_TOKEN`        | Supabase API access token (optional) | `sbp_xxx...`                                                                             |

### Production Environment

| Secret Name                       | Description                    | Example                                                                                  |
| --------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------- |
| `SUPABASE_DB_URL_PRODUCTION`      | PostgreSQL connection string   | `postgresql://postgres.xxx:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres` |
| `SUPABASE_DB_PASSWORD_PRODUCTION` | Database password              | `your-production-password`                                                               |
| `SUPABASE_PROJECT_ID_PRODUCTION`  | Supabase project ID (optional) | `abcdefghijklmnop`                                                                       |
| `SUPABASE_ACCESS_TOKEN`           | Same token (can be shared)     | `sbp_xxx...`                                                                             |

## Getting Connection Strings

### From Supabase Dashboard

1. Go to your Supabase project
2. Navigate to `Settings > Database`
3. Scroll to "Connection string" section
4. Select "URI" format
5. Copy the connection string
6. Replace `[YOUR-PASSWORD]` with your actual database password

**Format**:

```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

### Connection String Components

- **Host**: `aws-0-us-west-1.pooler.supabase.com` (or your region)
- **Port**: `6543` (pooler) or `5432` (direct)
- **Database**: `postgres`
- **User**: `postgres.[PROJECT_REF]`
- **Password**: Your database password

## Environment Protection

### Staging Environment

- No protection rules needed
- Auto-applies on push to `main`/`develop`

### Production Environment

- **REQUIRED**: Set up environment protection
  1. Go to `Settings > Environments`
  2. Create `production` environment
  3. Add "Required reviewers" (at least 1)
  4. Optionally add deployment branches

## Testing Secrets

### Test Connection String Locally

```bash
# Test staging connection
psql "$SUPABASE_DB_URL_STAGING" -c "SELECT version();"

# Test production connection (be careful!)
psql "$SUPABASE_DB_URL_PRODUCTION" -c "SELECT version();"
```

### Verify Secrets in GitHub Actions

The workflow will:

1. Validate connection strings on workflow run
2. Apply migrations in order
3. Verify tables exist after migration
4. Report success/failure in workflow summary

## Security Best Practices

1. ✅ **Never commit secrets** to repository
2. ✅ **Use different passwords** for staging/production
3. ✅ **Rotate passwords** regularly
4. ✅ **Limit access** to repository secrets
5. ✅ **Use environment protection** for production
6. ✅ **Monitor migration logs** for unauthorized access
7. ✅ **Use connection pooling** (port 6543) for better performance

## Troubleshooting

### Connection Failed

- Verify connection string format
- Check password is correct
- Verify IP allowlist (if enabled in Supabase)
- Check Supabase project is active

### Migration Failed

- Check SQL syntax in migration file
- Verify dependencies (tables/functions exist)
- Check RLS policies don't block migration
- Review GitHub Actions logs

### RLS Blocking Queries

- Verify `tenant_users` table exists
- Check user is member of tenant
- Verify RLS policies are correct
- Test with service role key (bypasses RLS)

## Migration Workflow

### Automatic (on push)

```bash
git add supabase/migrations/20260130000000_new_migration.sql
git commit -m "Add new migration"
git push origin main
# Workflow automatically applies to staging
```

### Manual (production)

1. Go to `Actions` tab
2. Select "Apply Database Migrations (Safe Mode)"
3. Click "Run workflow"
4. Select `production` environment
5. Review and approve
6. Workflow applies migrations

## Verification After Migration

### Check Tables

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('receipts', 'ai_analysis_usage', 'ai_analyses');
```

### Check RLS

```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('receipts', 'ai_analysis_usage', 'ai_analyses');
```

### Check Policies

```sql
SELECT tablename, policyname FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('receipts', 'ai_analysis_usage', 'ai_analyses');
```

## Current Migrations to Apply

1. ✅ `20260130000000_settler_receipts_hash_chain.sql`
2. ✅ `20260130000001_settler_tenant_context_helper.sql`
3. ✅ `20260130000002_settler_rls_hardening.sql`
4. ✅ `20260130000003_settler_ai_tokens.sql`

**Total**: 4 migrations

## Support

If migrations fail:

1. Check GitHub Actions logs
2. Review migration SQL syntax
3. Verify database connection
4. Check RLS policies
5. Contact team if issues persist
