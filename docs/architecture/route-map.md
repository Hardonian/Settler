# Route Map

Generated: 2026-03-09

All routes must return `200` or a Problem+JSON error (`application/problem+json`).

---

## Web Package — Next.js App Router

### Public Marketing Routes

| Path              | Status | Notes                       |
| ----------------- | ------ | --------------------------- |
| `/`               | ✅ 200 | Landing page                |
| `/product`        | ✅ 200 | Product overview            |
| `/how-it-works`   | ✅ 200 | Mechanism explainer         |
| `/reconciliation` | ✅ 200 | Reconciliation feature page |
| `/replay-lab`     | ✅ 200 | Interactive replay lab      |
| `/proof-explorer` | ✅ 200 | Proof capsule explorer      |
| `/policies`       | ✅ 200 | Policy engine docs          |
| `/security`       | ✅ 200 | Security posture page       |
| `/pricing`        | ✅ 200 | Pricing tiers               |
| `/about`          | ✅ 200 | About page                  |
| `/changelog`      | ✅ 200 | Changelog                   |
| `/blog`           | ✅ 200 | Blog index                  |
| `/blog/[slug]`    | ✅ 200 | Blog posts                  |
| `/comparison`     | ✅ 200 | Competitive comparison      |
| `/community`      | ✅ 200 | Community page              |
| `/contact`        | ✅ 200 | Contact form                |
| `/cookbook`       | ✅ 200 | Integration cookbook        |
| `/architecture`   | ✅ 200 | Architecture overview       |
| `/benchmarks`     | ✅ 200 | Performance benchmarks      |

### Auth Routes

| Path             | Status | Notes          |
| ---------------- | ------ | -------------- |
| `/auth/login`    | ✅ 200 | Supabase auth  |
| `/auth/callback` | ✅ 200 | OAuth callback |
| `/auth/signup`   | ✅ 200 | Registration   |

### Authenticated Console Routes (`/console/*`, canonical)

| Path                       | Status | Auth Required |
| -------------------------- | ------ | ------------- |
| `/console`                 | ✅ 200 | ✅            |
| `/console/runs`            | ✅ 200 | ✅            |
| `/console/reconciliations` | ✅ 200 | ✅            |
| `/console/replay-lab`      | ✅ 200 | ✅            |
| `/console/proof-explorer`  | ✅ 200 | ✅            |
| `/console/audits`          | ✅ 200 | ✅            |
| `/console/diagnostics`     | ✅ 200 | ✅            |
| `/console/settings`        | ✅ 200 | ✅            |

> Legacy `/app/*` aliases may still exist for backward compatibility but are not the canonical operator route language.

### Admin Routes (`/admin/*`)

| Path             | Status | Notes                  |
| ---------------- | ------ | ---------------------- |
| `/admin`         | ✅ 200 | Operator mode required |
| `/admin/runs`    | ✅ 200 | All runs view          |
| `/admin/audit`   | ✅ 200 | Audit trail            |
| `/admin/metrics` | ✅ 200 | System metrics         |
| `/admin/health`  | ✅ 200 | Health dashboard       |

---

## Web Package — Next.js API Routes (`/api/*`)

### Health

| Route         | Method | Returns                  |
| ------------- | ------ | ------------------------ |
| `/api/health` | GET    | `{ ok, status, checks }` |
| `/api/status` | GET    | `{ status, timestamp }`  |

### Admin API

| Route                   | Method   | Auth            |
| ----------------------- | -------- | --------------- |
| `/api/admin/health`     | GET      | Admin JWT       |
| `/api/admin/audit`      | GET      | Admin JWT       |
| `/api/admin/exceptions` | GET/POST | Admin JWT       |
| `/api/admin/metrics`    | GET      | Admin JWT       |
| `/api/admin/jobforge`   | GET      | Admin JWT       |
| `/api/admin/runs`       | GET      | Admin JWT       |
| `/api/admin/stream`     | GET      | Admin JWT + SSE |

### AI Endpoints

| Route                          | Method | Auth     |
| ------------------------------ | ------ | -------- |
| `/api/ai/data-insights`        | POST   | User JWT |
| `/api/ai/onboarding-assistant` | POST   | User JWT |
| `/api/ai/support-assistant`    | POST   | User JWT |
| `/api/ai/troubleshooting`      | POST   | User JWT |

### Billing

| Route                           | Method | Auth     |
| ------------------------------- | ------ | -------- |
| `/api/billing/dispute`          | POST   | User JWT |
| `/api/billing/payment-recovery` | POST   | User JWT |
| `/api/billing/retry-payment`    | POST   | User JWT |

### Connectors

| Route                      | Method   | Auth           |
| -------------------------- | -------- | -------------- |
| `/api/connectors/backfill` | POST     | User JWT       |
| `/api/connectors/callback` | GET/POST | Public (OAuth) |
| `/api/connectors/connect`  | POST     | User JWT       |

### Core Operations

