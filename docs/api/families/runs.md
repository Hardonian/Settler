# API Family: runs

Console run surfaces (list + detail) use `@settler/reconciliation-core` merged pagination and cross-table resolution so **recon jobs** and **ingestion reconciliation runs** stay aligned with `/api/console/reconciliation` and Express v1 reconciliation reads.

Canonical contract notes:

- `runs` is the canonical operator-truth surface (list + detail).
- `/api/runs/[id]` detail payloads are serialized via `OperatorRunDetail` in `@settler/reconciliation-core` for both `recon_job` and `ingestion_run`.
- Any `reconciliations` list exposure is compatibility-only and remains fenced to legacy scope metadata in console list responses.

| Method | Path               | Criticality | Auth | Tenant | Test    | Source                                          |
| ------ | ------------------ | ----------- | ---- | ------ | ------- | ----------------------------------------------- |
| GET    | `/api/runs`        | medium      | yes  | yes    | partial | `packages/web/src/app/api/runs/route.ts`        |
| GET    | `/api/runs/[id]`   | medium      | yes  | yes    | partial | `packages/web/src/app/api/runs/[id]/route.ts`   |
| POST   | `/api/runs/create` | medium      | yes  | yes    | missing | `packages/web/src/app/api/runs/create/route.ts` |
