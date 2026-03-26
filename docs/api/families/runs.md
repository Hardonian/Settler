# API Family: runs

Console run surfaces (list + detail) use `@settler/reconciliation-core` merged pagination and cross-table resolution so **recon jobs** and **ingestion reconciliation runs** stay aligned with `/api/console/reconciliation` and Express v1 reconciliation reads.

| Method | Path | Criticality | Auth | Tenant | Test | Source |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/runs` | medium | yes | yes | partial | `packages/web/src/app/api/runs/route.ts` |
| GET | `/api/runs/[id]` | medium | yes | yes | partial | `packages/web/src/app/api/runs/[id]/route.ts` |
| POST | `/api/runs/create` | medium | yes | yes | missing | `packages/web/src/app/api/runs/create/route.ts` |