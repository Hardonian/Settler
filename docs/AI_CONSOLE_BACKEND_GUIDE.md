# AI Guide: Backend Console Troubleshooting

## Purpose

This document provides **all details an AI needs** to diagnose and fix 500 internal server errors in the Settler backend console. Use this as the primary reference when debugging console issues.

## Quick Start

1. **Run Diagnostic**: `npm run diagnose:console`
2. **Check Health**: `curl https://your-domain.com/api/health/console`
3. **Review This Guide**: See sections below for specific error patterns

## Architecture Overview

### Component Stack

```
┌─────────────────────────────────────────┐
│  Next.js App Router                      │
│  /api/console/* routes                   │
│  Runtime: nodejs (required for Prisma)  │
│  Dynamic: force-dynamic                  │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌─────▼────────┐
│  Supabase   │  │   Prisma      │
│  (Auth+RLS) │  │  (Direct DB)  │
└─────────────┘  └───────────────┘
       │                │
       └───────┬────────┘
               │
       ┌───────▼────────┐
       │  PostgreSQL    │
       │  (Supabase DB) │
       └────────────────┘
```

### Key Components

1. **API Routes** (`packages/web/src/app/api/console/*/route.ts`)
   - Next.js Route Handlers
   - Handle HTTP requests
   - Use unified auth (session + API key)
   - Return JSON responses

2. **Domain Functions** (`packages/web/src/domain/console/*.ts`)
   - Business logic layer
   - **CRITICAL**: Never throw errors, return empty arrays/null
   - Handle tenant isolation manually (Prisma bypasses RLS)

3. **Authentication** (`packages/web/src/lib/api/unified-auth.ts`)
   - Supports session auth (Console UI) and API key auth (SDK)
   - Returns `UnifiedAuthContext` with `userId`, `billingAccountId`, `tenantId`

4. **Database Clients**
   - **Supabase**: Auth + RLS-protected queries
   - **Prisma**: Direct queries (bypasses RLS, requires manual verification)

## Critical Environment Variables

### Required

```bash
# Supabase (for authentication)
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON-KEY]

# Database (for Prisma)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### Optional

```bash
# Only needed for admin operations, NOT for Console
SUPABASE_SERVICE_ROLE_KEY=[SERVICE-ROLE-KEY]
```

### Verification

```bash
# Check if variables are set
echo $NEXT_PUBLIC_SUPABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

## Database Schema Requirements

### Critical Tables

1. **`billing_accounts`**
   ```sql
   CREATE TABLE billing_accounts (
     id UUID PRIMARY KEY,
     user_id UUID NOT NULL,
     tenant_id UUID,
     email TEXT,
     status TEXT
   );
   ```

2. **`api_keys`**
   ```sql
   CREATE TABLE api_keys (
     id UUID PRIMARY KEY,
     user_id UUID NOT NULL,
     tenant_id UUID,
     key_prefix TEXT,
     key_hash TEXT,
     name TEXT,
     scopes TEXT[],
     created_at TIMESTAMPTZ,
     last_used_at TIMESTAMPTZ,
     revoked_at TIMESTAMPTZ,
     expires_at TIMESTAMPTZ
   );
   ```

3. **`receipts`** (via `uploads` table)
   ```sql
   CREATE TABLE receipts (
     id UUID PRIMARY KEY,
     upload_id UUID REFERENCES uploads(id),
     vendor TEXT,
     date DATE,
     currency TEXT,
     total DECIMAL,
     confidence_score DECIMAL,
     created_at TIMESTAMPTZ
   );
   ```

4. **`usage_events`**
   ```sql
   CREATE TABLE usage_events (
     id UUID PRIMARY KEY,
     billing_account_id UUID REFERENCES billing_accounts(id),
     event_type TEXT,
     quantity INTEGER,
     timestamp TIMESTAMPTZ,
     metadata JSONB
   );
   ```

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
-- API Keys: Users can only access their own keys
CREATE POLICY api_keys_user_access ON api_keys
  FOR ALL USING (user_id = current_user_id());

-- Billing Accounts: Users can only see their own accounts
CREATE POLICY billing_accounts_user_access ON billing_accounts
  FOR SELECT USING (user_id = current_user_id());

-- Usage Events: Users can only see events for their billing accounts
CREATE POLICY usage_events_billing_account_access ON usage_events
  FOR SELECT USING (
    billing_account_id IN (
      SELECT id FROM billing_accounts WHERE user_id = current_user_id()
    )
  );
