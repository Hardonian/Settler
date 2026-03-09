# System Surface Map

## Surfaces

- **CLI**: `packages/cli/src/commands/*` invoke API endpoints and replay/export tooling.
- **API**: `packages/api/src/index.ts` mounts v1/v2 routers, auth, tenancy, idempotency, observability, and error handling.
- **Workers / background jobs**: `packages/api/src/jobs/*` execute scheduled retention, aggregation, SLA, and refresh tasks.
- **Queue/execution handlers**: `packages/workhorse/src/settler_workhorse/handlers/*` process export/import/backfill tasks.
- **Proof/evidence generation**: CLI foundry and export-integrity modules; API export routes and reconciliation reporting.
- **Replay logic**: CLI replay/jobs replay commands + API replay route family.
- **Storage**: Postgres via `packages/api/src/db` and query calls in route/services.
- **Tenant isolation**: auth + tenant middleware and tenant-scoped queries.
- **Observability**: API observability middleware + structured logger; worker observability module.

## Flow topology

1. Request enters CLI/API surface.
2. Validation/auth/tenant context resolves.
3. Execution starts in service/worker path.
4. Policy and reconciliation logic runs.
5. Outputs and proof artifacts are produced.
6. Data + event logs persist.
7. Response/report returned to caller.

## Request → validation → execution → proof → storage → response

- **Request**: HTTP/CLI command initiation.
- **Validation**: schema/auth/tenant checks and idempotency gates.
- **Execution**: reconciliation/workflow operations.
- **Proof**: receipts/replay/export integrity artifacts.
- **Storage**: execution, matches, exceptions, audit/event rows.
- **Response**: JSON or problem+json with trace metadata.
