# M1 Boundary Audit — Reality→Code Lock

Date: 2026-02-24

## Scope

- Marketing/public routes under `packages/web/src/app`.
- Authenticated shell under `/app` (`packages/web/src/app/app`).
- Middleware and env access utilities.
- Deterministic boundary for new minimal Runs scaffold.

## Findings

### 1) Route/provider boundary status

- Root layout (`packages/web/src/app/layout.tsx`) is shared by both marketing and `/app` routes. It currently wires generic UI providers (`QueryProvider`, `RuntimeUiConfigProvider`, `TenantThemeProvider`) but does not directly import Supabase/session/auth modules. This is safe but broad-scoped.
- `/app` subtree has its own layout at `packages/web/src/app/app/layout.tsx`, but before M1 it did not enforce auth or env checks.
- Middleware matcher already scopes to `"/app/:path*"` and `"/api/:path*"`, so marketing routes are not auth-gated by middleware and avoid auth refresh execution.

### 2) Auth/Supabase bleed risks

- No direct imports of `@/lib/supabase` were detected in non-API marketing route files during audit.
- `/app` lacked explicit server-side auth gating in its layout, allowing shell content to render without confirmed session state.

### 3) Env safety and import-time throw risks

- `packages/web/src/lib/env/runtime-access.ts` already provides non-throwing env status checks (good for graceful degradation).
- `packages/web/src/lib/env/validator.ts` has throwing helpers (`getSupabaseEnv`, `requireEnvVar`) that are safe only when called intentionally at runtime, not at module import.
- `packages/web/src/lib/supabase/server.ts` catches env errors in `createClient()` and returns degraded clients, reducing hard-500 risk.

### 4) Determinism boundary audit

- Existing codebase contains non-deterministic patterns (e.g., `Date.now()`, `Math.random()`, locale-sensitive compares in some areas), but they are outside M1’s minimal deterministic Runs scaffold.
- No dedicated deterministic core helper module existed for stable sort + canonical JSON + run ID derivation for `/app/runs`.

## Offenders / watchlist (outside strict M1 scope)

- Locale-sensitive sort usage found (e.g., `localeCompare`), which can diverge across environments if locale is implicit.
- Random/time-derived IDs in several utility modules (`Math.random`, `Date.now`) are unsuitable inside deterministic boundaries.

## M1 lock decisions

- Keep marketing auth-free and env-tolerant by enforcing checks only under `/app` layout + middleware.
- Add deterministic helper module that uses:
  - code-point string compare (no locale dependence)
  - stable object key ordering
  - SHA-256 hash from canonical serialized input for run IDs
- Add tests that force locale/timezone changes and prove deterministic outputs remain stable.