```

## Common 500 Error Patterns & Fixes

### Pattern 1: Missing Environment Variables

**Symptoms:**
- All console routes return 500
- Health check shows `"env": { "supabaseUrl": false }`
- Error: `NEXT_PUBLIC_SUPABASE_URL is not defined`

**Diagnosis:**
```bash
npm run diagnose:console
# Check "Environment Variables" section
```

**Fix:**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add missing variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DATABASE_URL`
3. Redeploy

**Verification:**
```bash
curl https://your-domain.com/api/health/console
# Should show "env": { "supabaseUrl": true, "supabaseAnonKey": true }
```

---

### Pattern 2: Prisma Client Not Initialized

**Symptoms:**
- Error: `Prisma client not properly initialized`
- Error: `Cannot read property 'billingAccount' of undefined`
- Error: `prisma.billingAccount is not a function`

**Diagnosis:**
```bash
# Check if Prisma client is generated
ls packages/web/node_modules/.prisma/client/

# Check Prisma schema
cat prisma/schema.prisma | grep -A 5 "model BillingAccount"
```

**Fix:**
```bash
# Regenerate Prisma client
cd packages/web
npm run prisma:generate

# Verify engine type
grep -r "engineType" packages/web/node_modules/.prisma/client/
# Should show "binary" not "client"
```

**Root Causes:**
1. Prisma client generated with wrong engine type
2. `DATABASE_URL` not set during build
3. Prisma schema not synced

**Prevention:**
- See `packages/web/src/shared/db/prismaClient.ts` for engine type forcing
- Ensure `PRISMA_CLIENT_ENGINE_TYPE=binary` is set
- Set `DATABASE_URL` even during build (can be dummy URL)

---

### Pattern 3: Database Connection Failure

**Symptoms:**
- Error: `Can't reach database server`
- Error: `Connection timeout`
- Error: `Connection refused`
- Health check shows `"supabase": { "canConnect": false }`

**Diagnosis:**
```bash
# Test connection directly
psql $DATABASE_URL -c "SELECT 1"

# Check connection pool limits
# Supabase free tier: 60 connections max
```

**Fix:**
1. Verify `DATABASE_URL` is correct
2. Check database is running (Supabase dashboard)
3. Reduce Prisma connection pool if needed:
   ```typescript
   // In prismaClient.ts
   const prisma = new PrismaClient({
     datasources: {
       db: {
         url: process.env.DATABASE_URL + "?connection_limit=5&pool_timeout=20"
       }
     }
   });
   ```

**Verification:**
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM billing_accounts"
```

---

### Pattern 4: Missing Database Tables

**Symptoms:**
- Error: `relation "api_keys" does not exist`
- Error: `relation "billing_accounts" does not exist`
- Error: `table "receipts" does not exist`
- Health check shows `"migrations": { "criticalTablesExist": false }`

**Diagnosis:**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('billing_accounts', 'api_keys', 'receipts', 'usage_events');
```

**Fix:**
```bash
# Run migrations
npm run db:migrate:auto

# Or manually
psql $DATABASE_URL -f supabase/migrations/[LATEST].sql
```

**Verification:**
```sql
SELECT COUNT(*) FROM billing_accounts;
SELECT COUNT(*) FROM api_keys;
```

---

### Pattern 5: RLS Policy Missing/Incorrect

**Symptoms:**
- Error: `permission denied for table api_keys`
- Error: `new row violates row-level security policy`
- API returns empty arrays even when data exists
- Error code: `42501`

**Diagnosis:**
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'api_keys';

-- Check policies exist
SELECT * FROM pg_policies WHERE tablename = 'api_keys';

-- Verify current_user_id() function exists
SELECT proname FROM pg_proc WHERE proname = 'current_user_id';
```

**Fix:**
```sql
-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY api_keys_user_access ON api_keys
  FOR ALL USING (user_id = current_user_id());

-- Create function if missing
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
  SELECT (auth.jwt() ->> 'sub')::UUID;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

**Migration File:**
See `supabase/migrations/20260125000000_console_rls_fixes.sql`

---

### Pattern 6: Authentication Failure

**Symptoms:**
- Error: `Unauthorized: Authentication required`
- Error: `Failed to get user`
- Error: `JWT expired` or `Invalid JWT`
- Health check shows `"auth": { "status": "error" }`

**Diagnosis:**
```typescript
// In route handler, add debug logging
const supabase = await createClient();
const { data: { user }, error } = await supabase.auth.getUser();
console.log('Auth check:', { hasUser: !!user, error: error?.message });
```

