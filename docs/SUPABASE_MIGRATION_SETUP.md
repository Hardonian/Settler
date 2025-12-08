# Supabase Auto-Migration Setup Guide

This document describes the automated Supabase migration pipeline configured for this repository.

## Overview

The migration pipeline automatically runs all outstanding Supabase migrations, RLS policies, functions, and triggers when a PR merges to `main`. Zero CLI commands required post-merge. Fully automated database deployment pipeline.

## Features

- ✅ **Automatic Execution** — Migrations run on merge to main, no manual triggers
- ✅ **Idempotent** — Safe to run multiple times, skip already-applied migrations
- ✅ **Ordered** — Migrations execute in timestamp order, dependencies respected
- ✅ **Verified** — Health checks confirm successful deployment
- ✅ **Rollback-Ready** — Failed migrations halt pipeline, preserve database state
- ✅ **Secrets-Safe** — All credentials in GitHub Secrets, never in code

## Directory Structure

```
supabase/
├── migrations/          # SQL migration files (YYYYMMDDHHMMSS_description.sql)
├── functions/           # Edge Functions
├── seeds/               # Seed data for development
│   └── seed.sql
└── config.toml          # Supabase project configuration
```

## GitHub Secrets Required

Configure these secrets in **Settings > Secrets and variables > Actions**:

### Required Secrets

