# API Family: jobs

Generated from route inventory. Routes: **7**.

| Method | Path                                      | Criticality | Auth | Tenant | Test    | Source                                                                 |
| ------ | ----------------------------------------- | ----------- | ---- | ------ | ------- | ---------------------------------------------------------------------- |
| POST   | `/api/jobs`                               | critical    | no   | yes    | missing | `packages/web/src/app/api/jobs/route.ts`                               |
| GET    | `/api/jobs/[id]`                          | critical    | no   | yes    | missing | `packages/web/src/app/api/jobs/[id]/route.ts`                          |
| GET    | `/api/jobs/[id]/exceptions`               | critical    | yes  | yes    | missing | `packages/web/src/app/api/jobs/[id]/exceptions/route.ts`               |
| PATCH  | `/api/jobs/[id]/exceptions/[exceptionId]` | critical    | yes  | yes    | missing | `packages/web/src/app/api/jobs/[id]/exceptions/[exceptionId]/route.ts` |
| GET    | `/api/jobs/[id]/progress`                 | critical    | yes  | yes    | missing | `packages/web/src/app/api/jobs/[id]/progress/route.ts`                 |
| GET    | `/api/jobs/[id]/result`                   | critical    | no   | yes    | missing | `packages/web/src/app/api/jobs/[id]/result/route.ts`                   |
| POST   | `/api/jobs/bulk`                          | critical    | yes  | yes    | missing | `packages/web/src/app/api/jobs/bulk/route.ts`                          |