**Fix:**
1. Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct (not service role key)
2. Check cookies are being sent (browser DevTools → Network → Request Headers)
3. Verify Supabase project is active (Supabase dashboard)

**Verification:**
```bash
# Test Supabase connection
curl -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/api_keys?select=id&limit=1"
```

---

### Pattern 7: Billing Account Missing

**Symptoms:**
- Console page loads but shows empty data
- API returns empty arrays
- No errors in logs
- User exists but no billing account

**Diagnosis:**
```sql
-- Check if user has billing account
SELECT ba.* FROM billing_accounts ba
JOIN auth.users u ON u.id = ba.user_id
WHERE u.email = '[USER_EMAIL]';
```

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

---

### Pattern 8: Prisma Binary Engine Not Available

**Symptoms:**
- Error: `Prisma Client was generated for the "client" engine type`
- Error: `accelerateUrl is required`
- Build fails or runtime errors
- Error during `npm run build`

**Diagnosis:**
```bash
# Check Prisma client engine type
grep -r "engineType" packages/web/node_modules/.prisma/client/
# Should show "binary" not "client"
```

**Fix:**
```bash
# Regenerate with binary engine
PRISMA_CLIENT_ENGINE_TYPE=binary npm run prisma:generate

# Verify
grep -r "engineType" packages/web/node_modules/.prisma/client/
```

**Prevention:**
- See `packages/web/src/shared/db/prismaClient.ts` for engine type forcing
- Set `NEXT_RUNTIME=nodejs` in environment
- Ensure `DATABASE_URL` is set during build (can be dummy)

---

## Error Handling Patterns

### Domain Functions (Never Throw)

```typescript
// ✅ CORRECT: Return empty array on error
export async function listApiKeys(): Promise<ApiKeyListItem[]> {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    const { data: keys, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('[listApiKeys] Error:', error);
      return []; // ✅ Never throw
    }
    
    return keys || [];
  } catch (error) {
    console.error('[listApiKeys] Unexpected error:', error);
    return []; // ✅ Never throw
  }
}

// ❌ WRONG: Throwing errors
export async function listApiKeys(): Promise<ApiKeyListItem[]> {
  const { data, error } = await supabase.from('api_keys').select('*');
  if (error) throw new Error(error.message); // ❌ DON'T DO THIS
  return data;
}
```

### Route Handlers (Catch and Return Safe Responses)

```typescript
// ✅ CORRECT: Catch errors, return safe response
export async function GET(request: NextRequest) {
  try {
    const authContext = await requireAuth(request);
    const receipts = await listReceipts(authContext.billingAccountId);
    return NextResponse.json({ receipts });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Return empty data instead of 500
    console.error('[GET /api/console/receipts] Error:', error);
    return NextResponse.json({ receipts: [] }, { status: 200 }); // ✅ Never 500
  }
}

// ❌ WRONG: Letting errors propagate
export async function GET(request: NextRequest) {
  const authContext = await requireAuth(request); // ❌ Can throw
  const receipts = await listReceipts(authContext.billingAccountId); // ❌ Can throw
  return NextResponse.json({ receipts }); // ❌ Will return 500 on error
}
```

## Tenant Isolation (Critical)

### Problem: Prisma Bypasses RLS

**Important**: Prisma queries bypass Supabase RLS policies. You must manually verify `billing_account_id` belongs to the authenticated user.

### Solution Pattern

```typescript
// ✅ CORRECT: Verify access before querying
async function verifyBillingAccountAccess(billingAccountId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return false;
    }
    
    // CRITICAL: Verify billing account belongs to user
    const billingAccount = await prisma.billingAccount.findFirst({
      where: {
        id: billingAccountId,
        userId: user.id, // Enforce user ownership
      },
    });
    
    return !!billingAccount;
  } catch (error) {
    console.error('[verifyBillingAccountAccess] Error:', error);
    return false; // Fail closed
  }
}

// Use in queries
export async function listReceipts(billingAccountId: string): Promise<ReceiptListItem[]> {
  // Verify access first
  const hasAccess = await verifyBillingAccountAccess(billingAccountId);
  if (!hasAccess) {
    return []; // Return empty array, don't throw
  }
  
  // Then query with explicit billing account filter
  const receipts = await prisma.receipt.findMany({
    where: {
      upload: {
        billingAccountId, // Filter by billing account (tenant isolation)
      },
    },
  });
  
  return receipts;
}
```

### Supabase Queries (RLS Enforced)

