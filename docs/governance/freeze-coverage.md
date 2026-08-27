# Freeze Coverage

Settler uses tenant-level freeze controls to block high-risk mutations while keeping read paths, diagnostics, and governance recovery available.

## Protected Mutation Categories

- Reconciliation execution and reruns
- Ingestion uploads, retries, and source creation
- Bulk operations
- Approval decisions and approver configuration
- Exception resolution workflows
- Advanced matching rule creation and rule testing
- Receipt matching mutations
- Operator mode kill switches, cost controls, and backups
- Custom integrations and dedicated infrastructure provisioning
- Tenant data deletion
- Tolerance setting updates
- Progress checkpoint creation and resume
- SLA agreement, metric, and acknowledgement mutations
- Notification preference updates

## Intentional Carve-Outs

- `GET /api/v1/governance/freeze` stays available so operators can inspect state during freeze.
- `POST /api/v1/governance/freeze` bypasses freeze enforcement so an authorized operator can unfreeze the tenant.
- Read-only run, reconciliation, exception, diagnostics, and audit surfaces stay available during freeze.

## API Behavior

Freeze-blocked mutations return:

```json
{
  "error": "GOVERNANCE_FREEZE_ACTIVE",
  "message": "Operation blocked: Tenant is in read-only mode. Unfreeze the system to enable write operations.",
  "frozen": true,
  "frozen_at": "2026-03-17T10:00:00Z",
  "freeze_reason": "Validation lock",
  "traceId": "trace-123"
}
```

Status code: `423 Locked`

## Operator Recovery Path

- Open governance controls at `/console/settings?tab=governance#governance`
- Confirm the freeze reason and timestamp
- Review runs, exceptions, and diagnostics before unfreezing
- Retry the blocked mutation only after the freeze is intentionally lifted

## Verification

- Script: `corepack pnpm verify:freeze-coverage`
- Backend tests include focused route coverage for the expanded freeze-protected mutations
