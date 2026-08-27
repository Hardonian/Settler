# Backend Console Diagnostics & Troubleshooting Guide

## Overview

The Settler backend console consists of Next.js API routes (`/api/console/*`) that handle authenticated requests for the Developer Console UI. These routes use both Supabase (for auth/RLS) and Prisma (for database queries) with unified authentication.

## Architecture

### Components

1. **API Routes** (`packages/web/src/app/api/console/*`)
   - Next.js Route Handlers (App Router)
   - Runtime: `nodejs` (required for Prisma binary engine)
   - Dynamic: `force-dynamic` (no caching)

2. **Domain Functions** (`packages/web/src/domain/console/*`)
   - Business logic layer
   - Handles tenant isolation
   - Returns empty arrays/null on errors (never throws)

3. **Authentication** (`packages/web/src/lib/api/unified-auth.ts`)
   - Supports both session auth (Console UI) and API key auth (SDK/CLI)
   - Returns `UnifiedAuthContext` with `userId`, `billingAccountId`, `tenantId`

4. **Database Clients**
   - **Supabase**: Auth + RLS-protected queries (`api_keys` table)
   - **Prisma**: Direct database queries (bypasses RLS, requires manual tenant isolation)

## Critical Environment Variables

### Required for Console

```bash
# Supabase (for auth)
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON-KEY]

# Database (for Prisma)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Optional (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=[SERVICE-ROLE-KEY]  # Only needed for admin ops, NOT for Console
```

### Verification

```bash
# Check health endpoint
curl https://your-domain.com/api/health/console

# Expected: Status 200 with health details
{
  "status": "healthy",
  "checks": {
    "env": { "supabaseUrl": true, "supabaseAnonKey": true },
    "supabase": { "canConnect": true, "canQuery": true },
    "auth": { "hasSession": false },
    "migrations": { "criticalTablesExist": true }
  }
}
```

## Database Schema Requirements

### Critical Tables

1. **`billing_accounts`**
   - Columns: `id`, `user_id`, `tenant_id`, `email`, `status`
   - RLS: Enabled (via `current_user_id()` function)

2. **`api_keys`**
   - Columns: `id`, `user_id`, `tenant_id`, `key_prefix`, `key_hash`, `name`, `scopes`, `created_at`, `last_used_at`, `revoked_at`, `expires_at`
   - RLS: Enabled (via `api_keys_user_access` policy)

3. **`receipts`** (via `uploads` table)
   - Columns: `id`, `upload_id`, `vendor`, `date`, `currency`, `total`, `confidence_score`, `created_at`
   - Related: `uploads` table with `billing_account_id`

4. **`usage_events`**
   - Columns: `id`, `billing_account_id`, `event_type`, `quantity`, `timestamp`, `metadata`
   - RLS: Enabled (via `usage_events_billing_account_access` policy)

5. **`feature_flags`**
   - Columns: `id`, `billing_account_id`, `key`, `value`, `environment`, `created_at`
   - Related: `billing_accounts` table

### Required Database Functions

```sql
-- Get current authenticated user ID (for RLS)
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
  SELECT (auth.jwt() ->> 'sub')::UUID;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### Required RLS Policies

```sql
-- API Keys access
CREATE POLICY api_keys_user_access ON api_keys
  FOR ALL USING (user_id = current_user_id());

-- Billing Accounts access
CREATE POLICY billing_accounts_user_access ON billing_accounts
  FOR SELECT USING (user_id = current_user_id());

-- Usage Events access
CREATE POLICY usage_events_billing_account_access ON usage_events
  FOR SELECT USING (
    billing_account_id IN (
      SELECT id FROM billing_accounts WHERE user_id = current_user_id()
    )
  );
```

## Common 500 Error Causes

### 1. Missing Environment Variables

**Symptoms:**

- 500 error on all console routes
- Health check shows `"env": { "supabaseUrl": false }`

**Fix:**

```bash
# Verify in Vercel/dashboard
echo $NEXT_PUBLIC_SUPABASE_URL
echo $DATABASE_URL

# Set if missing
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add DATABASE_URL
```

### 2. Prisma Client Not Initialized

**Symptoms:**

- Error: `Prisma client not properly initialized`
- Error: `Cannot read property 'billingAccount' of undefined`

**Fix:**

```bash
# Regenerate Prisma client
cd packages/web
npm run prisma:generate

