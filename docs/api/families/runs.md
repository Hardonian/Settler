# API Family: runs

Console run surfaces (list + detail) use `@settler/reconciliation-core` merged pagination and cross-table resolution so **recon jobs** and **ingestion reconciliation runs** stay aligned with `/api/console/reconciliation` and Express v1 reconciliation reads.

Canonical contract notes:

- `runs` is the canonical operator-truth surface (list + detail).
- `/api/runs/[id]` delegates tenant-scoped resolution, enrichment (results, snapshots, audits, drift aggregates, deterministic previews), and serialization to `resolveOperatorRunDetailForTenants` in `@settler/reconciliation-core`, which emits `OperatorRunDetail` for both `recon_job` and `ingestion_run`.
- Express `GET /api/runs/:runId` uses the same resolver and returns `{ data: OperatorRunDetail }` (Express envelope). It is not a separate serialized truth path.
- Next.js `GET /api/v1/runs/[id]` is a **compatibility-only** v1 recon-job summary; it does not emit `OperatorRunDetail` and must not be treated as canonical operator detail.
- Any `reconciliations` list exposure is compatibility-only and remains fenced to legacy scope metadata in console list responses.

| Method | Path               | Criticality | Auth | Tenant | Test    | Source                                          |
| ------ | ------------------ | ----------- | ---- | ------ | ------- | ----------------------------------------------- |
| GET    | `/api/runs`        | medium      | yes  | yes    | partial | `packages/web/src/app/api/runs/route.ts`        |
| GET    | `/api/runs/[id]`   | medium      | yes  | yes    | partial | `packages/web/src/app/api/runs/[id]/route.ts`   |
| GET    | Express `/api/runs/:runId` | medium | yes | yes | partial | `packages/api/src/routes/runs.ts` |
| POST   | `/api/runs/create` | medium      | yes  | yes    | missing | `packages/web/src/app/api/runs/create/route.ts` |
