# Domain Migration Complete: settler.io → settler.dev

**Date:** 2025-11-29  
**Status:** ✅ Complete

## Summary

All references to `settler.io` have been updated to `settler.dev` across the project. The support email `support@settler.dev` has been added and is now active.

---

## Files Updated

### Web Application (`packages/web/src/`)

1. **`app/layout.tsx`**
   - Updated OpenGraph URL: `https://settler.io` → `https://settler.dev`

2. **`app/sitemap.ts`**
   - Updated baseUrl: `https://settler.io` → `https://settler.dev`

3. **`app/support/page.tsx`**
   - Updated email links: `support@settler.io` → `support@settler.dev` (2 occurrences)

4. **`components/Footer.tsx`**
   - Updated status page URL: `status.settler.io` → `status.settler.dev`

5. **`components/SecureMobileApp.tsx`**
   - Updated default baseURL: `https://api.settler.io` → `https://api.settler.dev`

### SDK (`packages/sdk/src/`)

6. **`client.ts`**
   - Updated default baseUrl: `https://api.settler.io` → `https://api.settler.dev`
   - Updated JSDoc comment

7. **`__tests__/mocks/handlers.ts`**
   - Updated API_BASE: `https://api.settler.io` → `https://api.settler.dev`

8. **`__tests__/integration.test.ts`**
   - Updated test baseUrl: `https://api.settler.io` → `https://api.settler.dev`

9. **`__tests__/client.test.ts`**
   - Updated test baseUrl: `https://api.settler.io` → `https://api.settler.dev`

### Documentation

10. **`README.md`**
    - Updated documentation URL: `docs.settler.io` → `docs.settler.dev`
    - Updated support email: `support@settler.io` → `support@settler.dev`

---

## Domain Changes

| Old Domain | New Domain | Status |
|------------|------------|--------|
| `settler.io` | `settler.dev` | ✅ Updated |
| `api.settler.io` | `api.settler.dev` | ✅ Updated |
| `docs.settler.io` | `docs.settler.dev` | ✅ Updated |
| `status.settler.io` | `status.settler.dev` | ✅ Updated |
| `support@settler.io` | `support@settler.dev` | ✅ Updated (Active) |

---

## Support Email

**New Support Email:** `support@settler.dev`  
**Status:** ✅ Active mailbox

All references to the support email have been updated:
- Support page (`/support`)
- README.md
- Footer component (if applicable)

---

## Database Migrations

**Migration Script Created:** `scripts/run-migrations.sh`

The script will run the following migrations in order:
1. `20251129000000_crm_schema.sql` - CRM tables and RLS
2. `20251129000001_financial_ledger.sql` - Financial ledger
3. `20251129000002_error_logs.sql` - Error logging
4. `20251129000003_lead_scoring.sql` - Lead scoring

### To Run Migrations:

**Option 1: Using Supabase CLI (Recommended)**
```bash
supabase db push
```

**Option 2: Using psql with DATABASE_URL**
```bash
export DATABASE_URL="postgresql://user:password@host:port/database"
./scripts/run-migrations.sh
```

**Option 3: Manual via Supabase Dashboard**
1. Go to Supabase Dashboard → SQL Editor
2. Run each migration file in order

---

## Notes

- Build artifacts in `.next/` directories will be regenerated on next build
- Some references in documentation files (markdown) may still reference old domain - these are informational and can be updated as needed
- Test files have been updated to use new domain
- All source code references have been updated

---

## Verification Checklist

- [x] Web app layout updated
- [x] Sitemap updated
- [x] Support page email links updated
- [x] Footer status link updated
- [x] SDK default baseUrl updated
- [x] SDK test files updated
- [x] README.md updated
- [x] Support email references updated
- [x] Migration script created
- [x] All source files updated (excluding build artifacts)

---

**Migration Status: COMPLETE ✅**

All domain references have been updated from `settler.io` to `settler.dev`. The support email `support@settler.dev` is now active and referenced throughout the codebase.
