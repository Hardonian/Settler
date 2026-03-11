# PILOT OPERATOR RUNBOOK

## 1) Onboarding steps
1. Create tenant bootstrap plan:
   - `pnpm tenant:create --name "Acme Pilot" --slug acme-pilot --owner-email ops@acme.test`
2. Execute tenant creation against target API:
   - `pnpm tenant:create --execute --write-env --base-url https://<api-host> --api-key <operator-admin-key> --name "Acme Pilot" --slug acme-pilot --owner-email ops@acme.test`
3. Confirm generated env file exists: `.env.tenant.acme-pilot`.
4. Validate tenant isolation checks before opening operator access:
   - `pnpm verify:tenant`

## 2) Reconciliation workflow
1. Stage pilot data from `/pilot-data`.
2. Parse + validate + preview with import workbench module (`scripts/pilot/import-workbench.ts`).
3. Load normalized transactions to ingestion route (CSV/webhook/REST).
4. Trigger reconciliation run for the workspace.
5. Record run ID and reconciliation evidence bundle for audit.

## 3) Alert handling
1. Monitor alert channels (email/Slack/PagerDuty) for:
   - reconciliation drift
   - mismatch threshold breach
   - ingestion failures
2. For every alert:
   - identify tenant/workspace ID
   - capture run ID + correlation ID
   - classify as data quality vs system failure
3. Apply least-privilege remediation and re-run only affected tenant scope.

## 4) Replay workflow
1. Locate target run ID from operator UI or execution ledger.
2. Replay with immutable input snapshot and pinned policy version.
3. Compare output hash to original evidence hash.
4. If hash mismatch:
   - raise `replay_divergence`
   - block policy promotion until resolved
   - preserve both evidence bundles.

## 5) Troubleshooting
- **Tenant creation fails**: verify admin API key scope and workspace slug uniqueness.
- **Connector ingest fails**: validate source signature/credentials and payload schema.
- **Reconciliation stalls**: inspect worker queue depth and Redis health.
- **Missing alerts**: validate alert provider credentials and route configuration.
- **Replay mismatch**: verify policy/rules version pinning and input artifact integrity.
