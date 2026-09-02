# API Family: admin

Generated from route inventory. Routes: **10**.

| Method | Path | Criticality | Auth | Tenant | Test | Source |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/admin/audit` | critical | yes | yes | covered | `packages/web/src/app/api/admin/audit/route.ts` |
| GET | `/api/admin/exceptions` | critical | yes | yes | missing | `packages/web/src/app/api/admin/exceptions/route.ts` |
| POST | `/api/admin/exceptions/[id]/escalate` | critical | yes | no | covered | `packages/web/src/app/api/admin/exceptions/[id]/escalate/route.ts` |
| POST | `/api/admin/exceptions/[id]/resolve` | critical | yes | no | covered | `packages/web/src/app/api/admin/exceptions/[id]/resolve/route.ts` |
| GET | `/api/admin/health` | critical | yes | no | missing | `packages/web/src/app/api/admin/health/route.ts` |
| GET | `/api/admin/jobforge` | critical | yes | yes | missing | `packages/web/src/app/api/admin/jobforge/route.ts` |
| POST | `/api/admin/jobforge` | critical | yes | yes | missing | `packages/web/src/app/api/admin/jobforge/route.ts` |
| GET | `/api/admin/metrics` | critical | yes | yes | missing | `packages/web/src/app/api/admin/metrics/route.ts` |
| GET | `/api/admin/runs` | critical | yes | yes | missing | `packages/web/src/app/api/admin/runs/route.ts` |
| GET | `/api/admin/stream` | critical | yes | yes | missing | `packages/web/src/app/api/admin/stream/route.ts` |