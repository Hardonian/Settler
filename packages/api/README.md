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

## OSS/private capability boundary

The API now uses a capability registry to separate OSS-safe runtime behavior from optional private providers.

- `services/capabilities/registry.ts` is the single loader/registry for optional capabilities.
- OSS core **must not** hard-import private modules. Private providers are loaded only through `SETTLER_OPERATOR_INTELLIGENCE_PROVIDER_MODULE` dynamic import.
- Operator intelligence endpoints (`/api/v1/operator/intelligence/*`, `/platform-control-plane/*`) always return truthful capability metadata.
- If optional storage or provider dependencies are absent, these endpoints degrade safely with deterministic empty datasets and capability state `unavailable` instead of hard 500s.
- Capability inventory is exposed at `GET /api/v1/capabilities` with role/scope projection at `GET /api/v1/capabilities/projected`.
- Capability state observations are emitted to `capability_status_observed_total` Prometheus metric for operator observability.

Boundary rule of thumb:

1. Core reconciliation, auth, tenancy, safety invariants stay in OSS runtime.
2. Enterprise-only modules attach via provider interfaces in `services/capabilities/providers/*`.
3. Routes must gate behavior from provider status and expose machine-readable capability truth.
