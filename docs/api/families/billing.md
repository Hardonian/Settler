# API Family: billing

Generated from route inventory. Routes: **4**.

| Method | Path                            | Criticality | Auth | Tenant | Test    | Source                                                       |
| ------ | ------------------------------- | ----------- | ---- | ------ | ------- | ------------------------------------------------------------ |
| POST   | `/api/billing/dispute`          | critical    | yes  | no     | missing | `packages/web/src/app/api/billing/dispute/route.ts`          |
| GET    | `/api/billing/payment-recovery` | critical    | yes  | no     | covered | `packages/web/src/app/api/billing/payment-recovery/route.ts` |
| POST   | `/api/billing/payment-recovery` | critical    | yes  | no     | covered | `packages/web/src/app/api/billing/payment-recovery/route.ts` |
| POST   | `/api/billing/retry-payment`    | critical    | yes  | no     | missing | `packages/web/src/app/api/billing/retry-payment/route.ts`    |
