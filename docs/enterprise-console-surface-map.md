# Enterprise Console Surface Map

This map defines the Console operational surface expected for enterprise users.

## Navigation Contract

The Console now includes a first-class enterprise navigation layer:

- Dashboard
- Reconciliations
- Audits
- Proof Explorer
- Replay Lab
- Policies
- Organizations
- API Keys
- Settings

## Surface-to-Capability Mapping

| Console Route              | Primary Capability                               | Backing APIs                                                   | Notes                          |
| -------------------------- | ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------ |
| `/console`                 | Verification status + telemetry summary          | `/api/console/metrics`, `/api/console/usage`                   | Enterprise entry dashboard     |
| `/console/reconciliations` | Bulk reconciliation audits, variance workflows   | `/api/console/reconciliation`, `/api/console/analytics/rollup` | New enterprise index page      |
| `/console/audits`          | Bulk verification and compliance artifact review | `/api/console/receipts`, `/api/exports`                        | New audit center page          |
| `/console/proof-explorer`  | Evidence/proof browser                           | `/api/v1/runs/[id]/evidence`, `/api/console/receipts-v2`       | New proof explorer index       |
| `/console/replay-lab`      | Deterministic replay and trace viewer            | `/api/v1/runs/[id]/replay`, `/api/explorer/execution/[id]`     | New replay lab page            |
| `/console/policies`        | Policy enforcement dashboards                    | `/api/control-plane/policies`, `/api/control-plane/triggers`   | New policy hub                 |
| `/console/organizations`   | Org management and tenant governance             | `/api/rbac/roles`, `/api/rbac/users`, `/api/console/tenants`   | New organization hub           |
| `/console/api-keys`        | API key lifecycle                                | `/api/console/api-keys`                                        | Existing page, promoted in nav |
| `/console/settings`        | Runtime config and operational settings          | `/api/console/site/ui-config`, `/api/control-plane/keys`       | New settings hub               |

## Enterprise Dashboards

Operational dashboards surfaced through console routes:

- Verification status: `/console` + `/console/audits`
- Ledger drift/variance: `/console/reconciliations` + `/console/analytics`
- Kernel execution telemetry: `/console/performance` + `/console/diagnostics`
- Audit pass/fail rates: `/console/proof-explorer` + `/console/receipts-hash`

## Residual Risk

- Some advanced operator workflows remain API/script-centric for internal teams.
- We intentionally preserve CLI as a power-user interface while steering enterprise operators to Console-first flows.