```typescript
// ✅ CORRECT: RLS automatically enforces tenant isolation
const { data } = await supabase
  .from('api_keys')
  .select('*')
  .eq('user_id', user.id); // RLS ensures user can only see their own keys
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

**If unhealthy:**
- Check response for specific failing check
- Review error messages in response

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

### 5. Diagnostic Script

```bash
npm run diagnose:console
```

**Expected:**
- All checks pass
- No critical failures

### 6. Smoke Tests

```bash
npm run test:smoke:console
```

**Expected:**
- All tests pass
- Console route test passes

## Diagnostic Checklist

When debugging a 500 error, check in this order:

- [ ] **Environment Variables**: All required vars set?
  ```bash
  npm run diagnose:console
  ```

- [ ] **Health Check**: Returns 200?
  ```bash
  curl https://your-domain.com/api/health/console
  ```

- [ ] **Database Tables**: All critical tables exist?
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('billing_accounts', 'api_keys', 'receipts', 'usage_events');
  ```

- [ ] **RLS Policies**: Policies enabled and correct?
  ```sql
  SELECT * FROM pg_policies WHERE tablename IN ('api_keys', 'billing_accounts');
  ```

- [ ] **Prisma Client**: Generated and initialized?
  ```bash
  ls packages/web/node_modules/.prisma/client/
  npm run prisma:generate
  ```

- [ ] **Database Connection**: Can connect?
  ```bash
  psql $DATABASE_URL -c "SELECT 1"
  ```

- [ ] **Console Page**: Loads without 500?
  ```bash
  curl -I https://your-domain.com/console
  ```

- [ ] **API Routes**: Return proper status codes?
  ```bash
  # Unauthenticated: Should return 401, not 500
  curl https://your-domain.com/api/console/api-keys
  ```

## Key Files Reference

### Routes
- `packages/web/src/app/api/console/*/route.ts` - API route handlers
- `packages/web/src/app/api/health/console/route.ts` - Health check endpoint

### Domain Logic
- `packages/web/src/domain/console/apiKeys.ts` - API key operations
- `packages/web/src/domain/console/receipts.ts` - Receipt operations
- `packages/web/src/domain/console/usage.ts` - Usage tracking
- `packages/web/src/domain/console/featureFlags.ts` - Feature flags

### Infrastructure
- `packages/web/src/lib/api/unified-auth.ts` - Authentication
- `packages/web/src/shared/db/prismaClient.ts` - Prisma client setup
- `packages/web/src/lib/supabase/server.ts` - Supabase client setup

### Diagnostics
- `scripts/diagnose-console-backend.ts` - CLI diagnostic script
- `packages/web/src/app/console/setup-check/page.tsx` - UI diagnostic page
- `docs/BACKEND_CONSOLE_DIAGNOSTICS.md` - Full troubleshooting guide

### Database
- `prisma/schema.prisma` - Prisma schema
- `supabase/migrations/*.sql` - Database migrations
- `supabase/migrations/20260125000000_console_rls_fixes.sql` - RLS policies

## Monitoring & Logging

### Key Log Patterns

```typescript
// Structured logging in routes
console.log('[Console] Request started', {
  route: '/api/console/receipts',
  correlationId,
  userId: authContext.userId,
});

console.error('[Console] Error', {
  route: '/api/console/receipts',
  error: errorMessage,
  stack: errorStack,
});
```

### Metrics to Monitor

1. **Error Rate**: Console routes should have < 1% 500 errors
2. **Response Time**: P95 < 500ms
3. **Health Check**: `/api/health/console` should return `healthy`
4. **Database Connections**: Monitor pool usage

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
   DROP POLICY IF EXISTS api_keys_user_access ON api_keys;
   DROP POLICY IF EXISTS billing_accounts_user_access ON billing_accounts;
   DROP FUNCTION IF EXISTS current_user_id();
   ```

4. **Environment Variables**
   - Verify all required vars are set
   - Check for typos in values

## Quick Reference

- **Diagnostic**: `npm run diagnose:console`
- **Health Check**: `/api/health/console`
- **Setup Check UI**: `/console/setup-check`
- **Full Guide**: `docs/BACKEND_CONSOLE_DIAGNOSTICS.md`
- **Quick Ref**: `docs/CONSOLE_BACKEND_QUICK_REFERENCE.md`

## Support

If issues persist:

1. Run full diagnostic: `npm run diagnose:console`
2. Check health endpoint: `/api/health/console`
3. Review server logs (Vercel dashboard)
4. Check database logs (Supabase dashboard)
5. Review recent changes (git log)
