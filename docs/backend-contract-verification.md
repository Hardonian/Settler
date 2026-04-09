# Backend Contract Verification

This document describes the backend contract verification system for ensuring the live Supabase database matches the expected schema and infrastructure defined in the repository.

## Overview

The backend contract verification system:

1. **Queries live database** to discover actual state (tables, columns, indexes, RLS policies, functions, etc.)
2. **Compares against expected contract** from migrations and app code usage
3. **Generates reconciliation migrations** to fix differences
4. **Provides healthcheck endpoints** for runtime monitoring
5. **Runs automated tests** to verify RLS policies and access patterns

## Quick Start

### Verify Backend Contract

```bash
# Full verification (requires SUPABASE_SERVICE_ROLE_KEY)
npm run db:verify

# Smoke tests (requires SUPABASE_SERVICE_ROLE_KEY)
npm run db:smoke

# Test RLS policies (requires DATABASE_URL)
npm run db:test:rls

# Generate reconciliation migration
npm run db:reconcile
```

### Healthcheck Endpoint

The healthcheck endpoint (`/api/health`) includes backend contract verification:

```bash
curl https://your-app.com/api/health
```

Response includes:

- `checks.backendContract`: Status of critical tables
- `checks.supabase`: Supabase connectivity
- `checks.database`: Database connectivity

## Scripts

### `scripts/verify-backend-contract.ts`

Comprehensive verification script that queries live database catalogs:

**What it checks:**

- Extensions (uuid-ossp, pgcrypto, etc.)
- Schemas (public, app_private, analytics)
- Tables (existence, columns, types)
- Indexes (critical indexes for performance)
- Constraints (primary keys, foreign keys, unique)
- RLS (enabled status, policies)
- Functions (RPC functions)
- Triggers (updated_at triggers)
- Storage buckets
- Realtime publications

**Usage:**

```bash
# Basic verification
tsx scripts/verify-backend-contract.ts

# With reconciliation mode
tsx scripts/verify-backend-contract.ts --reconcile
```

**Output:**

- Prints results to console
- Saves JSON report to `supabase/backend-verification-results.json`

### `scripts/smoke-test-backend.ts`

Performs real queries against Supabase to verify:

- Anon client connectivity
- Service role connectivity
- RLS enforcement
- RPC function callability
- Table accessibility

**Usage:**

```bash
tsx scripts/smoke-test-backend.ts
```

### `scripts/test-rls-policies.ts`

Tests RLS policies by:

- Creating test users and tenants
- Testing anonymous access (should be blocked)
- Testing authenticated access
- Verifying tenant isolation

**Usage:**

```bash
tsx scripts/test-rls-policies.ts
```

**Note:** This script creates and cleans up test data automatically.

### `scripts/generate-reconciliation-migration.ts`

Generates an idempotent SQL migration to reconcile differences:

**Usage:**

```bash
# After running verification
tsx scripts/generate-reconciliation-migration.ts [verification-results.json]
```

**Output:**

- Creates migration file: `supabase/migrations/[timestamp]_backend_contract_reconcile.sql`

## Expected Contract

The expected contract is derived from:

1. **Golden Schema Migration** (`supabase/migrations/00000000_settler_golden_schema.sql`)
   - Defines all tables, columns, indexes, constraints
   - Source of truth for schema

2. **App Code Usage** (scanned automatically)
   - RPC function calls (`.rpc()`)
   - Table references (`.from()`)
   - Storage bucket usage

3. **Prisma Schema** (`prisma/schema.prisma`)
   - Type definitions
   - Relationships
   - Indexes

## Reconciliation Process

When differences are found:

1. **Run verification:**

   ```bash
   npm run db:verify
   ```

2. **Review results:**

   ```bash
   cat supabase/backend-verification-results.json
   ```

3. **Generate reconciliation migration:**

   ```bash
   npm run db:reconcile
   ```

4. **Review migration:**

   ```bash
   cat supabase/migrations/[timestamp]_backend_contract_reconcile.sql
   ```

5. **Apply migration:**

   ```bash
   supabase db push
   ```

6. **Re-verify:**
   ```bash
   npm run db:verify
   ```

## CI Integration

Backend verification runs in CI:

- **Schema validation**: Checks that verification scripts exist and compile
- **Healthcheck verification**: Ensures healthcheck endpoint includes backend contract checks
- **Dry-run mode**: Runs without requiring production credentials

For full verification with live database, run locally with `SUPABASE_SERVICE_ROLE_KEY` set.

## Environment Variables

Required for full verification:

```bash
# Supabase connection
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Direct database connection (for RLS tests)
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
# OR
DIRECT_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

## Troubleshooting

### "Missing SUPABASE_SERVICE_ROLE_KEY"

The verification script requires service role key for full database access. Set it in your `.env` file or export it:

```bash
export SUPABASE_SERVICE_ROLE_KEY=your-key
```

### "Table X does not exist"

If a table is missing:

1. Check if it's defined in the golden schema migration
2. Check if migrations have been applied: `supabase migration list`
3. Apply missing migrations: `supabase db push`

### "RLS not enabled on table X"

Enable RLS:

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

Then add policies (see golden schema migration for examples).

### "Function X is missing"

Check if the function is defined in a migration file. If not, create it:

```sql
CREATE OR REPLACE FUNCTION function_name(...)
RETURNS ...
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- function body
END;
$$;
```

## Best Practices

1. **Run verification before deployments** to catch schema drift early
2. **Review reconciliation migrations** before applying - some require manual implementation
3. **Keep golden schema migration up-to-date** - it's the source of truth
4. **Test RLS policies** regularly to ensure tenant isolation
5. **Monitor healthcheck endpoint** in production for early detection of issues

## Related Documentation

- [Migrations Guide](../supabase/migrations/README.md)
- [RLS Policies](../supabase/migrations/00000004_rls_consolidation.sql)
- [Healthcheck API](../../packages/web/src/app/api/health/route.ts)
