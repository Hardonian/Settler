# Environment Variable Migration
## Supabase Reserved Prefix Issue Resolution

### Problem
Supabase doesn't allow custom environment variables that start with `SUPABASE_`.
Since Doppler syncs to Supabase, these variables get rejected.

### Solution
Rename environment variables to avoid the `SUPABASE_` prefix:

| Old Name | New Name | Notes |
|----------|----------|-------|
| `SUPABASE_URL` | `DATABASE_URL` | Already used by Prisma |
| `SUPABASE_SERVICE_ROLE_KEY` | `SERVICE_ROLE_KEY` | Service role for backend |
| `SUPABASE_ANON_KEY` | `ANON_KEY` | Keep `NEXT_PUBLIC_SUPABASE_ANON_KEY` for browser |

### Files to Update

1. **packages/types/src/typed-env.ts** - Env validation schemas
2. **packages/types/src/env-validation.ts** - Additional validation
3. **.github/workflows/ci.yml** - CI workflow env vars
4. **Any code using process.env.SUPABASE_*** - Code references

### Migration Steps

1. Update Doppler secrets (new names without SUPABASE_ prefix)
2. Doppler syncs to GitHub, Vercel, Supabase
3. Deploy code changes
4. Verify in Supabase dashboard that secrets appear

### Code Changes Required

```typescript
// OLD
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// NEW
const supabaseUrl = process.env.DATABASE_URL?.replace('/postgres', '') || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SERVICE_ROLE_KEY;
```

### CI Changes

```yaml
# OLD
env:
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}

# NEW
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  SERVICE_ROLE_KEY: ${{ secrets.SERVICE_ROLE_KEY }}
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```
