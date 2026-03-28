# Console (Phase 1)

Settler ships an authenticated `/app` shell with tenant-aware navigation:

- Overview
- Runs
- Evidence
- Policies
- Metrics
- Settings

The shell degrades safely when auth or required env variables are missing (no hard-500).

## Canonical run detail

Console run detail for merged runs is loaded from **GET `/api/runs/[id]`**, which returns the `OperatorRunDetail` DTO from `@settler/reconciliation-core` (`resolveOperatorRunDetailForTenants`). Compatibility-only v1 routes remain separate; do not treat them as the operator truth surface for full run detail.
