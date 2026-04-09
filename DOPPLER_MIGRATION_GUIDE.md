# Doppler Secret Migration Guide

## Problem
Supabase platform rejects custom environment variables that start with `SUPABASE_`. Since you're syncing secrets from Doppler to Supabase (via GitHub, Vercel, and Supabase), these variables get rejected.

## Solution Applied
Renamed server-side environment variables to avoid the reserved `SUPABASE_` prefix:

| Old Doppler Name | New Doppler Name | Value Example |
|------------------|------------------|---------------|
| `SUPABASE_URL` | `DATABASE_URL` | `postgresql://...` or `https://xyz.supabase.co` |
| `SUPABASE_ANON_KEY` | `ANON_KEY` | `eyJhbG...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `SERVICE_ROLE_KEY` | `eyJhbG...` |

**Keep unchanged:**
- `NEXT_PUBLIC_SUPABASE_URL` (browser needs this)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (browser needs this)

## Steps to Complete Migration

### 1. Update Doppler (One-time setup)

1. Go to Doppler dashboard → Settler project
2. For each environment (dev, staging, prod):
   - Rename `SUPABASE_URL` → `DATABASE_URL` (or just use existing DATABASE_URL)
   - Rename `SUPABASE_ANON_KEY` → `ANON_KEY`
   - Rename `SUPABASE_SERVICE_ROLE_KEY` → `SERVICE_ROLE_KEY`
   - Delete the old `SUPABASE_*` keys (keep NEXT_PUBLIC_*)

### 2. Let Doppler Sync

Doppler will automatically sync to:
- ✅ GitHub Actions (via integration)
- ✅ Vercel (via integration)  
- ✅ Supabase (via integration)

### 3. Verify in Supabase Dashboard

Go to Supabase dashboard → Project Settings → Environment Variables

You should see:
- ✅ `DATABASE_URL`
- ✅ `ANON_KEY`
- ✅ `SERVICE_ROLE_KEY`
- ❌ No more errors about reserved prefixes

### 4. Redeploy

Trigger a new deployment to pick up the new env vars:
- Vercel: Redeploy from dashboard or push new commit
- Supabase Edge Functions: Redeploy functions

## What Was Changed in Code

### Files Modified:
1. `packages/types/src/typed-env.ts` - Updated env validation schemas
2. `packages/types/src/env-validation.ts` - Updated validation
3. `.github/workflows/ci.yml` - Updated CI env vars

### Commit:
```
bb41c53b2 refactor(env): rename SUPABASE_* env vars to avoid reserved prefix
```

## Rollback Plan

If issues arise:
1. Revert commit: `git revert bb41c53b2`
2. Restore old Doppler secret names
3. Contact Supabase support about reserved prefix restrictions

## Verification Checklist

- [ ] Doppler secrets renamed (not duplicated)
- [ ] Sync completed to GitHub/Vercel/Supabase
- [ ] Supabase dashboard shows new var names
- [ ] CI pipeline passes
- [ ] Staging deployment works
- [ ] Production deployment works
