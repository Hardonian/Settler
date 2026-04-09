# Automatic Database Migrations

## Overview

Database migrations are now **automatically applied** when:

1. **PR Push**: When you push changes to a PR that include migration files
2. **PR Merge**: When a PR with migrations is merged to `main`

No manual CLI commands or local setup required! 🎉

## How It Works

### 1. PR Push (Preview/Test Environment)

**Workflow**: `.github/workflows/auto-migrate-on-pr-push.yml`

**Triggers when:**

- PR is opened, updated, or reopened
- Files changed include:
  - `supabase/migrations/**/*.sql`
  - `prisma/migrations/**`
  - `prisma/schema.prisma`

**What happens:**

- Detects migration file changes
- Runs migrations against **preview/test database** (safe to test)
- Verifies migrations applied successfully
- Creates summary comment

**Environment**: Uses `preview` environment secrets (falls back to production if preview not available)

### 2. Merge to Main (Production)

**Workflow**: `.github/workflows/supabase-migrate.yml`

**Triggers when:**

- Code is pushed to `main` branch
- Files changed include migration files

**What happens:**

- Detects migration file changes
- Runs migrations against **production database**
- Deploys edge functions (if changed)
- Runs seeds (if changed)
- Verifies deployment

**Environment**: Uses `production` environment secrets

## Required GitHub Secrets

All secrets should be configured in GitHub repository settings under **Settings → Secrets and variables → Actions**.

### Production Secrets (Required)

These are used when merging to `main`:

- `SUPABASE_ACCESS_TOKEN` - Supabase access token
- `SUPABASE_PROJECT_REF` - Supabase project reference ID
- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Direct PostgreSQL connection (for Prisma)
- `SUPABASE_URL` - Supabase API URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SUPABASE_DB_PASSWORD` - Database password

### Preview Secrets (Optional but Recommended)

These are used for PR testing. If not set, production secrets are used (not recommended for safety):

- `SUPABASE_PROJECT_REF_PREVIEW` - Preview Supabase project reference
- `DATABASE_URL_PREVIEW` - Preview database connection string
- `DIRECT_URL_PREVIEW` - Preview direct connection
- `SUPABASE_URL_PREVIEW` - Preview Supabase API URL
- `SUPABASE_ANON_KEY_PREVIEW` - Preview anonymous key
- `SUPABASE_SERVICE_ROLE_KEY_PREVIEW` - Preview service role key
- `SUPABASE_DB_PASSWORD_PREVIEW` - Preview database password

## Migration File Locations

Migrations are automatically detected from:

- **Supabase migrations**: `supabase/migrations/*.sql`
- **Prisma migrations**: `prisma/migrations/**`
- **Prisma schema**: `prisma/schema.prisma`

## Example Workflow

### Adding a New Migration

1. **Create migration file**:

   ```bash
   # Create new migration file
   touch supabase/migrations/20260125000000_console_rls_fixes.sql
   ```

2. **Write your migration SQL**:

   ```sql
   -- Migration: console_rls_fixes
   BEGIN;

   CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
   -- ... your migration code ...
   COMMIT;
   ```

3. **Commit and push**:

   ```bash
   git add supabase/migrations/20260125000000_console_rls_fixes.sql
   git commit -m "Add Console RLS fixes"
   git push origin feature/console-fixes
   ```

4. **Create PR**:
   - Open PR on GitHub
   - **Migration runs automatically** on preview database
   - Check PR checks to see migration status

5. **Merge PR**:
   - Merge PR to `main`
   - **Migration runs automatically** on production database
   - Check Actions tab to see migration status

## Monitoring Migrations

### Check Migration Status

1. **GitHub Actions**: Go to **Actions** tab → Find workflow run → Check logs
2. **PR Comments**: Migration summary is posted as a comment
3. **Workflow Summary**: Check the workflow run summary for details

### Migration Logs

Each migration run includes:

- ✅ Migration files detected
- ✅ Migration validation
- ✅ Migration execution
- ✅ Verification results
- ✅ Summary report

## Troubleshooting

### Migration Failed

1. **Check GitHub Actions logs**:
   - Go to Actions tab
   - Find failed workflow run
   - Check error messages

2. **Common issues**:
   - Missing GitHub secrets → Add required secrets
   - SQL syntax error → Fix migration SQL
   - Database connection issue → Verify DATABASE_URL
   - Permission denied → Check SUPABASE_ACCESS_TOKEN

3. **Rollback**:
   - Create new migration to undo changes
   - Or manually run rollback SQL

### Migration Not Running

1. **Check file paths**:
   - Ensure migration files are in `supabase/migrations/`
   - File names must end with `.sql`

2. **Check workflow triggers**:
   - Verify files changed include migration paths
   - Check workflow is enabled in repository

3. **Check secrets**:
   - Verify all required secrets are set
   - Check secret names match exactly

### Preview vs Production

- **PR Push**: Uses preview environment (safe to test)
- **Merge to Main**: Uses production environment (real data)

If preview secrets are not set, production secrets are used (⚠️ not recommended).

## Best Practices

1. **Always test migrations in PR first**
   - Preview environment runs automatically
   - Verify migrations work before merging

2. **Use descriptive migration names**
   - Format: `YYYYMMDDHHMMSS_description.sql`
   - Example: `20260125000000_console_rls_fixes.sql`

3. **Include rollback instructions**
   - Add comments in migration file
   - Document what the migration does

4. **Verify migrations after merge**
   - Check production database
   - Verify tables/columns exist
   - Test application functionality

5. **Monitor migration runs**
   - Check GitHub Actions after merge
   - Verify no errors occurred

## Security

- ✅ All secrets stored in GitHub Secrets (encrypted)
- ✅ No secrets exposed in logs
- ✅ Migrations run in isolated GitHub Actions environment
- ✅ Preview environment separate from production (if configured)

## Manual Override

If you need to run migrations manually:

```bash
# Using Supabase CLI
supabase db push

# Or using psql directly
psql $DATABASE_URL -f supabase/migrations/your_migration.sql
```

But with automatic migrations, you shouldn't need to! 🚀

## Support

If migrations aren't running automatically:

1. Check GitHub Actions workflow status
2. Verify secrets are configured
3. Check migration file paths and names
4. Review workflow logs for errors
