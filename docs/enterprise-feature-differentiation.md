# Enterprise Feature Differentiation

Defines premium services and where they are surfaced for enterprise adoption.

## Premium Services and Surfaces

| Premium Service                    | Console Surface                                                     | API Surface                                                | Documentation Surface                    |
| ---------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------- |
| AI anomaly detection               | `/console/insights`, `/console/ai-analysis`                         | `/api/ai/data-insights`, `/api/console/insights`           | `docs/enterprise-capability-matrix.md`   |
| Bulk audit automation              | `/console/bulk-operations`, `/console/workflows`, `/console/audits` | `/api/jobs/bulk`, `/api/jobs`                              | `docs/enterprise-console-surface-map.md` |
| Ledger risk scoring                | `/console/analytics`, `/console/insights`                           | `/api/console/analytics/rollup`, `/api/ai/data-insights`   | `docs/enterprise-capability-matrix.md`   |
| Automated reconciliation pipelines | `/console/reconciliations`, `/console/workflows`                    | `/api/runs/create`, `/api/console/operator/runs`           | `docs/enterprise-console-surface-map.md` |
| Compliance evidence export         | `/console/audits`, `/console/proof-explorer`, `/console/receipts`   | `/api/exports`, `/api/v1/runs/[id]/evidence`               | `docs/enterprise-capability-matrix.md`   |
| Historical replay lab              | `/console/replay-lab`, `/console/replay`                            | `/api/v1/runs/[id]/replay`, `/api/explorer/execution/[id]` | `docs/enterprise-console-surface-map.md` |

## Governance and Admin Coverage

Enterprise admin/governance surfaces:

- Organization management: `/console/organizations`
- Team roles + access policy operations: `/console/organizations`, `/console/policies`
- Audit logs: `/console/audit-trail`, `/console/activity`
- API key management: `/console/api-keys`
- Tenant isolation and observability: `/console/admin/tenants`

## Productization Outcome

- Console is now the primary operational interface for enterprise users.
- CLI remains available for power users, operators, and local engineering loops.
- Premium features are discoverable through explicit Console navigation rather than hidden CLI workflows.
