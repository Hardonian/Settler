# Authenticated Route Evidence Map (Local Runtime Truth)

Last updated: 2026-03-15

This map tracks authenticated surfaces that were directly inspected in `packages/web/src/app/**` and validated via runtime checks (`pnpm run verify:routes`) plus repository verification scripts (`pnpm run verify:all`, `pnpm run verify:repo`, `pnpm run doctor`, `pnpm build`).

## Auth validation strategy used in this pass

1. **No auth bypass was added.** Validation stays on the real guards (`middleware.ts`, route-level `supabase.auth.getUser()`, tenant membership checks, and per-route API authorization).
2. **Local proof mode is explicit and environment-gated.** `SETTLER_VERIFY_MODE=1` is only set inside `scripts/verify-routes.mjs`; it does not mint sessions and does not weaken production auth.
3. **Truthful degraded-state validation** was used where credentials are absent in CI/local shells:
   - unauthenticated redirects
   - env-missing states
   - backend unavailable states
   - billing-disabled states when Stripe keys are missing

## Route inventory by major authenticated group

| Route group                                       | Auth                   | Org / Tenant           | Membership                       | Backend     | Supabase           | Stripe             | Current truth state                           | States validated                                                                                   | Actions audited                                                                                  |
| ------------------------------------------------- | ---------------------- | ---------------------- | -------------------------------- | ----------- | ------------------ | ------------------ | --------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `/app/**` (`packages/web/src/app/app/**`)         | Yes                    | Often                  | Often                            | Mixed       | Usually            | No                 | Healthy shell + truthful degraded behavior    | redirect/non-500 behavior via `verify:routes`; env-missing startup warning                         | deep links and route rendering (non-500)                                                         |
| `/console/**` (`packages/web/src/app/console/**`) | Mixed, mostly required | Mixed                  | Mixed                            | Usually yes | Usually yes        | Billing pages only | Degraded-but-truthful                         | signed-out redirect in diagnostics; env-missing in layout/startup; no-data warnings in diagnostics | diagnostics cards, console error recovery actions, not-found navigation                          |
| `/console/billing`                                | Yes (API-backed)       | Tenant billing account | yes for meaningful account state | Yes         | Often              | Yes                | Billing-disabled messaging when Stripe absent | Stripe missing warning/disabled upgrade posture                                                    | `Manage Billing`, `Upgrade` buttons are conditionally hidden/disabled when Stripe not configured |
| `/console/diagnostics`                            | Yes                    | Optional               | Optional                         | Yes         | Yes for full probe | Optional           | Explicit dependency-specific cards            | Supabase missing, Supabase query failure, DB failure, Stripe missing, no webhook data, no run data | diagnostics cards are informational only (no fake control actions)                               |
| `/dashboard/**` legacy                            | Mixed                  | Mixed                  | Mixed                            | Mixed       | Mixed              | Mixed              | Thin-but-safe                                 | not-found state standardized                                                                       | dashboard not-found action                                                                       |

## Shared authenticated failure-state primitives hardened

`packages/web/src/components/shared/route-state.tsx` now exposes standardized variants:

- `auth-required`
- `no-organization`
- `membership-missing`
- `forbidden`
- `backend-unreachable`
- `env-missing`
- `billing-disabled`
- `no-data`
- `not-found`

These variants centralize wording and action affordances so routes stop improvising ambiguous failure copy.

## Action / control reality audit (representative)

- **Console error boundary actions** now map to explicit auth vs backend failure states (retry, back to console, sign-in).
- **Console/Dashboard not-found** now use shared `not-found` state primitive.
- **Billing controls** remain dependency-gated (no Stripe = no fake portal/checkout confidence).

## Verification repair summary

### Fixed in-repo failures

- `verify:all` failure in `validate:nextjs`: fixed by removing JSON comment from `packages/web/tsconfig.json`.
- `verify:repo` failure for stale script targets: fixed root script references from `src/index.ts` to `packages/cli/src/index.ts`.

### Remaining blockers (truthful)

- `pnpm build` fails in this environment because required runtime secrets are intentionally absent (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, database DSN).
- `pnpm run doctor` fails for the same missing env contracts (expected external/environmental blocker).
- Full signed-in + seeded-org membership proof remains conditional on local Supabase credentials + seeded tenant fixtures.
