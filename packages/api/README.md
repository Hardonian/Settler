# @settler/api

Express-based control plane for Settler.

## Responsibility

- Authenticated API surface (`/api/v1`, `/api/v2`)
- Tenant-aware route protection
- Idempotency and rate limiting middleware
- Health and metrics endpoints
- Deterministic/replay-related service wiring

## How it fits the system

`@settler/api` is the runtime control plane used by web/CLI/SDK surfaces. It provides trace propagation (`X-Trace-Id`, `X-Execution-Id`) and machine-readable error behavior for operators.

## Run and test

```bash
pnpm --filter @settler/api dev
pnpm --filter @settler/api build
pnpm --filter @settler/api test
pnpm --filter @settler/api test:tenant-safety
```

## Important contracts

- Health routes: `/health`, `/health/live`, `/health/ready`
- Metrics route: `/metrics`
- Auth routes are mounted separately; most business routes require auth + idempotency + API-key limits.
- Tenant-sensitive routes must preserve tenant scope middleware.

## Maturity

- Stable core: health/metrics, middleware chain, v1 operational APIs.
- Strategic/internal expansion: much of v2 surface.
