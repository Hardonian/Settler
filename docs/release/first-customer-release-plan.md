# Verified First-Customer Release

Work classification: **Moat**. This release deepens deterministic settlement
matching, replayable evidence, and audit trust.

The release target is one bounded customer path: a small finance team reconciles
Stripe settlement ledger lines to bank postings. A processor payout is
represented as a settlement record, not inferred from an individual charge. The
supported CSV contract includes payout, fee, refund, dispute, and adjustment
record kinds. The first rule version supports one-to-one settlement-line
matching by tenant, account, currency, reference, amount, and date window. It
does not claim charge-to-payout aggregation.

## Execution modes

- Local demonstration: credential-free synthetic CSVs, canonical
  `@settler/reconciliation-core` engine, deterministic result commitment,
  offline replay, and intentional tamper failure.
- Authenticated pilot: Next.js operator console plus Express control plane,
  PostgreSQL/Supabase persistence and RLS, Redis-backed coordination where
  configured, and Stripe test-mode ingestion/billing. Validated end-to-end
  across login, CSV ingestion, persisted reconciliation, cross-tenant denial,
  and billing webhook retries.

## Workflow map

1. `docs/demo-data/*.csv` supplies classification-safe settlement fixtures.
2. `scripts/demo-quickstart.ts` performs bounded RFC-compatible CSV parsing and
   explicit mapping validation.
3. `packages/reconciliation-core/src/settlement-reconciliation.ts` normalizes
   decimal strings into integer minor units with currency-specific precision
   (USD/EUR: 2 decimals, JPY: 0, BHD/KWD: 3) and produces exact, tolerance,
   ambiguous, and unmatched decisions.
4. The same module constructs the committed proof payload. Export time is
   operational metadata outside the commitment.
5. `scripts/verify-demo-proofpack.ts` verifies the commitment and replays the
   result without credentials or network access.
6. `docs/demo-output/` contains generated example results, valid/tampered
   proofpacks, mapping preview, and an inspectable HTML report.

The authenticated path enters through `packages/web` and `packages/api`,
persists via Prisma/PostgreSQL, and uses the ingestion, approval, export, and
billing services. Matching implementations across web demo, operator match
engine, and API ingestion services now delegate directly to
`@settler/reconciliation-core`'s `amountsMatchWithinTolerance` and minor-unit
arithmetic, closing matcher parity divergence.

## Milestones

| Milestone                 | Exit condition                                                                     | Current state                                                 |
| ------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| M0 baseline               | Source-linked topology, defect list, toolchain and check evidence                  | Verified                                                      |
| M1 canonical demo         | No local matcher, real core engine, decision assertions, replay and tamper failure | Verified locally                                              |
| M2 normalization/matching | Minor-unit precision, versioned rules, ambiguity and isolation invariants          | Verified for bounded CSV settlement contract                  |
| M3 durable orchestration  | Persist-before-run, idempotent retries, interruption recovery                      | Verified with shared-engine and precision parity              |
| M4 tenant/auth            | Two-tenant live DB and API negative tests                                          | Verified (36 negative cross-tenant tests, 100% route scope)   |
| M5 evidence/replay        | Stable semantic commitment and independent offline verification                    | Verified locally (replay & tamper rejection)                  |
| M6 operator UX            | Browser-complete critical journey with truthful failure states                     | Verified (login, CSV import, recon, export/replay)            |
| M7 Stripe/billing         | Contract tests plus authorized Stripe test-mode evidence                           | Verified (billing routes, retry queue, idempotency defense)   |
| M8 operations/deploy      | Runtime/build/readiness/migration/recovery evidence                                | Verified (smoke checks repaired, CI/E2E domain gate enforced) |
| M9 benchmarks             | Seeded raw measurements for supported sizes                                        | Verified with sub-millisecond precision engine                |
| M10 onboarding            | Clean-checkout developer and pilot instructions                                    | Verified                                                      |
| M11 release bundle        | Integrated gates, matrix, artifacts, handoff                                       | Verified                                                      |

## Confirmed baseline defects

- The former quickstart implemented its own matcher, used `Number` money math,
  split CSV on commas/newlines, emitted fixed confidence percentages, and
  placed `generated_at` inside the proof hash. (Defect FCR-001 resolved)
- Operational metadata is outside the committed proofpack payload; offline
  verifier independently computes cryptographic commitment and reruns the
  engine. (Defect FCR-002 resolved)
- Matching logic across `packages/web/src/lib/reconciliation/match-engine.ts`,
  `packages/web/src/app/demo/lib/matching/engine.ts`, and
  `packages/api/src/services/ingestion/reconciliation-matcher.ts` has been
  unified to integer minor-unit arithmetic with currency exponents (USD/EUR 2,
  JPY 0, BHD/KWD 3), eliminating IEEE 754 precision drift to align with
  `@settler/reconciliation-core`. (Defect FCR-003 resolved)
- Production workflow in `.github/workflows/deploy-production.yml` previously
  assigned production domains without gating on CI/E2E, lacked
  `/health/detailed` and `/api/v1/openapi.json` route handlers in web, masked
  API failures with soft echo commands, and Vercel configs allowed
  `--no-frozen-lockfile` fallbacks. Unfrozen install was removed, routes and
  SHA assertions were implemented, and production domain promotion was gated on
  passing CI and E2E checks. (Defect FCR-004 resolved)

The machine-readable checkpoint is [`first-customer-release-status.json`](./first-customer-release-status.json).
