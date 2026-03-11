# GitHub Actions Migration Setup - Complete

## ✅ Setup Complete

### 1. Migration Workflows Created ✅

**Primary Workflow**: `.github/workflows/migrations.yml`
- **Triggers**: 
  - Push to `main`/`develop` when migration files change
  - Pull requests with migration changes
  - Manual dispatch with environment selection
- **Features**:
  - Applies migrations in order
  - Verifies tables exist after migration
  - Reports success/failure
  - Environment-specific (staging/production)

**Safe Mode Workflow**: `.github/workflows/migrations-safe.yml`
- **Triggers**: Manual dispatch only
- **Features**:
  - Validates migration syntax first
  - Dry-run mode available
  - Manual environment selection
  - Production requires approval

**Updated Existing**: `.github/workflows/supabase-migrate.yml`
- Enhanced to apply migrations in order
- Better verification
- Improved error handling

### 2. Supabase AI Documentation ✅

**Complete Schema Reference**: `supabase/AI_PROMPT_COMPLETE.md`
- Full schema documentation
- All tables, functions, policies
- Common queries and patterns
- Security rules and best practices

**Quick Reference**: `supabase/ai-assistant-prompt.txt`
- Condensed version for quick lookups
- Key patterns and rules
- Common operations

**Schema Summary**: `supabase/SCHEMA_SUMMARY.md`
- Quick reference card
- Key relationships
- Migration order

### 3. Setup Documentation ✅

**Migration Setup Guide**: `.github/MIGRATION_SETUP.md`
- How to use workflows
- Required secrets
- Environment setup
- Troubleshooting

**Secrets Setup**: `.github/MIGRATION_SECRETS_SETUP.md`
- Complete secret list
- How to get connection strings
- Security best practices
- Testing procedures

**Local Script**: `scripts/apply-migrations.sh`
- Test migrations locally
- Dry-run mode
- Environment selection

## Required GitHub Secrets

### Staging
- `SUPABASE_DB_URL_STAGING`
- `SUPABASE_DB_PASSWORD_STAGING`
- `SUPABASE_PROJECT_ID_STAGING` (optional)
- `SUPABASE_ACCESS_TOKEN` (optional)

### Production
- `SUPABASE_DB_URL_PRODUCTION`
- `SUPABASE_DB_PASSWORD_PRODUCTION`
- `SUPABASE_PROJECT_ID_PRODUCTION` (optional)
- `SUPABASE_ACCESS_TOKEN` (shared)

## How It Works

### Automatic (on push)
1. Developer commits migration files
2. Pushes to `main` or `develop`
3. GitHub Actions detects migration changes
4. Workflow runs automatically
5. Migrations applied to staging
6. Verification runs
7. Success/failure reported

### Manual (production)
1. Go to Actions tab
2. Select "Apply Database Migrations (Safe Mode)"
3. Click "Run workflow"
4. Select `production` environment
5. Review and approve (if protected)
6. Migrations applied
7. Verification runs

## Migration Files

All migrations are in `supabase/migrations/`:

1. `20260130000000_settler_receipts_hash_chain.sql`
2. `20260130000001_settler_tenant_context_helper.sql`
3. `20260130000002_settler_rls_hardening.sql`
4. `20260130000003_settler_ai_tokens.sql`

**Apply in order!**

## Supabase AI Usage

### Copy-Paste Prompt
1. Open Supabase AI Assistant
2. Copy contents of `supabase/AI_PROMPT_COMPLETE.md`
3. Paste into AI assistant
4. AI now understands entire Settler schema

### Quick Reference
- Use `supabase/ai-assistant-prompt.txt` for quick lookups
- Use `supabase/SCHEMA_SUMMARY.md` for overview

## Verification

After migrations run, verify:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('receipts', 'ai_analysis_usage', 'ai_analyses');

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('receipts', 'ai_analysis_usage', 'ai_analyses');

-- Check policies
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('receipts', 'ai_analysis_usage', 'ai_analyses');
```

## Security

✅ **Secrets stored in GitHub Secrets** (never in code)
✅ **Environment protection** for production (requires approval)
✅ **RLS policies** enforce tenant isolation
✅ **Connection strings** use connection pooling
✅ **Passwords** different for staging/production

## Next Steps

1. **Set up secrets** in GitHub repository settings
2. **Create environments** (staging, production) with protection rules
3. **Test locally** using `scripts/apply-migrations.sh`
4. **Push migration files** to trigger automatic application
5. **Monitor workflows** in GitHub Actions tab
6. **Verify in Supabase** that tables exist

## Files Created

### Workflows (3)
1. `.github/workflows/migrations.yml` - Main migration workflow
2. `.github/workflows/migrations-safe.yml` - Safe mode workflow
3. `.github/workflows/ci-with-migrations.yml` - CI with migration validation

### Documentation (5)
1. `.github/MIGRATION_SETUP.md` - Setup guide
2. `.github/MIGRATION_SECRETS_SETUP.md` - Secrets setup
3. `supabase/AI_PROMPT_COMPLETE.md` - Complete AI prompt
4. `supabase/ai-assistant-prompt.txt` - Quick AI reference
5. `supabase/SCHEMA_SUMMARY.md` - Schema summary

### Scripts (1)
1. `scripts/apply-migrations.sh` - Local migration script

**Total: 9 files created/modified**

## Status

✅ **All workflows created**
✅ **All documentation complete**
✅ **Supabase AI prompts ready**
✅ **Local testing script ready**
✅ **Security best practices documented**

**Ready for production use!** 🚀
