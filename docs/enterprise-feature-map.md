# Enterprise Feature Map

Last updated: 2026-03-12

This map defines how enterprise value is surfaced across console, API, and documentation.

## Differentiated enterprise capabilities

| Capability                                  | Console surfaces                                                               | API surfaces                                                     | Docs                                                            |
| ------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------- | --------------------------------------------------------------- |
| Bulk audit automation                       | `/console/bulk-operations`, `/console/workflows`, `/console/audits`            | `/api/jobs/bulk`, `/api/jobs`                                    | `docs/enterprise-feature-differentiation.md`                    |
| Policy governance                           | `/console/policies`, `/console/control-plane`, `/console/feature-flags-policy` | `/api/control-plane/policies`, `/api/control-plane/triggers`     | `docs/enterprise-capability-matrix.md`                          |
| Deterministic replay                        | `/console/replay`, `/console/replay-lab`                                       | `/api/v1/runs/[id]/replay`, `/api/explorer/execution/[id]`       | `docs/replay/README.md`, `docs/enterprise-capability-matrix.md` |
| Proof explorer                              | `/console/proof-explorer`, `/console/receipts-hash`                            | `/api/v1/runs/[id]/evidence`, `/api/console/receipts-v2`         | `docs/architecture/proof-explorer.md`                           |
| Cross-ledger reconciliation                 | `/console/reconciliations`, `/console/multi-source-reconciliation`             | `/api/console/reconciliation`, `/api/console/analytics/rollup`   | `docs/enterprise-capability-matrix.md`                          |
| Compliance evidence export                  | `/console/audits`, `/console/receipts`, `/exports`                             | `/api/exports`, `/api/data/export`                               | `docs/enterprise-capability-matrix.md`                          |
| Operational monitoring                      | `/console`, `/console/performance`, `/console/diagnostics`, `/console/ops`     | `/api/console/metrics`, `/api/ops/system-health`, `/api/metrics` | `docs/enterprise-console-surface-map.md`                        |
| AI anomaly detection (implemented surfaces) | `/console/insights`, `/console/ai-analysis`                                    | `/api/ai/data-insights`, `/api/console/insights`                 | `docs/enterprise-feature-differentiation.md`                    |

## Coverage status

- Required enterprise capabilities are present in console + API + docs surfaces.
- Remaining CLI gaps are deliberate for some enterprise-first features (operator scripts/foundry paths retained).
- No enterprise feature is documented as generally available without at least one implemented API and console surface.

## Positioning guardrails

- Present AI as insights/anomaly surfacing, not autonomous adjudication.
- Present replay/proof claims as evidence-backed and deterministic only when evidence is available.
- Keep governance claims coupled to tenant and role controls.
