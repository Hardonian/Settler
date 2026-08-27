# Migration Cleanup Strategy

This document outlines the strategy for resolving the "18K-line monolithic migration" audit finding, transitioning away from the legacy `20240101000000_settler_golden_schema.sql` monolith to a structured, maintainable migration history.

## The Problem

The `20240101000000_settler_golden_schema.sql` file is over 18,000 lines (667KB) and contains the entire historical state of the database instead of discrete, manageable schema migrations. Adding more migrations on top of this monolith without a cleanup strategy violates operational best practices.

## The Solution: Supabase Migration Squashing

We will use a documented "squash" strategy to safely replace the monolithic file with the consolidated baseline, without losing the migration history in production.

### Step-by-step Cleanup Instructions:

1. **Verify Baseline Parity**
   Ensure that `00000000000000_consolidated_baseline.sql` contains the exact equivalent schema to `20240101000000_settler_golden_schema.sql` plus all historical patches up to the consolidation point. (This was verified during the migration audit, see `MIGRATION_AUDIT_REPORT.md`).

2. **Mark the Baseline as Applied in Production**
   Before deleting the monolith, you must manually insert a migration record for the new baseline in the production database so Supabase does not attempt to run it:

   ```sql
   INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('00000000000000');
   ```

3. **Delete the Monolith and Legacy Patches**
   Delete `20240101000000_settler_golden_schema.sql` and any patch files (e.g. `20240101000001_*.sql` to `20251128200000_*.sql`) that were incorporated into the consolidated baseline.

   ```bash
   rm supabase/migrations/20240101000000_settler_golden_schema.sql
   # ... delete other consolidated legacy files
   ```

4. **Verify Local Reset (Development)**
   Test the new squashed state locally by resetting your local Supabase instance:

   ```bash
   supabase db reset
   ```

   This will run the `00000000000000_consolidated_baseline.sql` followed by the new post-consolidation migrations (e.g., `2026*`).

5. **Commit the Squashed History**
   Commit the deletion of the legacy files. The Git history will preserve the old monolith for reference, but the active repository will only contain the consolidated baseline and recent discrete migrations.

## Future Policy

- **No Monoliths:** Do not edit the baseline migration for new changes.
- **Discrete Files:** Every schema change must be a discrete `supabase db diff` or `supabase migration new` file.
- **Periodic Squashing:** When the number of migration files exceeds 50, perform another squash into a new baseline.
