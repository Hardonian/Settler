# Migration Instructions

## Current Status

✅ **Migration automation is set up** but needs to be committed and merged to main branch.

## To Run Migrations Now

### Option 1: Use Existing Workflow (Recommended)

The existing "Supabase Migration on Merge" workflow runs automatically on pushes to main. To trigger it:

1. **Commit and push your changes:**
   ```bash
   git add .github/workflows/migrate-on-comment.yml
   git add scripts/ docs/ archive/
   git commit -m "Add automated migration workflow"
   git push
   ```

2. **Merge to main** (or push directly to main if you have access)

3. The workflow will automatically run and apply migrations

### Option 2: Manual Trigger via GitHub UI

1. Go to: https://github.com/shardie-github/Settler/actions/workflows/supabase-migrate.yml
2. Click "Run workflow" (if available)
3. Select branch and run

### Option 3: Comment Trigger (After Merge)

Once the new workflow is merged to main:

1. Open any issue or PR
2. Comment: `migrate`
3. The workflow will automatically run

### Option 4: Local Migration (If Credentials Available)

If you have Supabase credentials locally:

```bash
export SUPABASE_PROJECT_REF="your-project-ref"
export SUPABASE_ACCESS_TOKEN="your-token"
./scripts/apply-pending-migrations.sh
```

## Required GitHub Secrets

Before migrations can run, ensure these secrets are set:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `DATABASE_URL` (optional)

See `docs/github-secrets-migration.md` for setup instructions.

## Next Steps

1. ✅ Review the new workflow file: `.github/workflows/migrate-on-comment.yml`
2. ✅ Commit and push changes
3. ✅ Merge to main branch
4. ✅ Add GitHub secrets if not already set
5. ✅ Test by commenting `migrate` on an issue

## Files Ready to Commit

- `.github/workflows/migrate-on-comment.yml` - New migration workflow
- `scripts/apply-pending-migrations.sh` - Migration script
- `scripts/check-migration-status.sh` - Status check script
- `scripts/trigger-migration.sh` - Trigger helper
- `scripts/validate-migration-setup.sh` - Setup validator
- `docs/github-secrets-migration.md` - Secrets documentation
- `docs/migration-automation-setup.md` - Usage guide
- `archive/deprecated_code/migrations/` - Archived migrations (31 files)
