# Reality Audit (Launch Pass)

_Last updated: 2026-03-09_

## Scope audited this pass

- Stripe billing runtime surfaces: `/api/stripe/checkout`, `/api/stripe/portal`, `/console/billing`, pricing upgrade CTA.
- Ops/admin setup visibility surface: `/api/ops/integration-status` and Ops Overview UI tile.
- API stub sweep target from repository grep: `packages/api/src/routes/enterprise.ts`.

## Root causes

1. Billing runtime still contained demo-mode language and fallback semantics in Stripe service comments/proxy paths.
2. Stripe setup status was not exposed as a dedicated operator-facing capability endpoint/tile.
3. Enterprise API surface returned fabricated stub payloads instead of explicit setup-required gating.
4. Verification for Stripe setup gating behavior lacked explicit assertions for `503 + setupRequired` semantics.

## Remediations applied

- Removed remaining demo-mode semantics from `stripeService` comments/proxy failure text and aligned behavior to strict configuration gating.
- Added `/api/ops/integration-status` returning a machine-readable Stripe capability model for operators.
- Added Ops Overview UI tile to display Stripe configured vs setup-required state and setup steps.
- Replaced API enterprise stub responses with explicit `503` problem JSON gate (`ENTERPRISE_SETUP_REQUIRED`, `setupRequired: true`).
- Added API tests that assert Stripe route gating contract and enterprise route setup gating.

## Integration capability model (current)

### Stripe

- **Configured** when `STRIPE_SECRET_KEY` and required Stripe price env vars are set.
- **Setup required** when any required Stripe env is missing.
- Setup-required response is explicit in APIs with `setupRequired: true` and non-2xx status for setup gaps.

### Enterprise API surface

- Entire `/api/enterprise/*` surface now returns explicit `503` setup-required problem JSON until backend capability implementation is complete.
- No fabricated enterprise records/metrics/role matrices are returned.

## Route-by-route truth matrix (core surfaces)

| Surface                 | Route(s)                                          | Data source / behavior                                                                                 | Evidence                                            | Verdict          |
| ----------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------- | ---------------- |
| Dashboard / Ops summary | `/api/ops/overview`, Ops Overview tab             | Real DB-backed counts where available; guarded fallback returns critical status instead of fake health | Source audit + runtime fallback review              | PASS             |
| Integration status      | `/api/ops/integration-status` + Ops Overview tile | Runtime env-derived Stripe capability state                                                            | Added endpoint + UI tile + lint/typecheck/tests     | PASS             |
| Billing checkout/portal | `/api/stripe/checkout`, `/api/stripe/portal`      | Real Stripe when configured; explicit `503 setupRequired` when missing                                 | API source + tests asserting gating contract        | PASS             |
| Billing UI              | `/console/billing`, `/pricing` upgrade CTA        | Surfaces structured API error payloads; no fake Stripe redirects                                       | Source audit                                        | PASS             |
| Auth / onboarding       | `/api/console/*` + `/app/onboarding` surfaces     | Existing auth-gated behavior retained; no change in this pass                                          | Existing integration tests + route guards unchanged | PASS (unchanged) |
| Traces / jobs / replay  | `/app/traces`, admin jobs/runs                    | No new mock removal in this pass; existing pages use route-level guards                                | Existing repo tests and no code change in this pass | PASS (unchanged) |
| Admin / enterprise API  | `/api/enterprise/*`                               | Previously stubs; now explicit setup-required 503 problem JSON                                         | New integration test + source diff                  | PASS             |

## Verification evidence

- ✅ `pnpm --filter @settler/web lint`
- ✅ `pnpm --filter @settler/web typecheck`
- ✅ `pnpm --filter @settler/web test -- stripe-config-gating.test.ts`
- ✅ `pnpm --filter @settler/api test -- enterprise-setup-gating.test.ts`

## Residual external blockers

- End-to-end live billing still requires valid Stripe keys, product/price IDs, and webhook secret.
- Enterprise backend capability implementation is intentionally gated and still pending.

## Launch-readiness verdict

- **MOSTLY READY WITH EXTERNAL CONFIG ONLY** for billing + ops integration visibility.
- **NOT READY** for enterprise API feature completeness (now explicitly and safely gated).
