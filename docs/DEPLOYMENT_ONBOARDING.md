# Onboarding System Deployment Guide

This guide covers deploying the Customer Onboarding & Activation Engine.

## Prerequisites

- Supabase CLI installed (`npm install -g supabase`)
- Database access (DATABASE_URL or Supabase credentials)
- Node.js and npm installed

## Step 1: Apply Database Migration

### Option A: Using Supabase CLI (Recommended)

```bash
# If using Supabase CLI locally
supabase migration up

# Or if connected to remote Supabase project
supabase db push
```

### Option B: Using Migration Script

```bash
# Using the TypeScript migration runner
npm run db:migrate:auto

# Or using the bash script (requires psql)
bash scripts/apply-migrations.sh staging
```

### Option C: Manual Application

If you have direct database access:

```bash
# Connect to your database
psql $DATABASE_URL -f supabase/migrations/20260131000000_workspace_onboarding_activation.sql
```

### Verify Migration

After applying, verify the tables were created:

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

## Step 2: Update Prisma Schema

The Prisma schema has been updated with new models. Regenerate the Prisma client:

```bash
npm run prisma:generate
```

## Step 3: Deploy API Routes

The following API routes have been created and are ready to deploy:

- `packages/web/src/app/api/workspaces/route.ts`
- `packages/web/src/app/api/workspaces/[workspaceId]/invites/route.ts`
- `packages/web/src/app/api/workspaces/[workspaceId]/onboarding/route.ts`
- `packages/web/src/app/api/invite/[token]/route.ts`

These will be automatically deployed when you deploy the Next.js app (Vercel, etc.).

## Step 4: Deploy UI Components

The following UI components are ready:

- `packages/web/src/app/console/onboarding/page.tsx` - Onboarding wizard
- `packages/web/src/app/invite/[token]/page.tsx` - Invite acceptance page

These will be automatically deployed with the Next.js app.

## Step 5: Run Tests

### Install Dependencies (if needed)

```bash
npm install
npm install -D @playwright/test
npx playwright install
```

### Run E2E Tests

```bash
# Run all onboarding tests
npm run test:e2e -- tests/e2e/onboarding-flow.spec.ts

# Run with UI
npx playwright test tests/e2e/onboarding-flow.spec.ts --ui

# Run in headed mode
npx playwright test tests/e2e/onboarding-flow.spec.ts --headed
```

### Expected Test Results

- ✅ Complete onboarding wizard in <3 minutes
- ✅ Show activation checklist on console
- ✅ Allow workspace creation with valid slug
- ✅ Reject duplicate workspace slug
- ✅ Track onboarding events with trace_id
- ✅ Handle errors gracefully

## Step 6: Verify Deployment

### 1. Check API Endpoints

```bash
# Test workspace creation (requires auth)
curl -X POST http://localhost:3000/api/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "Test Workspace", "slug": "test-workspace"}'

# Test onboarding progress (requires auth + workspace)
curl http://localhost:3000/api/workspaces/WORKSPACE_ID/onboarding \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Check UI Pages

- Navigate to `/console/onboarding` - Should show wizard
- Navigate to `/invite/TOKEN` - Should show invite acceptance (if token exists)

### 3. Check Database

```sql
-- Verify tables have data
SELECT COUNT(*) FROM workspace_invites;
SELECT COUNT(*) FROM tenant_onboarding_progress;
SELECT COUNT(*) FROM onboarding_events;

-- Check recent onboarding events
SELECT event_type, step_id, trace_id, created_at 
FROM onboarding_events 
ORDER BY created_at DESC 
LIMIT 10;
```

## Troubleshooting

### Migration Fails

**Error: "relation already exists"**
- Some tables might already exist. The migration uses `CREATE TABLE IF NOT EXISTS`, so this should be safe.
- Check if you need to drop existing tables first (not recommended in production).

**Error: "function already exists"**
- Functions are created with `CREATE OR REPLACE`, so this should update existing functions.
- If issues persist, manually drop and recreate:
  ```sql
  DROP FUNCTION IF EXISTS create_workspace_with_owner(TEXT, TEXT, UUID);
  DROP FUNCTION IF EXISTS complete_onboarding_step(UUID, UUID, TEXT, TEXT);
  DROP FUNCTION IF EXISTS track_onboarding_event(UUID, UUID, TEXT, TEXT, TEXT, JSONB);
  ```

**Error: "permission denied"**
- Ensure database user has CREATE, ALTER, and GRANT permissions.
- For Supabase, use the service role key or ensure RLS policies allow operations.

### API Routes Return 500

1. Check server logs for errors
2. Verify database connection
3. Check RLS policies allow operations
4. Verify Supabase functions are deployed
5. Check `trace_id` in error responses for correlation

### Tests Fail

1. Ensure test database is set up
2. Check environment variables are set
3. Verify auth is working (tests may skip if not authenticated)
4. Check Playwright is installed: `npx playwright install`

### RLS Policies Blocking Operations

If RLS policies are too restrictive:

1. Check user is authenticated: `SELECT auth.uid();`
2. Verify user is member of tenant: `SELECT * FROM tenant_users WHERE user_id = auth.uid();`
3. Check policy conditions match your use case
4. Temporarily disable RLS for testing (NOT recommended in production):
   ```sql
   ALTER TABLE workspace_invites DISABLE ROW LEVEL SECURITY;
   ```

## Rollback Plan

If you need to rollback the migration:

```sql
-- Drop tables (WARNING: This deletes data!)
DROP TABLE IF EXISTS onboarding_events CASCADE;
DROP TABLE IF EXISTS tenant_onboarding_progress CASCADE;
DROP TABLE IF EXISTS workspace_invites CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS create_workspace_with_owner(TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS complete_onboarding_step(UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS track_onboarding_event(UUID, UUID, TEXT, TEXT, TEXT, JSONB);

-- Revert tenant_users changes (if needed)
ALTER TABLE tenant_users DROP CONSTRAINT IF EXISTS tenant_users_role_check;
ALTER TABLE tenant_users DROP COLUMN IF EXISTS invited_by;
ALTER TABLE tenant_users DROP COLUMN IF EXISTS invited_at;
ALTER TABLE tenant_users DROP COLUMN IF EXISTS joined_at;
ALTER TABLE tenant_users DROP COLUMN IF EXISTS metadata;
```

## Post-Deployment Checklist

- [ ] Migration applied successfully
- [ ] All tables created
- [ ] All functions created
- [ ] RLS policies active
- [ ] API routes deployed
- [ ] UI pages accessible
- [ ] Tests passing
- [ ] Workspace creation works
- [ ] Invite system works
- [ ] Onboarding progress tracks correctly
- [ ] Events are being tracked
- [ ] Error handling works
- [ ] Demo mode works without secrets

## Monitoring

After deployment, monitor:

1. **Onboarding Events**: Check `onboarding_events` table for event tracking
2. **Error Rates**: Monitor API error responses with `trace_id`
3. **Completion Rates**: Track `tenant_onboarding_progress.progress` values
4. **Invite Acceptance**: Monitor `workspace_invites.status`

## Support

For issues:
1. Check logs with `trace_id` from error responses
2. Review RLS policies
3. Check Supabase function logs
4. Verify database connectivity
5. Check environment variables

## Next Steps

After successful deployment:
1. Monitor onboarding completion rates
2. Track "First Success" path metrics (<3 minutes)
3. Optimize based on user feedback
4. Add additional onboarding steps if needed
5. Enhance error messages based on common issues
