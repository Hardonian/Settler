# Auto-Migration Setup

**Date:** January 2026  
**Status:** ✅ Active  
**Purpose:** Documentation for automatic database migrations on merge to main

---

## Overview

All database migrations in `supabase/migrations/` are automatically applied when code is merged to the `main` branch.

---

## How It Works

### Trigger

The workflow (`supabase-migrate.yml`) automatically runs when:
- Code is pushed to `main` branch
- Files in `supabase/migrations/` are changed
- Workflow is manually triggered via `workflow_dispatch`

### Process

1. **Detection:** Workflow detects changed migration files
2. **Validation:** Validates migration files are valid SQL
3. **Application:** Applies all migrations in alphabetical order
4. **Verification:** Verifies key tables and functions exist
5. **Notification:** Sends alerts if migrations fail

---

## Migration Files

### Location
All migrations must be in: `supabase/migrations/`

### Naming Convention
- Use numbered prefixes: `00000089_support_tickets_sla_tracking.sql`
- Files are applied in alphabetical order
- Use descriptive names after the number

### Format
- Use `CREATE TABLE IF NOT EXISTS` for tables
- Use `CREATE OR REPLACE FUNCTION` for functions
- Include comments explaining the migration
- Use transactions where appropriate

---

## Current Migrations

### New Migrations Added

**00000089_support_tickets_sla_tracking.sql**
- Creates `support_tickets` table
- Adds SLA tracking columns
- Creates `check_sla_violations()` function
- Adds RLS policies

---

## Verification

After migrations run, the workflow verifies:
- ✅ Key tables exist (`receipts`, `ai_analysis_usage`, `ai_analyses`, `support_tickets`)
- ✅ Key functions exist (`set_tenant_context`, `check_sla_violations`)
- ✅ RLS policies are configured

---

## Failure Handling

If migrations fail:
1. Workflow stops immediately
2. GitHub issue is created automatically
3. Team is notified via GitHub notifications
4. Manual intervention required

### Common Issues

**Migration Already Applied:**
- Migrations use `IF NOT EXISTS` clauses
- Safe to re-run migrations
- Workflow handles gracefully

**SQL Syntax Errors:**
- Check migration file syntax
- Test locally before committing
- Use `psql` to validate SQL

**Permission Errors:**
- Check database credentials
- Verify service role permissions
- Check RLS policies

---

## Manual Migration

If needed, migrations can be run manually:

```bash
# Using psql
export PGPASSWORD="$SUPABASE_DB_PASSWORD"
psql "$DATABASE_URL" -f supabase/migrations/00000089_support_tickets_sla_tracking.sql

# Using Supabase CLI
supabase db push
```

---

## Testing Migrations

Before merging to main:

1. **Test Locally:**
   ```bash
   # Start local Supabase
   supabase start
   
   # Apply migrations
   supabase db reset
   ```

2. **Test in Preview:**
   - Create PR
   - Preview environment runs migrations automatically
   - Verify migrations succeed

3. **Merge to Main:**
   - Migrations run automatically in production
   - Monitor workflow for success

---

## Monitoring

### Workflow Status
- Check GitHub Actions: `.github/workflows/supabase-migrate.yml`
- View run history and logs
- Set up notifications for failures

### Database Status
- Verify tables exist: `SELECT * FROM information_schema.tables WHERE table_schema = 'public';`
- Check functions: `SELECT proname FROM pg_proc WHERE proname LIKE '%sla%';`
- Verify RLS: `SELECT * FROM pg_policies WHERE tablename = 'support_tickets';`

---

## Best Practices

1. **Always use `IF NOT EXISTS`:**
   ```sql
   CREATE TABLE IF NOT EXISTS support_tickets (...);
   ```

2. **Include rollback instructions:**
   ```sql
   -- Rollback: DROP TABLE IF EXISTS support_tickets CASCADE;
   ```

3. **Test migrations locally first**

4. **Keep migrations small and focused**

5. **Document migrations in commit messages**

6. **Review migrations in PR before merging**

---

## Related Workflows

- **supabase-migrate.yml:** Main migration workflow (runs on main)
- **migrations.yml:** Alternative migration workflow (staging/production)
- **ci.yml:** CI checks (validates but doesn't apply migrations)

---

**Status:** ✅ Active  
**Last Updated:** January 2026  
**Next Review:** After next migration
