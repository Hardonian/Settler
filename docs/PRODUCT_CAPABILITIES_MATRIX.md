# Settler Product Capabilities Matrix (Evidence-Backed)

This matrix tracks what is currently implemented in-repo and how each capability maps to operator-facing value.

| Capability                       | Product/API Surface                                                                                            | Problem Solved                                                                                | Differentiation Signal                                                             | Maturity                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Deterministic replay             | UI: `/app/replay`, API: `/api/v1/runs/:id/replay`                                                              | Re-run historical reconciliations and detect drift with explicit match status.                | Replayability + deterministic verification for financial runs.                     | Mature                                                                     |
| Run explorer                     | UI: `/app/runs`, `/app/runs/:id`, API: `/api/v1/runs`, `/api/v1/runs/:id`                                      | Gives operators execution metadata, policy context, and run-level troubleshooting entrypoint. | Operator-grade execution introspection instead of opaque batch jobs.               | Mature                                                                     |
| Truth / lineage explorer         | UI: `/app/proofs` and `ProofExplorer`, API: trust-explorer endpoints under `/api/v1/runs/:id/trust-explorer/*` | Trace artifacts and execution graph for audit/debug workflows.                                | Explicit lineage + proof-chain navigation.                                         | Mature                                                                     |
| Evidence query surface           | UI: `/app/evidence`, API: `/api/v1/runs/:id/evidence`                                                          | Retrieve trust artifacts using run id, fingerprint, and policy hash selectors.                | Structured evidence retrieval for audits and replay validation.                    | Mature                                                                     |
| Tenant isolation controls        | UI: `/app/settings`, supporting artifacts in `security/evidence/*`                                             | Preserve multi-tenant boundaries via governance controls and explicit verification artifacts. | Isolation controls are visible to operators, not hidden behind internal-only docs. | Mature                                                                     |
| Policy impact simulation         | UI: Truth Explorer policy impact panel, API: `/trust-explorer/findPolicyImpact`                                | Evaluate which artifacts/execution nodes are impacted by policy decisions.                    | Policy-aware investigation, not just static policy docs.                           | Partial (embedded in Truth Explorer, not yet standalone simulator)         |
| Live operations + alerts         | UI: `/app/alerts`, `/app/system-health`                                                                        | Fast incident triage and operator context during runtime events.                              | Control-plane visibility for financial operations.                                 | Partial (surface is visible; deep alert-to-run automation remains limited) |
| Runtime event model visibility   | UI: `/app/metrics`, API: `/api/v1/metrics/*`, docs: `docs/packages/api/EVENT_DRIVEN_ARCHITECTURE.md`           | Make event-derived execution behavior machine-visible for operators and developers.           | Infrastructure-style event semantics with live telemetry hooks.                    | Partial (currently focused on route latency/top signals)                   |
| Synthetic reconciliation foundry | CLI: `foundry reconciliation-verify`, docs: `docs/demos/FOUNDRY_DEMO.md`                                       | Generate deterministic test scenarios for reconciliation verification.                        | Scenario-driven validation with reproducible seeds.                                | Mature                                                                     |

## Operator Demo Flow (Reality-Backed)

1. Open **Control Plane** at `/app`.
2. Inspect a recent run in **Run Explorer** (`/app/runs/:id`).
3. Open **Truth Explorer** (`/app/proofs`) for lineage + proof chain checks.
4. Pull trust artifacts from **Evidence Query Surface** (`/app/evidence`).
5. Inspect **Live Alerts** (`/app/alerts`) for incident context.
6. Replay the run in **Replay Lab** (`/app/replay`) and compare hash outcomes.
7. Review tenant boundary controls in **Tenant Isolation Controls** (`/app/settings`).
8. Inspect **Runtime Event Signals** (`/app/metrics`) for event-derived telemetry.

This sequence is intentionally constrained to implemented routes/endpoints in this repository.
