# API Route Registry (Current OSS Surface)

Generated from filesystem scan under `packages/web/src/app/api/**/route.ts`.

## Route groups

- Platform health/status: `/api/health`, `/api/status`, `/api/v1/health`, `/api/v1/ready`, `/api/v1/meta`
- Reconciliation core: `/api/runs`, `/api/jobs`, `/api/receipts`, `/api/imports`, `/api/data/*`
- Tenant/operator console: `/api/console/*`, `/api/admin/*`, `/api/workspaces`
- Billing + usage: `/api/stripe/*`, `/api/billing/*`, `/api/quota`, `/api/pricing/experiments`
- Integrations + webhooks: `/api/integrations/*`, `/api/docs/openapi`, `/api/metrics/*`

## Verification

`tsx scripts/verify-api-surface.ts` enforces required API surface areas exist so major product promises are backed by real endpoints.

### Required API prefixes currently enforced

- `/api/health`
- `/api/status`
- `/api/v1`
- `/api/stripe`
- `/api/console`
- `/api/admin`
- `/api/receipts`
- `/api/runs`
- `/api/imports`
- `/api/workspaces`

## Notes

- Tenant isolation and authorization are enforced in route/middleware implementations, not by trusting request body tenant IDs.
- Error envelope consistency should continue to converge on typed Problem+JSON with request correlation IDs.
