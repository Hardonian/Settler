# Database Migration Guide

This guide covers applying the onboarding migration and regenerating Supabase types.

## Step 1: Apply Onboarding Migration

### Option A: Using the Migration Script (Recommended)

```bash
# Set your database connection string
export DATABASE_URL="postgresql://user:password@host:port/database"

# Or use Supabase credentials
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_DB_PASSWORD="your-db-password"

# Run the migration script
npm run db:migrate:onboarding
```

### Option B: Using Supabase CLI

If you have Supabase CLI installed and linked to your project:

```bash
# Apply all pending migrations
supabase migration up

# Or apply specific migration
supabase db push
```

### Option C: Using psql Directly

If you have direct database access:

```bash
# Connect to your database
psql $DATABASE_URL

# Or with Supabase
psql "postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres"

# Apply migration
\i supabase/migrations/20260131000000_workspace_onboarding_activation.sql
```

### Option D: Using the TypeScript Migration Runner

```bash
npm run db:migrate:auto
```

This will apply all migrations in the `supabase/migrations/` directory.

## Step 2: Verify Migration

After applying the migration, verify it was successful:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'workspace_invites',
    'tenant_onboarding_progress', 
    'onboarding_events'
  );

-- Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'create_workspace_with_owner',
    'complete_onboarding_step',
    'track_onboarding_event'
  );

-- Check RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN (
  'workspace_invites',
  'tenant_onboarding_progress',
  'onboarding_events'
);
```

Or use the verification script:

```bash
bash scripts/verify-onboarding-migration.sh
```

## Step 3: Regenerate Supabase Types

After the migration is applied, regenerate TypeScript types:

### Option A: Using the TypeScript Script (Recommended)

```bash
# Set your Supabase project reference
export SUPABASE_PROJECT_REF="your-project-ref"

# Or it will be extracted from SUPABASE_URL
export SUPABASE_URL="https://your-project.supabase.co"

# Regenerate types
npm run db:types:regenerate
```

### Option B: Using Supabase CLI

```bash
# Generate types
supabase gen types typescript --project-id your-project-ref > packages/web/src/types/database.types.ts
```

### Option C: Using Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** > **API**
4. Scroll to **TypeScript types**
5. Copy the generated types
6. Save to `packages/web/src/types/database.types.ts`

## Step 4: Update Code to Use New Types

After regenerating types, update your code:

1. **Remove `as any` assertions** where Supabase types are now available
2. **Update imports** to use the new types:

```typescript
import type { Database } from '@/types/database.types';

// Use typed Supabase client
const supabase = createClient<Database>();
```

3. **Update API routes** to use proper types:

```typescript
// Before (with as any)
const { data } = await (supabase.from('tenant_users') as any).select('*');

// After (with proper types)
const { data } = await supabase.from('tenant_users').select('*');
// data is now properly typed!
```

## Troubleshooting

### Migration Fails

**Error: "relation already exists"**
- Some tables might already exist. The migration uses `CREATE TABLE IF NOT EXISTS`, so this should be safe.
- If you need to recreate, drop tables first (NOT recommended in production):
  ```sql
  DROP TABLE IF EXISTS onboarding_events CASCADE;
  DROP TABLE IF EXISTS tenant_onboarding_progress CASCADE;
  DROP TABLE IF EXISTS workspace_invites CASCADE;
  ```

**Error: "permission denied"**
- Ensure database user has CREATE, ALTER, and GRANT permissions
- For Supabase, use the service role key or ensure RLS policies allow operations

**Error: "function already exists"**
- Functions are created with `CREATE OR REPLACE`, so this should update existing functions
- If issues persist, manually drop and recreate:
  ```sql
  DROP FUNCTION IF EXISTS create_workspace_with_owner(TEXT, TEXT, UUID);
  DROP FUNCTION IF EXISTS complete_onboarding_step(UUID, UUID, TEXT, TEXT);
  DROP FUNCTION IF EXISTS track_onboarding_event(UUID, UUID, TEXT, TEXT, TEXT, JSONB);
  ```

### Type Generation Fails

**Error: "Supabase CLI not found"**
- Install Supabase CLI:
  ```bash
  npm install -g supabase
  # or
  brew install supabase/tap/supabase
  ```

**Error: "Project reference not found"**
- Set `SUPABASE_PROJECT_REF` environment variable
- Or ensure `SUPABASE_URL` is set and contains the project reference

**Error: "Generated file is empty"**
- Check your Supabase project is accessible
- Verify you have the correct project reference
- Try generating types from the Supabase Dashboard instead

### Types Not Updating

**Types still show `never`**
- Ensure migration was applied successfully
- Regenerate types after migration
- Clear TypeScript cache: `rm -rf node_modules/.cache`
- Restart TypeScript server in your IDE

**Type errors persist**
- Check that `database.types.ts` includes the new tables
- Verify imports are correct
- Run `npm run typecheck` to see all errors

## Environment Variables

Required for migration:
- `DATABASE_URL` - Direct PostgreSQL connection string (preferred)
- OR `SUPABASE_URL` + `SUPABASE_DB_PASSWORD` - Supabase connection

Required for type generation:
- `SUPABASE_PROJECT_REF` - Project reference (or extracted from `SUPABASE_URL`)
- `SUPABASE_URL` - Supabase project URL

## Quick Reference

```bash
# Apply migration
npm run db:migrate:onboarding

# Verify migration
bash scripts/verify-onboarding-migration.sh

# Regenerate types
npm run db:types:regenerate

# Check types
npm run typecheck
```

## Next Steps

After migration and type generation:
1. ✅ Verify tables exist
2. ✅ Verify functions exist
3. ✅ Verify RLS policies are active
4. ✅ Update code to use new types
5. ✅ Remove `as any` assertions
6. ✅ Run tests: `npm run test:e2e`
7. ✅ Deploy to production
