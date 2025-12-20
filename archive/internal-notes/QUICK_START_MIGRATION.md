# Quick Start: Apply Migration & Regenerate Types

## 🚀 Quick Commands

```bash
# 1. Apply the onboarding migration
npm run db:migrate:onboarding

# 2. Regenerate Supabase TypeScript types
npm run db:types:regenerate

# 3. Verify everything works
npm run typecheck
```

## 📋 Prerequisites

### For Migration

Set one of these environment variables:

```bash
# Option 1: Direct database URL (recommended)
export DATABASE_URL="postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres"

# Option 2: Supabase credentials
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_DB_PASSWORD="your-db-password"
```

### For Type Generation

```bash
# Set Supabase project reference (or it will be extracted from SUPABASE_URL)
export SUPABASE_PROJECT_REF="your-project-ref"
# OR
export SUPABASE_URL="https://your-project.supabase.co"
```

## 🔧 Step-by-Step

### Step 1: Apply Migration

```bash
# Set your database connection
export DATABASE_URL="your-connection-string"

# Run migration
npm run db:migrate:onboarding
```

Expected output:
```
🔍 Applying Onboarding Migration...
📦 Executing migration...
✅ Migration applied successfully!
🔍 Verifying tables...
  ✅ workspace_invites
  ✅ tenant_onboarding_progress
  ✅ onboarding_events
🔍 Verifying functions...
  ✅ create_workspace_with_owner
  ✅ complete_onboarding_step
  ✅ track_onboarding_event
🎉 Migration verification complete!
```

### Step 2: Regenerate Types

```bash
# Set your Supabase project reference
export SUPABASE_PROJECT_REF="your-project-ref"

# Regenerate types
npm run db:types:regenerate
```

Expected output:
```
🔄 Regenerating Supabase TypeScript types...
Project Reference: your-project-ref
📦 Generating types...
✅ Types generated successfully!
   Output: packages/web/src/types/database.types.ts
   File size: XX.XX KB
   Type definitions: XXX
```

### Step 3: Verify

```bash
# Check TypeScript compilation
npm run typecheck

# Should show no errors related to onboarding tables
```

## 🐛 Troubleshooting

### Migration Fails

**"Connection refused"**
- Check your DATABASE_URL is correct
- Verify database is accessible
- Check firewall/network settings

**"Permission denied"**
- Ensure database user has CREATE/ALTER permissions
- For Supabase, use service role key

**"Table already exists"**
- This is safe - migration uses `CREATE TABLE IF NOT EXISTS`
- Tables will be updated if needed

### Type Generation Fails

**"Supabase CLI not found"**
```bash
npm install -g supabase
# or
brew install supabase/tap/supabase
```

**"Project reference not found"**
- Set `SUPABASE_PROJECT_REF` explicitly
- Or ensure `SUPABASE_URL` contains project reference

**"Generated file is empty"**
- Check Supabase project is accessible
- Verify project reference is correct
- Try generating from Supabase Dashboard instead

## 📚 Alternative Methods

### Using Supabase CLI Directly

```bash
# Apply migration
supabase migration up

# Generate types
supabase gen types typescript --project-id your-project-ref > packages/web/src/types/database.types.ts
```

### Using Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. **For Migration**: Go to SQL Editor → Run migration SQL
4. **For Types**: Go to Settings → API → Copy TypeScript types

## ✅ Verification Checklist

After completing both steps:

- [ ] Migration script ran successfully
- [ ] All 3 tables exist (`workspace_invites`, `tenant_onboarding_progress`, `onboarding_events`)
- [ ] All 3 functions exist (`create_workspace_with_owner`, `complete_onboarding_step`, `track_onboarding_event`)
- [ ] RLS policies are active
- [ ] Types file was generated (`packages/web/src/types/database.types.ts`)
- [ ] TypeScript compilation passes (`npm run typecheck`)
- [ ] No `as any` assertions needed (types are properly recognized)

## 🎯 Next Steps

After migration and type generation:

1. **Update code** to remove `as any` assertions
2. **Test locally**: `npm run test:e2e -- tests/e2e/onboarding-flow.spec.ts`
3. **Deploy**: Push to production
4. **Monitor**: Check onboarding events in database

## 📖 Full Documentation

See `docs/MIGRATION_GUIDE.md` for detailed instructions and troubleshooting.
