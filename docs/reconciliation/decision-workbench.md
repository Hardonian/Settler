# Reconciliation Decision Workbench (v1)

This document describes the first operator trust-layer contracts exposed by `/api/v1/reconciliation`.

## Endpoints

- `GET /api/v1/reconciliation/runs/:runId/workbench`
  - Returns queue-oriented review items (`manual_review`, `unmatched`, `grouped`, `variance`, `status_conflict`, `matched`).
  - Each item includes an `explanation` object grounded in runtime match fields.
- `GET /api/v1/reconciliation/runs/:runId/compare/:otherRunId`
  - Returns summary counts and per-item changes for classification, group membership, variance, and queue movement.
- `GET /api/v1/reconciliation/runs/:runId/workbench/export`
  - Returns a JSON export with `schemaVersion: reconciliation-workbench.v1` for audit and downstream consumption.
- `PATCH /api/v1/reconciliation/matches/:matchId`
  - Supports `reviewState` updates (`pending_review | reviewed | approved | dismissed | escalated`) and persists state under `metadata.review_state`.

## Decision Explanation Contract

`DecisionExplanation` includes:

- classification and rationale codes
- matched source/target record IDs
- grouped evidence (group id and deterministic member IDs)
- evidence fields used in runtime matching
- amount/date comparisons, variance and tolerance outcomes
- tolerance policy values from run metadata config
- policy path stages
- unresolved ambiguity markers
- dispute/reversal relevance markers
- manual review requirement + reason codes

## Notes

- Contracts are additive and tenant-scoped by existing route SQL filters.
- Explanations are generated from runtime `reconciliation_matches` fields and per-run config metadata.
