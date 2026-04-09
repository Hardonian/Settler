# Production Parity Guarantees

This document describes how Settler.dev maintains **production parity** - ensuring that code, database, infrastructure, and documentation are always in sync.

## The Problem We Solve

Historically, SaaS applications suffer from:

- **Schema drift**: Production database differs from migrations
- **Ghost routes**: Frontend routes that reference non-existent backend resources
- **Theoretical features**: Features documented but not implemented
- **Orphaned tables**: Database tables with no consumers
- **Silent failures**: 500 errors in production that don't appear in development

## Our Solution

### 1. Golden Migration (Single Source of Truth)

**File**: `supabase/migrations/00000000_settler_golden_schema.sql`

- **Idempotent**: Safe to run multiple times (uses `IF NOT EXISTS`, `DO` blocks)
- **Complete**: Defines the entire database schema in one file
- **Authoritative**: This is the source of truth, not historical migrations

**Historical migrations** are archived to `supabase/migrations/_archive/` for forensic reference only.

### 2. Production Schema Introspection

**Script**: `scripts/introspect-production-schema.ts`

Connects to live Supabase production and enumerates:

- All schemas, tables, columns, types, enums
- Constraints (PK, FK, UNIQUE, CHECK)
- Indexes
- RLS enabled/disabled state
- Policies (including permissive vs restrictive)
- Functions, triggers, views

**Output**: `supabase/production-schema.json`

### 3. Schema Parity Verification

**CI Workflow**: `.github/workflows/schema-parity-check.yml`

On every PR and main commit:

1. Connects to Supabase production
2. Runs the golden migration (dry-run)
3. Verifies idempotency (re-run causes zero changes)
4. Compares production schema to migration files
5. Checks RLS policies on sensitive tables
6. Generates schema manifest

**CI fails loudly if**:

- Prod schema diverges from migrations
- Someone adds a table manually
- A migration breaks idempotency

### 4. Frontend ↔ Backend Contract Mapping

**Script**: `scripts/map-frontend-backend-contracts.ts`

Maps all frontend routes to:

- Required tables
- Required functions
- Required RLS permissions

**Output**: `supabase/frontend-backend-contracts.json`

**Detects**:

- Routes referencing non-existent tables
- Routes referencing non-existent functions
- Routes without backend dependencies (marketing-only)

### 5. Edge Functions Verification

**Script**: `scripts/verify-edge-functions.ts`

Verifies that all edge functions:

- Deploy successfully
- Have required tables in the database
- Have required functions in the database
- Are not theoretical (actually exist and execute)

**Output**: `supabase/edge-functions-verification.json`

### 6. Pipe Dream Signal Detection

**Script**: `scripts/find-pipe-dream-signals.ts`

Finds features that exist only in documentation but not in code:

- Features mentioned in README but not implemented
- UI elements with no backend
- Tables with no consumers
- Routes that render but do nothing
- Config flags that are never read
- Environment variables that are unused

**Output**: `supabase/pipe-dream-signals.json`

## Usage

### Run All Checks

```bash
npm run verify:production-parity
```

### Individual Checks

```bash
# Introspect production database
npm run verify:schema-introspect

# Map frontend routes to backend
npm run verify:frontend-contracts

# Verify edge functions
npm run verify:edge-functions

# Find pipe dream signals
npm run verify:pipe-dreams
```

### Consolidate Migrations

```bash
# Generate golden migration from all historical migrations
npm run migrations:consolidate
```

## CI/CD Integration

The `schema-parity-check.yml` workflow runs automatically on:

- Every push to `main`
- Every PR that touches migration files or Prisma schema

**Required Secrets**:

- `DATABASE_URL`: Production database connection string
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for introspection

## Schema Manifest

After introspection, a schema manifest is generated at `supabase/SCHEMA_MANIFEST.md`:

```markdown
# Settler.dev Database Schema Manifest

**Generated:** 2025-01-XX
**Source:** Production database introspection

## Summary

- **Schemas:** 1
- **Tables:** 50+
- **Functions:** 20+
- **Triggers:** 10+
- **Views:** 5+
- **Enums:** 8+

## Tables

- `public.users` (RLS: true, Policies: 3)
- `public.billing_accounts` (RLS: true, Policies: 5)
  ...
```

## Verification Artifacts

All verification scripts generate JSON artifacts:

- `supabase/production-schema.json`: Complete production schema
- `supabase/frontend-backend-contracts.json`: Route-to-backend mapping
- `supabase/edge-functions-verification.json`: Edge function status
- `supabase/pipe-dream-signals.json`: Pipe dream signals

These artifacts are uploaded as GitHub Actions artifacts for review.

## Success Criteria

Production parity is achieved when:

1. ✅ Golden migration runs cleanly on prod
2. ✅ Re-running golden migration causes zero changes
3. ✅ CI blocks schema drift
4. ✅ Console routes load in production without 500s
5. ✅ No unexplained 500s remain
6. ✅ Repo reflects reality, not aspiration

## Troubleshooting

### "Production schema not found"

Run: `npm run verify:schema-introspect`

Requires `DATABASE_URL` environment variable pointing to production.

### "Golden migration not idempotent"

Check for:

- Missing `IF NOT EXISTS` clauses
- Non-idempotent `ALTER TABLE` statements
- Policies created without `DROP POLICY IF EXISTS`

### "Orphaned table references"

Either:

1. Remove the reference from frontend code, or
2. Add the table to the golden migration

### "Edge function references non-existent table"

Either:

1. Remove the reference from edge function, or
2. Add the table to the golden migration

## Future Enhancements

- [ ] Automated schema diff visualization
- [ ] Migration rollback verification
- [ ] Performance regression detection
- [ ] RLS policy effectiveness analysis
- [ ] Query performance analysis
