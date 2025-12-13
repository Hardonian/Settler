# Console Setup Guide - Fixing Internal Server Error

## Problem
The `/console` route is returning a 500 Internal Server Error. This is likely due to missing Supabase tables or database configuration.

## Quick Diagnostic

Visit `/console/setup-check` to see what's missing. This diagnostic page will show you:
- ✅ What's configured correctly
- ⚠️ What has warnings
- ❌ What's failing

## Required Supabase Setup

### 1. Environment Variables (Vercel)

Ensure these are set in your Vercel project settings:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key
- `DATABASE_URL` - Your PostgreSQL connection string (for Prisma)

**Recommended:**
- `SUPABASE_SERVICE_ROLE_KEY` - For admin operations (API keys management)

### 2. Supabase Tables

The console requires these Supabase tables:

#### `api_keys` Table

```sql
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  name TEXT,
  scopes TEXT[] DEFAULT ARRAY['*'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX idx_api_keys_revoked ON api_keys(revoked_at) WHERE revoked_at IS NULL;
```

**RLS Policies:**
```sql
-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Users can only see their own keys
CREATE POLICY "Users can view own api_keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own keys
CREATE POLICY "Users can create own api_keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own keys
CREATE POLICY "Users can update own api_keys"
  ON api_keys FOR UPDATE
  USING (auth.uid() = user_id);
```

### 3. Prisma Database Tables

The console also uses Prisma to access these tables (via `DATABASE_URL`):

- `billingAccount` - User billing accounts
- `usageEvent` - API usage tracking
- `receipt` - Parsed receipts
- `featureFlag` - Feature flags

These should be created via Prisma migrations. Run:

```bash
npm run prisma:migrate
# or
npx prisma migrate deploy
```

## Common Issues & Solutions

### Issue 1: "api_keys table does not exist"

**Solution:** Run the SQL above in your Supabase SQL editor to create the table.

### Issue 2: "Prisma client not properly initialized"

**Solution:** 
1. Ensure `DATABASE_URL` is set in Vercel
2. Run `npm run prisma:generate` locally or ensure it runs in build
3. Check that Prisma migrations have been applied

### Issue 3: "Missing environment variables"

**Solution:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all required variables listed above
3. Redeploy

### Issue 4: "RLS policies blocking access"

**Solution:**
- The `api_keys` table needs RLS policies (see SQL above)
- Or temporarily disable RLS for testing: `ALTER TABLE api_keys DISABLE ROW LEVEL SECURITY;`

### Issue 5: "Database connection failed"

**Solution:**
1. Verify `DATABASE_URL` is correct
2. Check if database is accessible from Vercel (not blocked by firewall)
3. Ensure database exists and is running

## Testing

1. Visit `/console/setup-check` to see diagnostics
2. Fix any failing checks
3. Visit `/console` again

## Fallback Behavior

The console page now has comprehensive error handling:
- ✅ Never crashes with 500 errors
- ✅ Shows user-friendly error messages
- ✅ Renders with empty data if tables are missing
- ✅ Provides diagnostic links

Even if tables are missing, the page will render (with empty data) instead of crashing.

## Next Steps

1. **Run diagnostics**: Visit `/console/setup-check`
2. **Create missing tables**: Use the SQL provided above
3. **Set environment variables**: Add to Vercel project settings
4. **Run migrations**: Ensure Prisma migrations are applied
5. **Test again**: Visit `/console`

## Support

If issues persist after following this guide:
1. Check Vercel build logs for specific errors
2. Check Supabase logs for database errors
3. Review the diagnostic page output
4. Check browser console for client-side errors
