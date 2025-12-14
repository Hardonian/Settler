# Receipt Console End-to-End Wiring Analysis

## Phase 0: Wiring Map

### Receipt Console Components
- **UI Page**: `packages/web/src/app/console/receipts/page.tsx` - Client component that displays receipts
- **API Routes**:
  - `packages/web/src/app/api/console/receipts/route.ts` - List receipts (GET)
  - `packages/web/src/app/api/console/receipts/[id]/route.ts` - Get receipt detail (GET)
- **Domain Logic**: `packages/web/src/domain/console/receipts.ts` - Business logic for querying receipts
- **Receipt Converter API**: `packages/web/src/app/api/v1/receipts/route.ts` - Parses receipts (POST)

### Supabase Usage
- **Server Client**: `packages/web/src/lib/supabase/server.ts` - Uses `createServerClient` from `@supabase/ssr`
- **Client Client**: `packages/web/src/lib/supabase/client.ts` - Uses `createBrowserClient`
- **Admin Client**: `packages/web/src/lib/supabase/server.ts` - `createAdminClient()` uses service role (minimal usage)

### Database Layer
- **Prisma**: `packages/web/src/shared/db/prismaClient.ts` - Direct Postgres connection (bypasses RLS)
- **Supabase Tables**: Defined in `supabase/migrations/20260126000000_console_complete_setup.sql`
- **RLS Policies**: Exist in Supabase but NOT enforced when using Prisma directly

### Auth Model
- **JWT Claims**: Uses `sub` (user_id) from JWT, NOT `org_id`
- **Tenant Isolation**: `billing_account_id` → `user_id` chain
- **RLS Helper**: `current_user_id()` function extracts `sub` from JWT
- **Unified Auth**: `packages/web/src/lib/api/unified-auth.ts` - Supports session + API key auth

### Receipt Tables (Supabase)
- `receipt_uploads` - Upload metadata
- `receipts` - Parsed receipt data
- `receipt_items` - Line items

### Receipt Tables (Prisma)
- `ReceiptUpload` - Maps to `receipt_uploads`
- `Receipt` - Maps to `receipts`
- `ReceiptItem` - Maps to `receipt_items`

## Phase 1: Root Causes

### Critical Issues

1. **RLS Bypass**: Prisma connects directly to Postgres, bypassing Supabase RLS policies
   - Impact: Tenant isolation relies entirely on application code
   - Risk: If application code has bugs, tenant data could leak

2. **Missing org_id Claim**: System uses `user_id` from JWT `sub`, not `org_id`
   - Impact: Requirement mentions `org_id` but implementation uses `billing_account_id` → `user_id`
   - Risk: If multi-org support is needed later, will require migration

3. **No Error Boundaries**: Console routes can 500 if Prisma fails
   - Impact: Poor UX, no graceful degradation
   - Risk: Production errors crash pages

4. **Schema Mismatch Risk**: Prisma schema and Supabase migrations may drift
   - Impact: Type mismatches, missing columns
   - Risk: Runtime errors when accessing missing fields

5. **Missing Tenant Validation**: `listReceipts` checks billing account but doesn't verify user owns it via Supabase
   - Impact: Relies on Prisma query correctness
   - Risk: If Prisma query is wrong, could return wrong tenant's data

6. **No Receipt Converter Service**: Converter is inline in API route, not a separate microservice
   - Impact: No separate worker/queue for processing
   - Risk: API route blocks on OCR processing

## Phase 2: Schema Delta

### Missing Columns (Code expects but may not exist)
- All required columns appear to exist in both Prisma and Supabase schemas

### Missing Indexes
- Receipt queries filter by `billing_account_id` via join - indexes exist

### Missing Foreign Keys
- All FKs exist in both schemas

### Type Mismatches
- Prisma uses `Decimal` for money, Supabase uses `DECIMAL(15,2)` - compatible

## Phase 3: RLS + JWT Reality

### JWT Claims
- ✅ `sub` (user_id) exists in JWT
- ❌ `org_id` does NOT exist in JWT
- ✅ `current_user_id()` function extracts `sub` correctly

### RLS Policies
- ✅ Policies exist for receipts tables
- ⚠️ Policies use `current_user_id()` which requires JWT `sub`
- ❌ Policies NOT enforced when using Prisma (direct Postgres connection)

### Tenant Isolation
- ✅ Application code enforces via `billing_account_id` → `user_id` check
- ⚠️ Relies on Prisma query correctness, not RLS
- ⚠️ If Supabase client is used, RLS would enforce, but code uses Prisma

### Required Changes
1. **Option A (Recommended)**: Keep Prisma but add explicit tenant checks in all queries
2. **Option B**: Migrate to Supabase client for receipt queries (would enforce RLS)
3. **Option C**: Add `org_id` to JWT claims if multi-org support needed

## Phase 4: Integration Issues

### Server Component Issues
- ✅ Console page uses `createClient()` correctly
- ✅ Error handling exists but could be improved

### Unhandled Promise Rejections
- ⚠️ Some async operations lack try-catch
- ✅ API routes have error handling

### Missing Env Vars
- ✅ Code checks for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ⚠️ No validation that these are set at startup

### Runtime Mismatches
- ✅ Receipt API route uses `runtime = 'nodejs'` (correct for Prisma)
- ✅ Console routes use `runtime = 'nodejs'` (correct)

## Phase 5: E2E Test Requirements

### Test Scenarios
1. Authenticated user creates receipt via API
2. User views receipts in console
3. User views receipt detail
4. Tenant isolation (user A cannot see user B's receipts)

### Test Implementation
- Use Playwright for UI tests
- Use Vitest for API integration tests
- Use test Supabase instance with test users

## Phase 6: Supabase AI Prompt (SQL Only)

See `SUPABASE_AI_PROMPT.sql` file.
