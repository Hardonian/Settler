# API Family: control-plane

Generated from route inventory. Routes: **7**.

| Method | Path | Criticality | Auth | Tenant | Test | Source |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/control-plane/failures` | critical | yes | yes | missing | `packages/web/src/app/api/control-plane/failures/route.ts` |
| POST | `/api/control-plane/failures` | critical | yes | yes | missing | `packages/web/src/app/api/control-plane/failures/route.ts` |
| GET | `/api/control-plane/keys` | critical | yes | no | missing | `packages/web/src/app/api/control-plane/keys/route.ts` |
| GET | `/api/control-plane/metrics` | critical | yes | yes | missing | `packages/web/src/app/api/control-plane/metrics/route.ts` |
| GET | `/api/control-plane/policies` | critical | yes | no | missing | `packages/web/src/app/api/control-plane/policies/route.ts` |
| PATCH | `/api/control-plane/policies/[policyId]` | critical | yes | no | covered | `packages/web/src/app/api/control-plane/policies/[policyId]/route.ts` |
| POST | `/api/control-plane/triggers` | critical | yes | no | missing | `packages/web/src/app/api/control-plane/triggers/route.ts` |