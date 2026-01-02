# Quick Start Guide - Supabase Backend Validation

## 🚀 5-Minute Setup

```bash
# 1. Set your database URL
export DATABASE_URL="your-supabase-connection-string"

# 2. Capture current state
psql $DATABASE_URL -f INTROSPECTION.sql

# 3. See what's missing
psql $DATABASE_URL -f GAPS_REPORT.sql

# 4. Fix gaps (idempotent - safe to run multiple times)
psql $DATABASE_URL -f PATCH.sql

# 5. Verify everything works
psql $DATABASE_URL -f VERIFY.sql
```

## ✅ What Gets Fixed

- Missing critical tables (`tenants`, `billing_accounts`)
- Missing RLS policies
- Missing indexes
- Missing helper functions
- Incorrect grants
- Realtime configuration

## 🛡️ Safety

- ✅ **100% Idempotent** - Safe to run multiple times
- ✅ **Non-destructive** - Never drops data
- ✅ **Additive only** - Only adds missing objects

## 📋 Files

| File | Purpose |
|------|---------|
| `INTROSPECTION.sql` | Capture current DB state |
| `GAPS_REPORT.sql` | Identify what's missing |
| `PATCH.sql` | Fix gaps (idempotent) |
| `VERIFY.sql` | Prove it worked |
| `ROLLBACK.sql` | Undo changes (if needed) |
| `REALITY.md` | Full documentation |

## 🔍 Quick Checks

### Check if RLS is enabled
```sql
SELECT relname, relrowsecurity 
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
  AND relname IN ('tenants', 'billing_accounts');
```

### Check if policies exist
```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('tenants', 'billing_accounts');
```

### Check if functions exist
```sql
SELECT proname, pg_get_function_identity_arguments(oid)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND proname IN ('get_user_tenant_ids', 'current_tenant_id');
```

## ⚠️ Common Issues

**"relation does not exist"**
→ Run migrations in order first

**"permission denied"**
→ Need superuser or owner role

**RLS blocking queries**
→ Check user has tenant membership

## 📚 Full Docs

See `REALITY.md` for comprehensive documentation.

---

**Status:** ✅ Ready to use  
**Last Updated:** 2025-01-22
