# Settler Canonical Capability Registry

Last updated: 2026-03-12

This registry is the launch-readiness canonical map across kernel, API, CLI, Console, docs, and enterprise tier relevance.

## Capability matrix

| Capability                                       | Kernel operation                                   | API endpoint family                                                             | CLI command surface                                                  | Console surface                                                                  | Docs reference                                                                | Enterprise relevance                   |
| ------------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------- |
| Reconciliation execution                         | Deterministic compute + reconciliation runtime     | `/api/v1/runs`, `/api/runs/create`                                              | `pnpm demo:settler`, `pnpm simulate:settler`                         | `/app/runs`, `/app/reconciliation`                                               | `docs/reference/surface-area-convergence.md`                                  | Core in all tiers                      |
| Run explorer                                     | Run indexing + run evidence links                  | `/api/v1/runs/:id`, `/api/admin/runs`                                           | `pnpm replay:run`                                                    | `/app/runs`, `/app/runs/[id]`, `/admin/runs`                                     | `docs/reference/surface-area-convergence.md`                                  | High (operator workflows)              |
| Truth explorer / proof explorer                  | Evidence hashing + lineage graph primitives        | `/api/v1/runs/:id/trust-explorer/*`, `/api/v1/runs/[id]/evidence`               | `pnpm replay:run`, `proof show`, `proof verify`                      | `/app/proofs`, `/console/proof-explorer`                                         | `docs/architecture/proof-explorer.md`, `docs/enterprise-capability-matrix.md` | Critical (auditability/compliance)     |
| Deterministic replay                             | `canonicalize_hash`, proof/evidence replay compare | `/api/v1/runs/:id/replay`, `/api/explorer/execution/[id]`                       | `pnpm replay:run`, `history verify-execution`, `jobs replay`         | `/replay-lab`, `/console/replay-lab`                                             | `docs/replay/README.md`, `docs/enterprise-capability-matrix.md`               | Critical (incident response + trust)   |
| Policy simulation and governance                 | Policy simulation + policy validation hooks        | `/api/control-plane/policies`, `/api/control-plane/triggers`                    | `policy simulate`, `policy validate`, `pnpm simulate:settler`        | `/app/policies`, `/console/policies`, `/console/control-plane`                   | `docs/enterprise-capability-matrix.md`                                        | Critical (governance)                  |
| Synthetic reconciliation foundry                 | Seeded deterministic generation/verify flow        | CLI-first workload                                                              | `pnpm generate:test-data:smoke`, `pnpm verify:test-data`             | Docs/demo surfaced                                                               | `test-data/TEST_DATA_FOUNDRY.md`                                              | Medium (demo + validation)             |
| Bulk audit automation                            | Kernel-backed verification jobs                    | `/api/jobs/bulk`, `/api/jobs`                                                   | `jobs create`, `jobs run`, `jobs list`                               | `/console/bulk-operations`, `/console/workflows`, `/console/audits`              | `docs/enterprise-feature-differentiation.md`                                  | Critical (enterprise scale)            |
| Cross-ledger reconciliation / variance detection | Reconciliation + diff primitives                   | `/api/console/reconciliation`, `/api/console/analytics/rollup`                  | `verify`, `history diff`, `foundry reconciliation-verify`            | `/console/reconciliations`, `/console/multi-source-reconciliation`               | `docs/enterprise-capability-matrix.md`                                        | Critical (finance controls)            |
| Compliance evidence export                       | Proof bundle hashing + export integrity            | `/api/exports`, `/api/data/export`, `/api/v1/runs/[id]/evidence`                | `export`, `verify-export`, `history export-ledger`                   | `/console/audits`, `/console/receipts`, `/console/receipts-hash`                 | `docs/enterprise-capability-matrix.md`                                        | Critical (audit/compliance)            |
| Operational monitoring                           | Kernel telemetry + health checks                   | `/api/metrics`, `/api/ops/system-health`, `/api/console/metrics`, `/api/status` | `pnpm doctor`, `pnpm suite-doctor:json`, `console health`            | `/console`, `/console/performance`, `/console/diagnostics`, `/app/system-health` | `docs/operational-safety-audit.md`, `docs/enterprise-console-surface-map.md`  | Critical (operations)                  |
| AI anomaly detection                             | AI insight services (outside kernel critical path) | `/api/ai/data-insights`, `/api/console/insights`                                | `foundry faults run` (operator path)                                 | `/console/insights`, `/console/ai-analysis`                                      | `docs/enterprise-feature-differentiation.md`                                  | Strategic (enterprise differentiation) |
| Tenant governance and isolation                  | Tenant-scoped authz checks                         | `/api/rbac/*`, `/api/console/tenants`, tenant-scoped `/api/*`                   | `pnpm tenant:create`, `pnpm verify:tenant`, `pnpm test:cross-tenant` | `/console/organizations`, `/console/admin/tenants`, `/app/settings`              | `docs/ACCESS_CONTROLS.md`, `docs/OSS_VS_ENTERPRISE.md`                        | Critical (multi-tenant safety)         |

## Surface-alignment findings

### Capabilities in code with weak or partial user surfacing

- Policy simulation remains partially surfaced in app UX (embedded context exists; standalone policy lab remains incomplete).
- AI anomaly detection CLI path is operator/foundry-centric and not yet a mainstream CLI command family.

### User-facing claims that require precise wording

- AI anomaly detection should be described as implemented through `/api/ai/data-insights` and console insight surfaces, not as universal automated decisioning.
- “Kernel primary” claims must be conditioned on runtime flags and binary availability.

## Canonical source inputs

- `docs/reference/capability-surface.registry.json`
- `docs/reference/surface-area-convergence.md`
- `docs/enterprise-capability-matrix.md`
- `docs/enterprise-feature-differentiation.md`
- `docs/enterprise-console-surface-map.md`
