# Settler Implementation Verification Guide

## Pre-Verification Checklist

1. ✅ Domain types created (`/lib/domain/types.ts`)
2. ✅ Judgment layer rules engine (`/lib/judgment/rules.ts`)
3. ✅ Service layer (`/lib/server/settler/*`)
4. ✅ Feature flags registry (`/lib/flags/registry.ts`)
5. ✅ Database migrations created
6. ✅ API routes created
7. ⏳ TypeScript compilation
8. ⏳ Linting
9. ⏳ Build verification
10. ⏳ Runtime smoke tests

## Local Verification Steps

### 1. TypeScript Compilation

```bash
cd packages/web
pnpm typecheck
```

**Expected**: No type errors

### 2. Linting

```bash
cd packages/web
pnpm lint
```

**Expected**: No linting errors (or only auto-fixable warnings)

### 3. Build Verification

```bash
cd packages/web
pnpm build
```

**Expected**: Build succeeds without errors

### 4. Database Migrations

```bash
# Apply migrations (if using Supabase CLI)
supabase migration up

# Or verify migrations exist
ls supabase/migrations/20260130*.sql
```

**Expected**: 
- `20260130000000_settler_receipts_hash_chain.sql`
- `20260130000001_settler_tenant_context_helper.sql`
- `20260130000002_settler_rls_hardening.sql`

## Runtime Smoke Tests

### Test 1: Console Homepage (No 500 Errors)

1. Start dev server: `pnpm dev`
2. Navigate to: `http://localhost:3000/console`
3. **Expected**: Page loads without 500 error
4. **Expected**: Shows empty state or data gracefully

### Test 2: Meaningful Changes Feed

1. Navigate to: `http://localhost:3000/api/console/meaningful-changes`
2. **Expected**: Returns `{ changes: [] }` (200 status)
3. **Expected**: No 500 error even if no data

### Test 3: Reconciliation API

1. POST to: `http://localhost:3000/api/console/reconciliation`
   ```json
   {
     "sourceId": "test_source",
     "targetAdapter": "test_target"
   }
   ```
2. **Expected**: Returns reconciliation object or error (not 500)
3. **Expected**: Error messages are typed and helpful

### Test 4: Receipts V2 API

1. GET: `http://localhost:3000/api/console/receipts-v2`
2. **Expected**: Returns `{ receipts: [] }` (200 status)
3. **Expected**: No 500 error

### Test 5: Feature Flags

1. GET: `http://localhost:3000/api/console/feature-flags`
2. **Expected**: Returns flags array (may be empty)
3. **Expected**: No 500 error

### Test 6: RLS Verification (Manual)

1. Create two test tenants
2. Create user in tenant A
3. Try to access tenant B's data via API
4. **Expected**: Returns empty array (RLS blocks access)
5. **Expected**: No data leakage

## Vercel Preview Verification

### Build Check

1. Push to branch
2. Wait for Vercel preview build
3. **Expected**: Build succeeds
4. **Expected**: No environment variable errors

### Runtime Check

1. Visit preview URL
2. Navigate to `/console`
3. **Expected**: Page loads
4. **Expected**: No 500 errors in Vercel logs

### Environment Variables

Verify these are set in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (if needed)

## Production Verification

### Pre-Deploy Checklist

- [ ] All migrations applied to production database
- [ ] RLS policies verified
- [ ] Feature flags have safe defaults
- [ ] Error boundaries in place
- [ ] No hard 500 routes

### Post-Deploy Monitoring

1. Check error rates in Sentry/Vercel logs
2. Verify no 500 errors for first 24 hours
3. Monitor API response times
4. Check RLS is working (no cross-tenant data access)

## Known Limitations

1. **Receipts table**: May need to be created if using Prisma (currently mixed approach)
2. **Tenant resolution**: Uses `getPrimaryTenant()` which may need adjustment for multi-tenant
3. **Reconciliation processing**: Currently returns placeholder - actual processing logic needed
4. **Meaningful changes**: Queries `recon_results` and `drift_events` - may need unified events table

## Follow-Up Tasks

1. Create unified events table for better change detection
2. Implement actual reconciliation processing logic
3. Add UI components for meaningful changes feed
4. Add receipt hash chain verification UI
5. Add feature flags UI for business policy controls
6. Add integration tests for RLS policies
