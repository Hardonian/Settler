# Canonical Platform Security Hardening (API/Realtime/Webhooks/Alerts)

## Tenant isolation and authorization

- Tenant context selection via `X-Tenant-ID` now requires authenticated identity.
- Cross-tenant header-based context switching is denied for non-owner/admin roles.
- Tenant context failure paths return machine-readable problem JSON codes:
  - `TENANT_CONTEXT_AUTH_REQUIRED`
  - `TENANT_CONTEXT_USER_NOT_FOUND`
  - `TENANT_CONTEXT_FORBIDDEN`

## Realtime stream security guarantees

- SSE stream endpoints require authenticated `userId` + server-side tenant context.
- Realtime reconnect abuse throttling is enforced per `tenant + ip + job`.
- Connection quotas are enforced at tenant and tenant/job levels.
- Event payloads are redacted before delivery and before explicit broadcasts.

## Webhook ingress security model

- Webhook adapters are allowlisted (`WEBHOOK_ALLOWED_ADAPTERS` or secure defaults).
- Timestamp header is mandatory and bounded by tolerance window.
- Signature verification requires raw body capture.
- Replay protection uses namespaced dedupe keys:
  - Distributed mode (Redis available): shared replay window guarantees.
  - Local-only mode (Redis unavailable): explicit local dedupe fallback.
- Ingest responses expose truthful protection mode (`distributed` or `local_only`).

## Alert payload hygiene

- Outbound Slack/Teams/Telegram alerts sanitize payloads prior to dispatch:
  - summary normalization + truncation
  - metadata redaction via shared redaction utility
  - operator URLs stripped of query/hash tokens
- External channels receive summary-grade data; deep context must be retrieved in secured operator surfaces.

## Local vs distributed runtime truthfulness

- Webhook replay guarantees are explicit in response payloads and logs.
- Systems without Redis never imply distributed replay guarantees.