# Verify Prisma schema is correct
cat prisma/schema.prisma | grep -A 5 "model BillingAccount"
```

**Root Cause:**

- Prisma client generated with wrong engine type
- `DATABASE_URL` not set during build
- Prisma schema not synced

**Prevention:**

- Ensure `PRISMA_CLIENT_ENGINE_TYPE=binary` is set (see `packages/web/src/shared/db/prismaClient.ts`)
- Set `DATABASE_URL` even during build (can be dummy URL)

### 3. Database Connection Failure

**Symptoms:**

- Error: `Can't reach database server`
- Error: `Connection timeout`
- Health check shows `"supabase": { "canConnect": false }`

**Fix:**

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check connection pool limits
# Supabase free tier: 60 connections max
# Reduce Prisma connection pool if needed
```

**Prisma Config:**

```typescript
// In prismaClient.ts
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL + "?connection_limit=5&pool_timeout=20",
});
```

### 4. Missing Database Tables

**Symptoms:**

- Error: `relation "api_keys" does not exist`
- Error: `relation "billing_accounts" does not exist`
- Health check shows `"migrations": { "criticalTablesExist": false }`

**Fix:**

```bash
# Run migrations
npm run db:migrate:deploy

# Or manually
psql $DATABASE_URL -f supabase/migrations/[LATEST].sql
```

**Verify:**

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('billing_accounts', 'api_keys', 'receipts', 'usage_events');
```

### 5. RLS Policy Missing/Incorrect

**Symptoms:**

- Error: `permission denied for table api_keys`
- Error: `new row violates row-level security policy`
- API returns empty arrays even when data exists

**Fix:**

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'api_keys';

-- Check policies exist
SELECT * FROM pg_policies WHERE tablename = 'api_keys';

-- Verify current_user_id() function exists
SELECT proname FROM pg_proc WHERE proname = 'current_user_id';
```

**Recreate if missing:**

```sql
-- See supabase/migrations/20260125000000_console_rls_fixes.sql
```

### 6. Authentication Failure

**Symptoms:**

- Error: `Unauthorized: Authentication required`
- Error: `Failed to get user`
- Health check shows `"auth": { "status": "error" }`

**Fix:**

```bash
# Verify Supabase client creation
# Check cookies() function works in Next.js
# Verify SUPABASE_ANON_KEY is correct (not service role key)
```

**Debug:**

```typescript
// In route handler
const supabase = await createClient();
const {
  data: { user },
  error,
} = await supabase.auth.getUser();
console.log("Auth check:", { hasUser: !!user, error: error?.message });
```

### 7. Billing Account Missing

**Symptoms:**

- Console page loads but shows empty data
- API returns empty arrays
- No errors in logs

**Fix:**

```typescript
// Console page auto-creates billing account if missing
// But if creation fails, check:
// 1. Prisma can write to billing_accounts table
// 2. RLS allows INSERT (if using Supabase client)
// 3. User has valid user_id
```

**Manual Creation:**

```sql
INSERT INTO billing_accounts (id, user_id, email, status)
VALUES (gen_random_uuid(), '[USER_ID]', '[EMAIL]', 'active');
```

### 8. Prisma Binary Engine Not Available

**Symptoms:**

- Error: `Prisma Client was generated for the "client" engine type`
- Error: `accelerateUrl is required`
- Build fails or runtime errors

**Fix:**

```bash
# Ensure PRISMA_CLIENT_ENGINE_TYPE=binary during generation
PRISMA_CLIENT_ENGINE_TYPE=binary npm run prisma:generate

# Verify in generated client
grep -r "engineType" packages/web/node_modules/.prisma/client/
```

**Prevention:**

- See `packages/web/src/shared/db/prismaClient.ts` for engine type forcing
- Set `NEXT_RUNTIME=nodejs` in environment

## Error Handling Patterns

### Domain Functions (Never Throw)

```typescript
// ✅ CORRECT: Return empty array on error
export async function listApiKeys(): Promise<ApiKeyListItem[]> {
  try {
    // ... query logic
    return keys;
  } catch (error) {
    console.error("[listApiKeys] Error:", error);
    return []; // Never throw
  }
}

