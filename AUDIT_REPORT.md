# Supabase & Application Security Audit Report

**Date:** January 7, 2026
**Auditor:** System (Gemini 3)
**Target:** Monorepo (Next.js App Router + Supabase)

## 1. Executive Summary

This audit examined the Supabase backend configuration and the Next.js application execution layer. The project uses a hybrid approach with **Supabase Migrations** as the likely source of truth for the database schema, while **Prisma** is used for type-safe database access in the application.

**Key Findings:**
- **Schema Management:** Dual configuration detected (`supabase/migrations` vs `prisma/schema.prisma`). Risk of drift if not strictly synchronized.
- **Middleware:** Robust try-catch blocks present, but explicit tenant isolation enforcement is delegated to route handlers/layouts rather than centralized in middleware.
- **RLS:** Critical reliance on RLS for multi-tenancy. Policies must be strictly enforced.
- **Edge Functions:** Extensive use of Edge Functions for background tasks and integrations.

**Risk Rating:** **HIGH** (Due to complexity of multi-tenancy and dual schema definitions)

## 2. Repo Inventory & Architecture

- **Framework:** Next.js App Router (`packages/web/src/app`)
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma (`packages/web/src/shared/db`)
- **Auth:** Supabase Auth (Cookie-based)
- **Tenancy:** Organization/Tenant-based (Table: `tenants`, Membership via `billing_accounts` owner or `metadata`)

### Key Paths
- **Middleware:** `packages/web/middleware.ts`
- **Schema:** `prisma/schema.prisma`
- **Migrations:** `supabase/migrations/`
- **Edge Functions:** `supabase/functions/`

## 3. Deployed State & Drift Analysis (Methodology)

Since direct database access is restricted, this audit provides the **exact commands** required to verify the deployed state against the repository expectations.

### Verification Plan
Run the evidence queries below via the Supabase SQL Editor or `psql` to capture the current state. Compare the output against `prisma/schema.prisma` and `supabase/migrations`.

### Evidence Queries (Mandatory)

**1. Table Inventory**
```sql
select table_schema, table_name
from information_schema.tables
where table_schema not in ('pg_catalog','information_schema')
order by 1,2;
```

**2. RLS Status (CRITICAL)**
```sql
select n.nspname as schema, c.relname as table,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where c.relkind='r'
  and n.nspname not in ('pg_catalog','information_schema')
order by 1,2;
```

**3. Policy Inventory**
```sql
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
order by 1,2,3;
```

**4. Index Inventory**
```sql
select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname not in ('pg_catalog','information_schema')
order by 1,2,3;
```

**5. Function Definitions (Security Definitive)**
```sql
select n.nspname, p.proname, p.prosecdef as security_definer, pg_get_functiondef(p.oid)
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname not in ('pg_catalog','information_schema')
order by 1,2;
```

## 4. Risks & Findings

### A. Schema Drift (In-Repo vs. In-DB)
- **Risk:** High. `prisma/schema.prisma` defines 20+ models (Billing, Recon, CMS, etc.). If `supabase db push` hasn't been run or if migrations are out of sync, the app will crash on 500s.
- **Mitigation:** The provided `remainder_consolidation.sql` forces the DB to match the Prisma schema using idempotent `IF NOT EXISTS` checks.

### B. Policy Duplication
- **Risk:** Medium. Overlapping permissive policies can accidentally grant wider access than intended.
- **Finding:** Existing policies in `supabase/migrations` (e.g., `00000004_rls_consolidation.sql`) must be checked. The consolidation script avoids creating duplicates.

### C. Mutable Search Path
- **Risk:** High. `SECURITY DEFINER` functions without `SET search_path` can be hijacked.
- **Action:** All new functions in the consolidation script use strict `SET search_path = pg_catalog, public`.

### D. Middleware Gaps
- **Risk:** Medium. Middleware logs and adds headers but does not strictly block cross-tenant access.
- **Finding:** `packages/web/middleware.ts` handles session refresh well but relies on `isPublicRoute` list.
- **Action:** Ensure `packages/web/src/shared/tenant/tenantResolver.ts` is used in every protected Server Component.

## 5. Action Plan

1.  **Apply Migration:** Run `supabase db push` or apply `supabase/migrations/20260107000000_remainder_consolidation.sql` (created below).
2.  **Verify RLS:** Run Evidence Query #2 to ensure all new tables have RLS enabled.
3.  **Automate:** Merge `.github/workflows/supabase-migrate.yml` to prevent future drift.
4.  **Monitor:** Watch Supabase logs for `401` vs `500` errors on API routes.
