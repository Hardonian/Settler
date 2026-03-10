# API Surface (Truth Pass)

This document tracks the currently implemented route surfaces from `packages/api/src/index.ts` and mounted routers.

## Public operational endpoints

| Route             | Method | Purpose                  | Auth                         |
| ----------------- | ------ | ------------------------ | ---------------------------- |
| `/health`         | GET    | Health root              | No                           |
| `/health/live`    | GET    | Liveness probe           | No                           |
| `/health/ready`   | GET    | Readiness probe          | No                           |
| `/metrics`        | GET    | Prometheus metrics       | No (protect at edge in prod) |
| `/api/csrf-token` | GET    | CSRF token for web flows | No                           |

## Versioned API roots

- `/api/v1/*` — primary API surface.
- `/api/v2/*` — strategic/internal expansion surface.

## Authentication and tenant behavior

- Auth routes are mounted at `/api/v1/auth` and `/api/v2/auth`.
- Most v1/v2 business routes run behind auth middleware + idempotency + API-key rate limiting.
- Tenant-sensitive data routes are mounted under `/tenant` with tenant middleware.
- Trace and execution IDs are propagated via headers (`X-Trace-Id`, `X-Execution-Id`).

## Route families (v1)

Mounted families include:

- `/transactions`, `/settlements`, `/fees`, `/exports`, `/currency`
- `/ingestion`, `/ingestion/exports`, `/reconciliation`, `/reconciliations`
- `/webhooks/*`, `/notifications`, `/audit-trail`
- `/multi-source-reconciliation`, `/approvals`, `/progress`
- `/receipt-matching`, `/bulk-operations`, `/advanced-matching-rules`
- `/sla`, `/custom-integrations`, `/dedicated-infrastructure`

## Route families (v2, currently strategic/internal)

- `/reconciliation-graph`
- `/ai-agents`
- `/network-effects`
- `/knowledge`
- `/compliance`

## Error semantics

- Unknown routes return structured JSON and include trace metadata.
- Consumers should treat non-2xx responses as machine-readable and log `traceId` for support correlation.
- Problem+JSON style guidance: see `docs/support/api-error-guide.md`.

## Runtime constraints

- Requests are protected by global IP rate limiting and API-key rate limiting middleware.
- State-changing routes run through idempotency middleware.
- JSON body size/depth protections are enabled.

## Resilience guarantees (production behavior)

- **Idempotency:** Mutating routes honor `Idempotency-Key` when provided. Duplicate keys with same payload return cached response, and payload/key mismatch returns `409 IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD`.
- **Pagination:** Cursor pagination input is normalized with enforced page caps and invalid cursor rejection (`INVALID_CURSOR`).
- **Rate limiting:** Tenant/API-key aware limits and global abuse limits are enforced with structured `429` responses and `Retry-After` metadata.
- **Webhooks:** Webhook receive endpoints require signatures, enforce timestamp freshness windows, and deduplicate replayed payloads to avoid double-processing.
- **Error envelope stability:** Error responses preserve machine-readable `error` code, message, and trace correlation.

## Verification workflow

```bash
pnpm --filter @settler/web validate:api-routes
pnpm --filter @settler/api test
```
