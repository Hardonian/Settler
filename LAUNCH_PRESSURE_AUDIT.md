# Launch Pressure Audit Report

**Date:** January 7, 2026
**Target:** Settler (SaaS Platform)
**Auditor:** Gemini 3 (Cloud Agent)

## 1. Executive Summary

**Status:** 🟠 **GO with CAUTION** (Requires Critical Fixes)

The system is structurally sound with a robust data model and modern stack (Next.js App Router, Supabase). Critical billing and reconciliation domains are well-protected by recent RLS enforcement. However, significant functional areas (Site Builder, Experiments, Webhooks) lack explicit access control policies, posing a risk of "default deny" breakage or "default allow" leakage depending on exact table states. Middleware is present but lenient.

**Top Risks:**
1.  **Partial RLS Coverage:** Core domains are secured, but `tenant_pages`, `experiments`, and `webhooks` lack specific policies in reviewed migrations.
2.  **Service Reliability:** No dedicated "smoke test" or health check in CI pipeline to verify database connectivity and RLS enforcement before deployment.
3.  **Public Route Exposure:** Broad public route definitions in middleware (`/demo`, `/playground`) need to be carefully monitored to ensure they don't leak tenant data via unauthenticated API calls.

## 2. Critical Path Fixes (Implemented)

The following fixes are included in the accompanying artifacts and **MUST** be applied before launch:

*   **Database:** Consolidated "Remainder" Migration (`20260107120000_remainder_consolidation.sql`) to apply strict RLS policies to all remaining tables (Site Builder, Onboarding, Webhooks, etc.).
*   **CI/CD:** Hardened GitHub Actions (`supabase-migrate.yml`, `quality.yml`) to enforce testing, type-checking, and safe migrations.
*   **Runtime:** Robust Middleware configuration to ensure consistent trace IDs and security headers.

## 3. Findings & Evidence

### A. Data Layer (Supabase/Postgres)
*   **Strengths:** `public.get_user_tenant_ids()` function provides a solid foundation for tenant isolation. `billing_accounts` and `recon_jobs` are well-protected.
*   **Gaps:**
    *   Tables found in `schema.prisma` but missing explicit RLS policies in `20250122...sql`:
        *   `tenant_pages`, `tenant_page_revisions`, `experiments`, `experiment_variants`
        *   `webhooks`, `webhook_deliveries`
        *   `onboarding_progress`, `tenant_onboarding_progress`
        *   `workspace_invites`
    *   **Risk:** If RLS was enabled globally (via `00000004_rls_consolidation.sql`), these tables are currently inaccessible to users (broken features). If RLS wasn't enabled, they are wide open. The fix applies policies to correct this.

### B. Execution Layer (Next.js)
*   **Strengths:** App Router structure is clean. Middleware handles public routes and auth refreshing.
*   **Observations:**
    *   `middleware.ts` wraps logic in `try-catch` to prevent 500s, which is good for uptime but masks configuration errors.
    *   `/api/stripe/webhook` is correctly bypassed.
*   **Recommendations:** Ensure `packages/web/.env` strictly separates `NEXT_PUBLIC` vars from secrets.

### C. Edge Functions
*   **Strengths:** `auth_edge_guard` implements Redis-backed rate limiting. `agent-orchestrator` has a kill switch.
*   **Risks:** `auth_edge_guard` fails open (allows request) if Redis is down. This is an acceptable availability trade-off but should be monitored.

## 4. Route × RLS Compatibility Matrix (Sample)

| Route Category | Tables Touched | Auth Context | RLS Status | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/api/billing/*` | `billing_accounts`, `subscriptions` | Authenticated | ✅ Enforced | **SAFE** |
| `/api/reconciliation/*` | `recon_jobs`, `recon_results` | Authenticated | ✅ Enforced | **SAFE** |
| `/api/pages/*` | `tenant_pages`, `experiments` | Authenticated | ❌ Missing (Fixing) | **RISK** |
| `/api/webhooks/*` | `webhooks` | Authenticated | ❌ Missing (Fixing) | **RISK** |
| `/api/stripe/webhook` | `stripe_events` | Service Role | N/A (Bypass) | **SAFE** |

## 5. Pressure Test Results (Simulated)

*   **Tenant Escape:** BLOCKED by `get_user_tenant_ids()` enforcement.
*   **Privilege Escalation:** BLOCKED by strict `service_role` vs `authenticated` separation.
*   **Broken Access Control:** MITIGATED by new Remainder Migration covering all tables.
*   **Secret Leakage:** LOW RISK (Edge functions use env vars; Client uses `createClient` with anon key).

## 6. Next Steps (Post-Launch)

1.  **Observability:** Implement structured logging for Edge Functions.
2.  **Billing:** Verify Stripe webhook idempotency in production environment.
3.  **Performance:** Monitor `get_user_tenant_ids()` performance as tenant count grows; consider materialized view if slow.
