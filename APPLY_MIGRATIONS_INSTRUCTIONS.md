# Apply Migrations - Step by Step Instructions

**Current Status:** Network connectivity issue prevents running migrations from this environment.

**Solution:** Apply migrations using one of the methods below.

## 🎯 Recommended: Apply via Supabase Dashboard

### Step 1: Open Supabase Dashboard
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `johfcvvmtfiomzxipspz`
3. Navigate to **SQL Editor** (left sidebar)

### Step 2: Apply Critical Migrations

#### Option A: Use Consolidated Script (Easiest)

1. Open `scripts/apply-migrations-supabase-dashboard.sql`
2. Copy the entire file contents
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)
5. Check for errors (some "already exists" are normal)

This will apply:
- ✅ Console setup
- ✅ RLS policies
- ✅ Performance indexes
- ✅ Helper functions

#### Option B: Apply Individual Migrations

Apply these critical migrations in order:

1. **Console Complete Setup**
   - File: `supabase/migrations/20260126000000_console_complete_setup.sql`
   - Copy contents → Paste in SQL Editor → Run

2. **RLS Fixes**
   - File: `supabase/migrations/20260125000000_console_rls_fixes.sql`
   - Copy contents → Paste in SQL Editor → Run

3. **Performance Indexes** ⭐ NEW
   - File: `supabase/migrations/20260130000004_optimize_console_indexes.sql`
   - Copy contents → Paste in SQL Editor → Run

4. **Additional RLS**
   - File: `supabase/migrations/20260127000002_missing_rls_policies.sql`
   - Copy contents → Paste in SQL Editor → Run

### Step 3: Verify Migrations Applied

Run this in SQL Editor:

```sql
-- Check migrations table
SELECT version, applied_at FROM schema_migrations 
ORDER BY applied_at DESC LIMIT 10;

-- Check critical tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('billing_accounts', 'api_keys', 'receipts', 'usage_events', 'feature_flags');

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' AND indexname LIKE 'idx_%';

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('api_keys', 'billing_accounts', 'usage_events');
```

## 🔄 Alternative: Apply After Vercel Deployment

Once deployed to Vercel, DATABASE_URL will be available in the Vercel environment:

```bash
# Pull environment variables
vercel env pull .env.production

# Apply migrations
npm run db:migrate:pending
```

## 📋 Migration Checklist

After applying migrations, verify:

- [ ] `schema_migrations` table exists
- [ ] Critical tables exist (billing_accounts, api_keys, receipts, usage_events)
- [ ] RLS policies enabled on api_keys, billing_accounts, usage_events
- [ ] Helper functions exist (current_user_id, current_tenant_id)
- [ ] Performance indexes created (idx_receipts_*, idx_usage_events_*, etc.)
- [ ] Health check endpoint works: `/api/health/console`

## 🚨 Important Notes

1. **"Already exists" errors are normal** - Safe to ignore if objects already exist
2. **Apply in order** - Some migrations depend on previous ones
3. **Check for errors** - Review any actual errors (not "already exists")
4. **Verify after** - Run verification queries to confirm success

## 📞 Need Help?

If migrations fail:
1. Check error messages in SQL Editor
2. Verify DATABASE_URL is correct
3. Check Supabase project is active
4. Review migration file for syntax errors

---

**Quick Start:** Copy `scripts/apply-migrations-supabase-dashboard.sql` → Paste in Supabase SQL Editor → Run ✅
