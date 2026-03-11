# Execution Instructions for Onboarding Migration

## ✅ Setup Complete

All scripts and workflows have been created. Since GitHub Actions secrets are configured, the migration will run automatically in CI/CD.

## 🚀 How to Execute

### Automatic Execution (Recommended)

The GitHub Actions workflow will run automatically when:
1. **Push to main branch** - If migration files are changed
2. **Manual trigger** - From GitHub Actions UI

**To trigger manually:**
1. Go to: `https://github.com/YOUR-ORG/YOUR-REPO/actions`
2. Select workflow: **"Apply Onboarding Migration"**
3. Click: **"Run workflow"**
4. Select environment: **production** or **staging**
5. Click: **"Run workflow"**

### What Happens Automatically

The workflow will:
1. ✅ Apply migration: `npm run db:migrate:onboarding`
2. ✅ Verify migration: Check tables/functions exist
3. ✅ Regenerate types: `npm run db:types:regenerate`
4. ✅ Verify types: `npm run typecheck`
5. ✅ Commit types: Auto-commit generated types back to repo

## 📋 Required GitHub Secrets

Ensure these are set in your repository settings:

- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_URL` - Supabase project URL  
- `SUPABASE_DB_PASSWORD` - Database password
- `SUPABASE_PROJECT_REF` - Project reference ID
- `SUPABASE_ACCESS_TOKEN` - Supabase access token

## 🔍 Verification After Execution

After the workflow completes:

1. **Check workflow logs** in GitHub Actions
2. **Verify tables exist**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_name IN ('workspace_invites', 'tenant_onboarding_progress', 'onboarding_events');
   ```
3. **Check types file**: `packages/web/src/types/database.types.ts` should exist
4. **Run typecheck locally**: `npm run typecheck` should pass

## 📝 Files Created

- ✅ `scripts/apply-onboarding-migration.ts` - Migration script
- ✅ `scripts/regenerate-supabase-types.ts` - Type generation script
- ✅ `.github/workflows/apply-onboarding-migration.yml` - GitHub Actions workflow
- ✅ `supabase/migrations/20260131000000_workspace_onboarding_activation.sql` - Migration SQL

## 🎯 Next Steps

1. **Push to trigger workflow** OR **Run manually from GitHub Actions**
2. **Monitor execution** in GitHub Actions tab
3. **Verify results** after completion
4. **Update code** to remove `as any` assertions once types are generated

---

**Note**: The commands (`npm run db:migrate:onboarding`, `npm run db:types:regenerate`, `npm run typecheck`) are configured to run automatically in the GitHub Actions workflow using your repository secrets. You don't need to run them manually - just trigger the workflow!
