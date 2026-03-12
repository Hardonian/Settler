# Enterprise Capability Matrix

This registry maps discovered capabilities across kernel, CLI, APIs, and Console surfaces so enterprise users can operate Settler without CLI dependency.

## Capability Registry

| Capability                           | Source                            | CLI Command                                               | API Endpoint                                                     | Console Surface                                                                | Enterprise Feature                 |
| ------------------------------------ | --------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------- |
| Deterministic replay                 | Kernel + history tools            | `history verify-execution`, `history diff`, `jobs replay` | `/api/v1/runs/[id]/replay`, `/api/explorer/execution/[id]`       | `/console/replay`, `/console/replay-lab`                                       | Historical replay lab              |
| Proof bundle hashing                 | Verify/proof pipeline             | `proof show`, `proof verify`, `export verify-export`      | `/api/v1/runs/[id]/evidence`, `/api/console/receipts-v2`         | `/console/proof-explorer`, `/console/receipts-hash`                            | Compliance evidence export         |
| Reconciliation variance detection    | Reconciliation engine + analytics | `verify`, `history diff`, `foundry reconciliation-verify` | `/api/console/reconciliation`, `/api/console/analytics/rollup`   | `/console/reconciliations`, `/console/multi-source-reconciliation`             | Cross-ledger variance detection    |
| Ledger verification                  | Verify subsystem                  | `verify`                                                  | `/api/v1/runs/[id]/results`, `/api/v1/ready`                     | `/verify`, `/console/audits`                                                   | Bulk verification scans            |
| Audit bundle export                  | Export portability contract       | `export`, `verify-export`, `history export-ledger`        | `/api/exports`, `/api/data/export`                               | `/console/audits`, `/exports`                                                  | Audit bundle download center       |
| Kernel telemetry                     | Metrics + ops APIs                | `console health`, `debug trace`                           | `/api/metrics`, `/api/ops/system-health`, `/api/console/metrics` | `/console/performance`, `/console/diagnostics`, `/console`                     | Kernel health monitoring           |
| Policy simulation and enforcement    | Policy engine                     | `policy simulate`, `policy validate`                      | `/api/control-plane/policies`, `/api/control-plane/triggers`     | `/console/policies`, `/console/control-plane`, `/console/feature-flags-policy` | Policy enforcement dashboards      |
| Trace replay viewer                  | Explorer execution graph          | `history show`, `history verify-execution`                | `/api/explorer/history`, `/api/explorer/execution/[id]`          | `/console/replay-lab`, `/explorer`                                             | Trace replay viewer                |
| Divergence detection                 | History + run comparison          | `history diff`, `jobs replay`                             | `/api/v1/metrics/timeseries`, `/api/console/analytics/pivot`     | `/console/reconciliations`, `/console/analytics`                               | Drift and divergence analytics     |
| Verification reports                 | Verify + receipts contract        | `verify`, `reports get`                                   | `/api/v1/runs/[id]/results`, `/api/console/receipts`             | `/console/proof-explorer`, `/console/receipts`                                 | Verification report center         |
| AI anomaly detection                 | AI services                       | `foundry faults run` (operator path)                      | `/api/ai/data-insights`, `/api/console/insights`                 | `/console/insights`, `/console/ai-analysis`                                    | AI anomaly detection               |
| Bulk audit automation                | Jobs and bulk endpoints           | `jobs create`, `jobs run`, `jobs list`                    | `/api/jobs/bulk`, `/api/jobs`                                    | `/console/bulk-operations`, `/console/workflows`                               | Bulk audit automation              |
| Ledger risk scoring                  | AI + metrics rollups              | (indirect via reports/analytics)                          | `/api/ai/data-insights`, `/api/console/analytics/rollup`         | `/console/insights`, `/console/analytics`                                      | Ledger risk scoring                |
| Automated reconciliation pipelines   | Jobs/workflows                    | `jobs run`, `jobs logs`, `jobs replay`                    | `/api/runs/create`, `/api/console/operator/runs`                 | `/console/workflows`, `/console/reconciliations`                               | Automated reconciliation pipelines |
| Multi-tenant organization governance | RBAC + tenancy                    | `console api-keys`, `admin *` (ops path)                  | `/api/rbac/roles`, `/api/rbac/users`, `/api/console/tenants`     | `/console/organizations`, `/console/admin/tenants`                             | Org and tenant governance          |
| Access policy management             | Policy + allowlisting             | (policy CLI + ops scripts)                                | `/api/enterprise/ip-allowlist`, `/api/control-plane/keys`        | `/console/policies`, `/console/settings`                                       | Access policy governance           |
| Audit log operations                 | Failure/admin stream              | `failures summary`, `failures inspect`                    | `/api/admin/audit`, `/api/console/activities`                    | `/console/audit-trail`, `/console/activity`                                    | Enterprise audit logs              |

## CLI vs API vs Console Parity Matrix

| Feature                     | CLI                     | API | Console | Docs | Enterprise | Classification             |
| --------------------------- | ----------------------- | --- | ------- | ---- | ---------- | -------------------------- |
| Deterministic replay        | ✅                      | ✅  | ✅      | ✅   | ✅         | FULLY_SURFACED             |
| Proof bundle verification   | ✅                      | ✅  | ✅      | ✅   | ✅         | FULLY_SURFACED             |
| Variance detection          | ✅                      | ✅  | ✅      | ✅   | ✅         | FULLY_SURFACED             |
| Audit bundle export         | ✅                      | ✅  | ✅      | ✅   | ✅         | FULLY_SURFACED             |
| Policy simulation           | ✅                      | ✅  | ✅      | ✅   | ✅         | FULLY_SURFACED             |
| Kernel telemetry dashboards | ⚠️ (indirect)           | ✅  | ✅      | ✅   | ✅         | API_ONLY (CLI not primary) |
| RBAC / org governance       | ⚠️ (ops/admin path)     | ✅  | ✅      | ✅   | ✅         | API_ONLY                   |
| Bulk verification scans     | ⚠️ (script/verify path) | ✅  | ✅      | ✅   | ✅         | API_ONLY                   |
| AI anomaly detection        | ⚠️ (foundry/operator)   | ✅  | ✅      | ✅   | ✅         | API_ONLY                   |
| Compliance evidence exports | ✅                      | ✅  | ✅      | ✅   | ✅         | FULLY_SURFACED             |

## Gap Statement

No enterprise user-facing capability remains CLI-only after this surface pass. Remaining API_ONLY rows are intentional platform-first surfaces where CLI is operator-focused.
