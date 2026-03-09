# Reality Audit (Launch Pass)

## Scope audited

- Billing runtime surfaces: `/api/stripe/checkout`, `/api/stripe/portal`, `/console/billing`, pricing upgrade CTA.
- Stripe integration path in `stripeService`.

## Root causes found

1. Stripe service returned demo customer/session IDs when Stripe secrets were absent.
2. Billing APIs converted operational failures into HTTP 200 fallback payloads, making setup gaps look like successful operations.
3. Billing UI handlers ignored structured error payloads on non-2xx and surfaced generic failures.

## Remediations applied

- Removed demo-mode Stripe session/customer generation from production runtime path.
- Added explicit `StripeConfigurationError` and setup-required API responses (`503`) for absent Stripe configuration.
- Updated billing and pricing client flows to read API error payloads and surface truthful setup-required messages.

## Integration capability behavior (post-fix)

- Stripe configured: checkout/portal paths execute real Stripe operations.
- Stripe missing: APIs return `setupRequired: true` with actionable next steps; no fake checkout or portal URLs are generated.

## Verification evidence

- `pnpm --filter @settler/web lint` (pass with one pre-existing warning in unrelated file).
- `pnpm --filter @settler/web typecheck` (pass).

## Residual external blockers

- End-to-end billing flow still requires valid Stripe secret + price IDs + webhook setup.

## Launch-readiness verdict (this scope)

- **MOSTLY READY WITH EXTERNAL CONFIG ONLY** for billing runtime path.