// ❌ WRONG: Throwing errors
export async function listApiKeys(): Promise<ApiKeyListItem[]> {
  const keys = await supabase.from("api_keys").select("*");
  if (keys.error) throw new Error(keys.error.message); // DON'T DO THIS
  return keys.data;
}
```

### Route Handlers (Catch and Return 200/401)

```typescript
// ✅ CORRECT: Catch errors, return safe response
export async function GET(request: NextRequest) {
  try {
    const authContext = await requireAuth(request);
    const receipts = await listReceipts(authContext.billingAccountId);
    return NextResponse.json({ receipts });
  } catch (error) {
    if (error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Return empty data instead of 500
    return NextResponse.json({ receipts: [] }, { status: 200 });
  }
}
```

## Tenant Isolation Verification

### Critical: Prisma Bypasses RLS

**Problem:**

- Prisma queries bypass Supabase RLS policies
- Must manually verify `billing_account_id` belongs to user

**Solution:**

```typescript
// ✅ CORRECT: Verify access before querying
async function verifyBillingAccountAccess(billingAccountId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const billingAccount = await prisma.billingAccount.findFirst({
    where: { id: billingAccountId, userId: user.id },
  });

  return !!billingAccount;
}

// Then use in queries
const hasAccess = await verifyBillingAccountAccess(billingAccountId);
if (!hasAccess) return [];
```

### Supabase Queries (RLS Enforced)

```typescript
// ✅ CORRECT: RLS automatically enforces tenant isolation
const { data } = await supabase.from("api_keys").select("*").eq("user_id", user.id); // RLS ensures user can only see their own keys
```

## Testing & Verification

### 1. Health Check

```bash
curl https://your-domain.com/api/health/console
```

**Expected:**

- Status: 200
- `status: "healthy"`
- All checks pass

### 2. Console Page (Unauthenticated)

```bash
curl -I https://your-domain.com/console
```

**Expected:**

- Status: 200
- Shows sign-in prompt

### 3. Console API Routes (Unauthenticated)

```bash
curl https://your-domain.com/api/console/api-keys
```

**Expected:**

- Status: 401 (Unauthorized)
- NOT 500

### 4. Console API Routes (Authenticated)

```bash
# Get session cookie from browser after signing in
curl -H "Cookie: sb-access-token=..." https://your-domain.com/api/console/api-keys
```

**Expected:**

- Status: 200
- JSON: `{ keys: [...] }` or `{ keys: [] }`
- NOT 500

### 5. Smoke Tests

```bash
npm run test:smoke
```

**Expected:**

- All tests pass
- Console route test passes

## Monitoring & Logging

### Key Log Patterns

```typescript
// Structured logging in routes
console.log("[Console] Request started", {
  route: "/api/console/receipts",
  correlationId,
  userId: authContext.userId,
});

console.error("[Console] Error", {
  route: "/api/console/receipts",
  error: errorMessage,
  stack: errorStack,
});
```

### Metrics to Monitor

1. **Error Rate**: Console routes should have < 1% 500 errors
2. **Response Time**: P95 < 500ms
3. **Health Check**: `/api/health/console` should return `healthy`
4. **Database Connections**: Monitor pool usage

## Quick Diagnostic Checklist

- [ ] Environment variables set (`SUPABASE_URL`, `DATABASE_URL`)
- [ ] Health check returns 200 (`/api/health/console`)
- [ ] Database tables exist (`billing_accounts`, `api_keys`, etc.)
- [ ] RLS policies enabled and correct
- [ ] `current_user_id()` function exists
- [ ] Prisma client generated (`npm run prisma:generate`)
- [ ] Prisma uses binary engine (not client engine)
- [ ] Console page loads without 500 (`/console`)
- [ ] API routes return 401 when unauthenticated (not 500)
- [ ] API routes return 200 when authenticated (not 500)
- [ ] Smoke tests pass

## Rollback Plan

If console is broken:

1. **Check Health Endpoint**

   ```bash
   curl https://your-domain.com/api/health/console
   ```

2. **Check Recent Deployments**
   - Revert to last known good commit
   - Check Vercel deployment logs

3. **Database Rollback** (if migration caused issues)

   ```sql
   -- See CONSOLE_VERIFICATION_CHECKLIST.md for rollback SQL
   ```

4. **Environment Variables**
   - Verify all required vars are set
   - Check for typos in values

## Files to Check When Debugging

1. **Route Handlers**: `packages/web/src/app/api/console/*/route.ts`
2. **Domain Functions**: `packages/web/src/domain/console/*.ts`
3. **Auth**: `packages/web/src/lib/api/unified-auth.ts`
4. **Prisma Client**: `packages/web/src/shared/db/prismaClient.ts`
5. **Supabase Client**: `packages/web/src/lib/supabase/server.ts`
6. **Health Check**: `packages/web/src/app/api/health/console/route.ts`
7. **Migrations**: `supabase/migrations/*.sql`

## Support Resources

- **Health Check**: `/api/health/console` - Always returns 200 with diagnostics
- **Setup Check Page**: `/console/setup-check` - Interactive diagnostics UI
- **Verification Checklist**: `CONSOLE_VERIFICATION_CHECKLIST.md`
- **Migration Guide**: `docs/AUTOMATIC_MIGRATIONS.md`
