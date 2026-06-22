# Settler Threat Model

This document outlines the threat model for the Settler reconciliation engine, including established boundaries, attack vectors, and mitigations. It reflects the architecture hardened during the Enterprise 360 Audit.

## 1. Trust Boundaries & Tenant Isolation

Settler is designed as a multi-tenant platform where data isolation is paramount.

### Invariants

- **Strict Data Isolation**: No tenant may access, enumerate, or infer the existence of another tenant's data.
- **Context Enforcement**: All API routes and background jobs MUST execute within a resolved, authenticated Tenant Context.
- **Fail-Closed Context**: Missing or invalid tenant context results in a hard failure (`TenantScopeError`), rather than failing open to cross-tenant access.

### Mitigations

- The `requireTenantRequestContext` middleware enforces tenant presence on every protected route.
- Prisma client extensions (RLS-like behavior) automatically inject tenant constraints onto queries where applicable.

## 2. Input Validation & Formula Injection

### Threat Vector

CSV exports containing user-controlled data can execute arbitrary macros or code if opened in spreadsheet applications (Excel, Google Sheets).

### Mitigations

- **CSV Formula Injection Sanitization**: All data exported via CSV (e.g., mismatch reports) is passed through `sanitizeCsvValue`.
- Any field beginning with `=`, `+`, `-`, or `@` is prepended with a single quote (`'`) to neutralize automatic formula execution.

## 3. Server-Side Request Forgery (SSRF)

### Threat Vector

Users can configure arbitrary Webhook URLs for reconciliation notifications. Without validation, an attacker could point a webhook to internal cloud infrastructure (AWS IMDS, GCP Metadata), loopback addresses, or private VPC resources.

### Mitigations

- **Pre-Flight Webhook Validation**: The `validateWebhookUrl` function enforces strict URL rules:
  - Must use HTTPS (in production).
  - Rejects `localhost`, `127.0.0.0/8`, and `[::1]`.
  - Rejects Cloud Metadata endpoints (e.g., `169.254.169.254`).
  - Rejects private IPv4 spaces (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
  - Rejects internal IPv6 networks (`fc00::/7`, `fe80::/10`).

## 4. Cryptographic Proof & Determinism

### Threat Vector

An attacker or operator might attempt to retroactively modify reconciliation results or mask discrepancies.

### Mitigations

- **Deterministic Hashing**: Every reconciliation run generates a SHA-256 cryptographic hash chain (Proofpack) of the original inputs, rules, and outputs.
- **Temporal Consistency**: The `generatedAt` timestamp is excluded from the underlying hash payload to ensure that identical datasets and rules mathematically yield identical evidence signatures, allowing for replayability and cryptographic verification.

## 5. Billing & State Manipulation

### Threat Vector

Users might exploit race conditions, unhandled errors, or malformed checkout states to bypass billing gates or provision resources without active subscriptions.

### Mitigations

- **Strict Stripe Webhook Processing**: Errors during Stripe checkout or portal sessions throw deterministic 422 (Unprocessable Entity) or 502 (Bad Gateway) errors rather than masking the error and returning false 200s.
- **Universal Billing Gate**: The `withUniversalBillingGate` middleware checks subscription state and usage entitlements prior to route execution.

## 6. Known Risks & Future Enhancements

- **Vercel Cron Concurrency**: Currently, Vercel cron jobs do not implement distributed locking (e.g., Postgres Advisory Locks). In multi-instance deployments, this could lead to redundant background job execution. Future updates will introduce centralized scheduling locks.