| Secret Name | Description | Where to Find |
|------------|-------------|---------------|
| `SUPABASE_ACCESS_TOKEN` | Personal access token for Supabase CLI | [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_DB_PASSWORD` | Database password | Project Settings > Database |
| `SUPABASE_PROJECT_ID` | Project ID (UUID) | Project Settings > General |
| `SUPABASE_PROJECT_REF` | Project reference string | Found in project URL: `https://[ref].supabase.co` |
| `DATABASE_URL` | Pooled Postgres connection string | Project Settings > Database > Connection string (port 6543) |
| `DIRECT_URL` | Direct Postgres connection string | Project Settings > Database > Connection string (port 5432) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://[ref].supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS) | Project Settings > API > Service role key |

### Connection String Formats

**DATABASE_URL** (Pooled, port 6543):
```
postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**DIRECT_URL** (Direct, port 5432):
```
postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

## Creating Migrations

### Using the Helper Script

```bash
npm run db:new <migration_name>
```

Example:
```bash
npm run db:new add_user_preferences_table
```

This creates: `supabase/migrations/20240115143022_add_user_preferences_table.sql`

### Manual Creation

1. Create file: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
2. Use timestamp format: `YYYYMMDDHHMMSS` (year, month, day, hour, minute, second)
3. Wrap all SQL in transaction:
   ```sql
   BEGIN;
   
   -- Your SQL here
   
   COMMIT;
   ```

### Migration Best Practices

1. **Always use transactions** — Wrap migrations in `BEGIN;` and `COMMIT;`
2. **Use IF EXISTS/IF NOT EXISTS** — Make migrations idempotent
3. **Use DROP ... IF EXISTS** — Prevent errors on re-runs
4. **Test locally first** — Run `npm run db:push` before committing
5. **Verify before commit** — Pre-commit hook runs `npm run db:verify`

## Package Scripts

| Script | Description |
|--------|-------------|
| `npm run db:new <name>` | Create a new migration file |
| `npm run db:verify` | Verify all migration files |
| `npm run db:push` | Push migrations to linked project |
| `npm run db:reset` | Reset local database |
| `npm run db:diff` | Generate diff migration |
| `npm run db:dump` | Dump schema to SQL file |
| `npm run db:types` | Generate TypeScript types |
| `npm run db:migrate:local` | Run migrations locally |
| `npm run db:migrate:prod` | Push all migrations to production |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Deploy Prisma migrations |
| `npm run prisma:push` | Push Prisma schema changes |

## Workflow Triggers

The migration workflow (`supabase-migrate.yml`) triggers on:

1. **Push to main** — When files change in:
   - `supabase/migrations/**`
   - `supabase/functions/**`
   - `supabase/seeds/**`
   - `prisma/migrations/**`
   - `prisma/schema.prisma`

2. **Manual dispatch** — Can be triggered manually from Actions tab with options:
   - Run seeds (optional)
   - Target environment (production/staging)

## Workflow Jobs

1. **detect-changes** — Detects what changed (migrations, functions, seeds)
2. **migrate-supabase** — Runs Supabase migrations in order
3. **migrate-prisma** — Runs Prisma migrations (if Prisma detected)
4. **deploy-functions** — Deploys Edge Functions
5. **run-seeds** — Runs seed files (optional)
6. **verify-deployment** — Verifies schema and creates summary
7. **notify-failure** — Creates GitHub issue on failure

## Migration File Templates

### Table Creation

```sql
-- Migration: create_tables
-- Description: Initial table schema

BEGIN;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMIT;
```

### RLS Policies

```sql
-- Migration: enable_rls
-- Description: Row Level Security policies

BEGIN;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

COMMIT;
```

### Functions and Triggers

```sql
-- Migration: create_functions
-- Description: Utility functions and triggers

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

COMMIT;
```

## Rollback Procedure

⚠️ **Emergency rollback only** — Use with caution!

1. Create rollback migration: `npm run db:new rollback_<original_migration_name>`
2. Copy template from `supabase/migrations/rollback_template.sql`
3. Write reverse SQL (DROP tables, remove columns, etc.)
4. Commit and push — workflow will apply automatically

**Example:**
```sql
-- Rollback for: 20240115143022_add_user_preferences_table.sql
BEGIN;

DROP TABLE IF EXISTS public.user_preferences;
DROP POLICY IF EXISTS "user_preferences_policy" ON public.user_preferences;

COMMIT;
```

## Local Testing

### Test Migration Locally

```bash
# Link to your project
supabase link --project-ref <your-project-ref>

# Push migrations
npm run db:push

# Verify status
supabase migration list
```

### Test Workflow Locally (Optional)

Install [act](https://github.com/nektos/act) for local GitHub Actions testing:

```bash
# Install act
brew install act  # macOS
# or download from: https://github.com/nektos/act/releases

# Test workflow
act push --secret-file .env.local
```

## Troubleshooting

### Migration Fails in CI

1. Check workflow logs in GitHub Actions
2. Verify all secrets are set correctly
3. Check migration file format (timestamp, BEGIN/COMMIT)
4. Verify SQL syntax is valid
5. Check if migration conflicts with existing schema

### Migration Already Applied

Supabase tracks applied migrations. If a migration fails partway:
1. Check `supabase_migrations.schema_migrations` table
2. Manually mark as applied if needed (advanced)
3. Or fix migration and re-run

### Type Generation Fails

1. Ensure `SUPABASE_PROJECT_REF` is set
2. Check `SUPABASE_ACCESS_TOKEN` is valid
3. Verify project is linked: `supabase link --project-ref <ref>`

## Verification Checklist

Before declaring migrations complete, verify:

- [ ] `supabase/migrations/` directory exists with at least one `.sql` file
- [ ] `.github/workflows/supabase-migrate.yml` exists and valid YAML
- [ ] `supabase/config.toml` exists with correct project ref placeholder
- [ ] `scripts/new-migration.sh` exists and executable
- [ ] `scripts/verify-migrations.sh` exists and executable
- [ ] `package.json` has `db:*` scripts
- [ ] All GitHub secrets are configured
- [ ] Workflow triggers on push to main with migration path changes
- [ ] Workflow can be manually triggered via `workflow_dispatch`

## Support

For issues or questions:
1. Check workflow logs in GitHub Actions
2. Review migration files for syntax errors
3. Verify secrets are correctly configured
4. Check Supabase dashboard for migration status
