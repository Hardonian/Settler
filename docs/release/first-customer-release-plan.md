# Verified First-Customer Release

Work classification: **Moat**. This release deepens deterministic settlement matching, replayable evidence, and audit trust.

The release target is one bounded customer path: a small finance team reconciles Stripe settlement ledger lines to bank postings. A processor payout is represented as a settlement record, not inferred from an individual charge. The supported CSV contract includes payout, fee, refund, dispute, and adjustment record kinds. The first rule version supports one-to-one settlement-line matching by tenant, account, currency, reference, amount, and date window. It does not claim charge-to-payout aggregation.

## Execution modes

- Local demonstration: credential-free synthetic CSVs, canonical `@settler/reconciliation-core` engine, deterministic result commitment, offline replay, and intentional tamper failure.
- Authenticated pilot: Next.js operator console plus Express control plane, PostgreSQL/Supabase persistence and RLS, Redis-backed coordination where configured, and Stripe test-mode ingestion/billing. This mode is not verified until database-backed, browser, and Stripe test-mode evidence is captured.

## Workflow map

1. `docs/demo-data/*.csv` supplies classification-safe settlement fixtures.
2. `scripts/demo-quickstart.ts` performs bounded RFC-compatible CSV parsing and explicit mapping validation.
3. `packages/reconciliation-core/src/settlement-reconciliation.ts` normalizes decimal strings into integer minor units and produces exact, tolerance, ambiguous, and unmatched decisions.
4. The same module constructs the committed proof payload. Export time is operational metadata outside the commitment.
5. `scripts/verify-demo-proofpack.ts` verifies the commitment and replays the result without credentials or network access.
6. `docs/demo-output/` contains generated example results, valid/tampered proofpacks, mapping preview, and an inspectable HTML report.

The authenticated path currently enters through `packages/web` and `packages/api`, persists via Prisma/PostgreSQL, and uses the ingestion, approval, export, and billing services already present. Baseline inspection found separate legacy matching implementations in the web demo and API ingestion service. They are not treated as proof that the authenticated pilot uses the new settlement rule version until consolidation and integration tests are complete.

## Milestones

| Milestone | Exit condition | Current state |
| --- | --- | --- |
| M0 baseline | Source-linked topology, defect list, toolchain and check evidence | In progress |
| M1 canonical demo | No local matcher, real core engine, decision assertions, replay and tamper failure | Verified locally |
| M2 normalization/matching | Minor-unit precision, versioned rules, ambiguity and isolation invariants | Verified for bounded CSV settlement contract |
| M3 durable orchestration | Persist-before-run, idempotent retries, interruption recovery | Not started |
| M4 tenant/auth | Two-tenant live DB and API negative tests | Not started |
| M5 evidence/replay | Stable semantic commitment and independent offline verification | Verified locally |
| M6 operator UX | Browser-complete critical journey with truthful failure states | Not started |
| M7 Stripe/billing | Contract tests plus authorized Stripe test-mode evidence | Not started |
| M8 operations/deploy | Runtime/build/readiness/migration/recovery evidence | Not started |
| M9 benchmarks | Seeded raw measurements for supported sizes | Not started |
| M10 onboarding | Clean-checkout developer and pilot instructions | In progress |
| M11 release bundle | Integrated gates, matrix, artifacts, handoff | Not started |

## Confirmed baseline defects

- The former quickstart implemented its own matcher, used `Number` money math, split CSV on commas/newlines, emitted fixed confidence percentages, and placed `generated_at` inside the proof hash.
- Matching logic across `packages/web/src/lib/reconciliation/match-engine.ts`, `packages/web/src/app/demo/lib/matching/engine.ts`, and `packages/api/src/services/ingestion/reconciliation-matcher.ts` has been unified to integer minor-unit (cents) precision, eliminating floating point drift to align with `@settler/reconciliation-core` (Defect FCR-003 resolved).
- The former fixture language could be read as reconciling card charges directly to payouts. The revised fixture explicitly models processor settlement lines.
- Existing pilot documentation states unmeasured accuracy, availability, and time-saved targets; those are hypotheses, not release evidence.
- Hosted authentication, RLS behavior, Stripe test-mode access, and Vercel execution have not yet been exercised for this branch.

The machine-readable checkpoint is [`first-customer-release-status.json`](./first-customer-release-status.json).