| Route                   | Method   | Auth     |
| ----------------------- | -------- | -------- |
| `/api/runs`             | GET/POST | User JWT |
| `/api/runs/[id]/replay` | GET      | User JWT |
| `/api/receipts`         | GET      | User JWT |
| `/api/exports`          | GET/POST | User JWT |
| `/api/jobs`             | GET/POST | User JWT |
| `/api/metrics`          | GET      | User JWT |
| `/api/quota`            | GET      | User JWT |
| `/api/workspaces`       | GET      | User JWT |

### Stripe Webhooks

| Route         | Method | Auth             |
| ------------- | ------ | ---------------- |
| `/api/stripe` | POST   | Stripe Signature |

### Versioned API

| Route       | Method  | Notes                |
| ----------- | ------- | -------------------- |
| `/api/v1/*` | Various | Stable public API v1 |

---

## Express API Package Routes (`/api/*`)

### Core

| Route                | Method | Auth |
| -------------------- | ------ | ---- |
| `GET /health`        | GET    | None |
| `GET /api/v1/status` | GET    | None |

### Auth

| Route                       | Method | Auth    |
| --------------------------- | ------ | ------- |
| `POST /api/v1/auth/token`   | POST   | API Key |
| `POST /api/v1/auth/refresh` | POST   | JWT     |
| `DELETE /api/v1/auth/token` | DELETE | JWT     |

### Reconciliation

| Route                          | Method | Auth |
| ------------------------------ | ------ | ---- |
| `GET /api/v1/runs`             | GET    | JWT  |
| `POST /api/v1/runs`            | POST   | JWT  |
| `GET /api/v1/runs/:id`         | GET    | JWT  |
| `GET /api/v1/runs/:id/replay`  | GET    | JWT  |
| `GET /api/v1/runs/:id/status`  | GET    | JWT  |
| `GET /api/v1/runs/:id/summary` | GET    | JWT  |

### Reports

| Route                         | Method | Auth |
| ----------------------------- | ------ | ---- |
| `GET /api/v1/reports`         | GET    | JWT  |
| `POST /api/v1/reports/export` | POST   | JWT  |
| `GET /api/v1/reports/:id`     | GET    | JWT  |

### Adapters

| Route                        | Method | Auth |
| ---------------------------- | ------ | ---- |
| `GET /api/v1/adapters`       | GET    | JWT  |
| `POST /api/v1/adapters/test` | POST   | JWT  |

### API Keys

| Route                         | Method | Auth |
| ----------------------------- | ------ | ---- |
| `GET /api/v1/api-keys`        | GET    | JWT  |
| `POST /api/v1/api-keys`       | POST   | JWT  |
| `DELETE /api/v1/api-keys/:id` | DELETE | JWT  |

### Dashboards

| Route                        | Method | Auth |
| ---------------------------- | ------ | ---- |
| `GET /api/v1/dashboards`     | GET    | JWT  |
| `GET /api/v1/dashboards/:id` | GET    | JWT  |

### Audit Trail

| Route                            | Method | Auth |
| -------------------------------- | ------ | ---- |
| `GET /api/v1/audit-trail`        | GET    | JWT  |
| `GET /api/v1/audit-trail/:runId` | GET    | JWT  |

### Alerts & Notifications

| Route                       | Method | Auth |
| --------------------------- | ------ | ---- |
| `GET /api/v1/alerts`        | GET    | JWT  |
| `POST /api/v1/alerts`       | POST   | JWT  |
| `GET /api/v1/notifications` | GET    | JWT  |

### AI

| Route                    | Method | Auth |
| ------------------------ | ------ | ---- |
| `POST /api/v1/ai/assist` | POST   | JWT  |
| `POST /api/v1/ai/edge`   | POST   | JWT  |

### Versioned

| Route         | Method  | Notes          |
| ------------- | ------- | -------------- |
| `* /api/v2/*` | Various | v2 API surface |

---

## Error Response Contract

All errors must return `application/problem+json`:

```json
{
  "type": "https://settler.dev/errors/not-found",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Execution run abc123 not found",
  "instance": "/api/v1/runs/abc123",
  "trace_id": "req_abc123"
}
```

Standard status codes:

- `200` — Success
- `201` — Created
- `204` — No content
- `400` — Bad request (validation failure)
- `401` — Unauthorized (missing/invalid token)
- `403` — Forbidden (insufficient permissions)
- `404` — Not found
- `409` — Conflict (idempotency key collision)
- `422` — Unprocessable entity (business rule violation)
- `429` — Rate limited
- `500` — Internal server error
- `503` — Service unavailable

---

## Route Resolution Policy

1. Every public route responds within 2s or returns `503`.
2. Authenticated routes check JWT validity before processing.
3. Admin routes require `operator_mode=true` claim in JWT.
4. All `POST/PUT/PATCH/DELETE` routes require CSRF token (web) or API key (API server).
5. Tenant isolation: every authenticated route scopes to `tenant_id` from JWT claim.

### Operations API

| Route                | Method | Auth                       | Runtime | Error Behavior                                           |
| -------------------- | ------ | -------------------------- | ------- | -------------------------------------------------------- |
| `/api/ops/dashboard` | GET    | Billing-gated public route | nodejs  | Graceful degradation to zeroed metrics + trace id header |
