# Premium Surface Reality Report

Date: 2026-04-08

## Scope

Validated discoverability + route viability for premium/enterprise claims:

- bulk audit/operations
- proof/replay/traceability
- governance/policy
- reporting/export
- enterprise admin/org/team
- trust/security
- managed service/support

## Findings

| Capability                                                          | Discoverable                 | Actionable route exists | Data-backed evidence                                        | Docs linked              | Reality status                   |
| ------------------------------------------------------------------- | ---------------------------- | ----------------------- | ----------------------------------------------------------- | ------------------------ | -------------------------------- |
| Bulk operations (`/console/bulk-operations`)                        | Yes (console enterprise nav) | Yes (route built)       | Partial (API/runtime not fully exercised in env)            | Partial                  | **Present, partially proven**    |
| Audits (`/console/audits`, `/app/audit`)                            | Yes                          | Yes                     | Tenant-isolation/audit tests in API pass                    | Yes                      | **Operationally credible**       |
| Proof explorer (`/proof-explorer`, `/app/proofs`)                   | Yes                          | Yes                     | Replay/proof related tests pass                             | Yes (`/docs/replay-lab`) | **Operationally credible**       |
| Replay lab (`/console/replay`, `/replay-lab`)                       | Yes                          | Yes                     | Replay test coverage exists                                 | Yes                      | **Operationally credible**       |
| Governance/policies (`/console/policies`, `/app/policies`)          | Yes                          | Yes                     | API/policy routes build + contracts compile                 | Partial                  | **Present, contract-proven**     |
| Reporting/export (`/console/usage/export`)                          | Yes                          | Yes                     | Usage/export routes built; middleware tests pass            | Partial                  | **Present, backend E2E pending** |
| Admin org/team (`/console/organizations`, `/console/admin/tenants`) | Yes                          | Yes                     | Role-aware rendering in console layout + user-role API      | Partial                  | **Present, role-dependent**      |
| Trust/security/governance pages                                     | Yes                          | Yes                     | Static + tested support contracts                           | Yes                      | **Present and coherent**         |
| Managed service/support (`/support`, `/api/console/support/*`)      | Yes                          | Yes                     | API routes present; full ticket flow not e2e-validated here | Yes                      | **Present, partially proven**    |

## High-Leverage Fixes Applied

1. **Console nav runtime correctness fix:** restored valid icon imports and corrected the nav array reference (`coreNavItems` -> `consoleNavItems`) to remove type/runtime break risk.
2. **Premium evidence links fix:** removed dead internal package links from visual proof registry by remapping to live docs routes, eliminating false discoverability claims.

## Residual Risk

- This report is contract-oriented and must be paired with current `pnpm verify:*` command output for go-live decisions.
- Browser E2E reality gate currently blocked by missing required startup env vars in this container; this prevents a full “click-through” truth statement for premium actions.
