# Reconciliation Guide

Settler reconciliation surfaces are designed to make mismatch triage explainable and auditable.

## Core entities

- **Run** — the tenant-scoped execution lifecycle (`pending` → `running` → terminal) for a reconciliation job.
- **Run Result** — the persisted outcome snapshot attached to a run, including canonical counters, row-level rationale, and provenance.
- **Exception** — an operator workflow item derived from unresolved or escalated reconciliation outcomes.
- **ProofReceipt** — evidence artifact linking a decision to inputs, rules, and timestamps.
- **PolicyRule** — deterministic matching, tolerance, and validation logic.
- **AuditEvent** — append-only operator or system action trace.
- **SystemHealth** — runtime readiness signals for the operator shell.

## Canonical operator semantics

Settler’s operator-facing reconciliation pages now use one shared summary model:

- `matched` and `matchedWithTolerance` represent successful row-level decisions.
- `unmatched` is the combined count of unresolved source-side and target-side gaps.
- `exceptioned` represents rows promoted into the exception workflow.
- `unresolved` represents work that still requires operator review.
- Run detail, run list, reconciliation detail, and exception list all derive these values from the same canonical contract in `packages/web/src/lib/reconciliation/canonical-run-result.ts`.

## UI surfaces

- Public: `/reconciliation`
- Operator console: `/console/runs`, `/console/reconciliations`, `/console/exceptions`
- Control plane: `/app/reconciliation` and `/app/reconciliation/[id]`

## Validation

```bash
pnpm run verify:contracts
pnpm run test
```
