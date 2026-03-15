# Authenticated Route Evidence Map (Local Runtime Truth)

Last updated: 2026-03-15

This map documents what can be **proven from repository behavior** in local runtime without inventing production-only signals.

## Auth validation strategy used

- Primary gate for app shell routes: `middleware.ts` + `isAppAuthRequiredRoute` for `/app/**`.
- Runtime identity checks on console routes: server components call `supabase.auth.getUser()` and handle signed-out state with explicit redirect or route-state UI.
- Safety model: no dev auth bypass was introduced; no production auth path was weakened.

## Major authenticated surface inventory

| Route group     | Auth required                                                | Tenant context required                                          | Supabase required              | Backend/data required             | Stripe required                     | Current truth state                                                                          |
| --------------- | ------------------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------ | --------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------- |
| `/app/**`       | Yes (middleware + layout user check)                         | Optional per page, header renders tenant metadata when available | Yes for real session hydration | Mixed                             | No                                  | Healthy when Supabase/session exists; explicit signed-out and missing-env states are present |
| `/console/**`   | Mixed (route-level checks, not globally middleware-enforced) | Mixed                                                            | Usually yes                    | Yes for most diagnostics/ops data | Optional for billing-adjacent views | Degraded-but-truthful: per-page auth checks and explicit warnings for missing dependencies   |
| `/dashboard/**` | Mixed (legacy surfaces)                                      | Mixed                                                            | Mixed                          | Mixed                             | Mixed                               | Thin surface; behavior depends on individual route implementation                            |
| `/billing/**`   | Yes for meaningful actions                                   | Tenant/account required for real plan state                      | Often                          | Yes                               | Yes                                 | Conditional: should be treated as disabled/degraded when Stripe env is absent                |

## Route-level evidence updated in this pass

### `/console/diagnostics`

- Signed out users are redirected to `/login?next=/console/diagnostics`.
- Diagnostics now distinguish:
  - Supabase not configured (configuration warning, not fake “healthy” state)
  - Supabase query failure (health error)
  - Database connectivity failure (health error)
  - Stripe keys missing (configuration warning; billing actions should be treated as disabled)
  - No webhook/no run history (data warning; not auth failure)
- Each diagnostic card now includes a **category** (`health`, `configuration`, `integration`, `data`) and explicit detail text to reduce ambiguous “warning mush”.

## Residual conditionality

- Full tenant-membership and RLS-denial UX still depends on seeded auth + tenant fixtures in the local environment.
- Console routes still rely on per-page auth checks; there is no single middleware hard gate for all `/console/**` paths.
- Billing truth remains environment-conditional on Stripe keys and webhook pipeline availability.
