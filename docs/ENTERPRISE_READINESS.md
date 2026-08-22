# Settler — Enterprise Readiness

This document details Settler's enterprise capabilities, compliance posture, and readiness for Fortune 500 deployment. Every capability listed here is backed by deployed, tested code.

## Multi-Tenant Isolation — 5-Layer Model

Settler enforces tenant isolation at five independent, defense-in-depth layers:

| Layer | Mechanism | Failure Mode |
|-------|-----------|-------------|
| **1. Middleware** | `tenantMiddleware` resolves `req.tenantId` from JWT, API key, header, or subdomain before any route handler | Request rejected (401) if tenant cannot be resolved |
| **2. TypeScript Interfaces** | Every repository method requires a mandatory `tenantId` parameter (compile-time enforced) | Code does not compile without tenant scoping |
| **3. SQL Guards** | Every tenant-scoped query includes `AND tenant_id = $N` | Query returns empty set if guard is missing |
| **4. PostgreSQL RLS** | Row-Level Security policies filter by `current_setting('app.current_tenant_id')` | Database silently filters unauthorized rows |
| **5. Entity Layer** | Cross-tenant save operations throw `Error('Tenant mismatch')` before touching the database | Write rejected at application layer |

**Key design principle:** Each layer operates independently. A failure in any single layer cannot expose cross-tenant data because the remaining four layers still enforce isolation.

See [SECURITY_INVARIANTS.md](SECURITY_INVARIANTS.md) for the full mechanical specification.

## Authentication & Authorization

### SSO / SAML 2.0
- Enterprise identity federation via `@node-saml/passport-saml`
- Configurable SAML entry point and issuer
- JWT-based session management with secure token rotation
- API key authentication with tenant scoping

### OpenFGA Authorization
- Attribute-based access control (ABAC) for fine-grained permissions
- **Fail-closed posture:** When OpenFGA is unavailable, requests are denied (403) rather than defaulting to permissive
- Role-based access: admin, operator, viewer, auditor, vendor

## Data Protection

### DLP (Data Loss Prevention)
- Real-time PII redaction middleware intercepts all API responses
- Pattern detection: SSN, credit card numbers, sensitive field names
- Configurable `skipDlp` bypass for trusted internal operations
- Nested object traversal — redacts PII in arbitrarily deep JSON structures

### Data Residency
- Tenant-level data residency configuration
- Geo-fenced processing controls
- SIEM export capabilities for security event forwarding

## Compliance Readiness

### SOX Compliance
- **Maker-Checker Approvals:** All reconciliation rule changes, exception resolutions, and configuration updates support dual-approval workflows
- **Audit Trail:** Append-only event store with tenant-scoped audit logs
- **Evidence Bundles:** Hash-linked proofpacks that auditors can verify offline
- **Change Management:** All operator decisions are timestamped, attributed, and immutable

### SOC 2 Type II Readiness
| Control Area | Implementation |
|---|---|
| **Access Control** | OpenFGA ABAC, SSO/SAML, API key scoping |
| **Audit Logging** | Append-only audit trail, SOC2 audit logger middleware |
| **Change Management** | Git-based infrastructure, CI/CD with release provenance |
| **Data Protection** | DLP middleware, encryption at rest (Prisma adapter), TLS in transit |
| **Incident Response** | Structured error handling, Sentry integration, SLA monitoring |
| **Availability** | Health check endpoints, circuit breaker patterns, Redis failover |

### GDPR / CCPA
- PII scanning and redaction via DLP middleware
- Data retention policies with configurable TTLs
- Right-to-erasure support via tenant data deletion workflows
- Data portability — export all tenant data in standardized formats

## API Security

### 46 Middleware Layers

Settler's API pipeline includes 46 independently tested middleware layers:

| Category | Middlewares |
|----------|-----------|
| **Authentication** | JWT auth, API key auth, tenant resolution, SSO/SAML |
| **Authorization** | OpenFGA ABAC, billing gating, entitlements, feature flags |
| **Security** | CSRF protection, DLP, input sanitization, IP allowlist, request signing, security headers |
| **Rate Control** | Rate limiter (global), recon rate limiter (per-tenant), cost control, quota enforcement |
| **Observability** | Request ID injection, Sentry error tracking, structured logging, usage tracking |
| **Data Quality** | Validation (Zod), error standardization, API contract versioning |
| **Performance** | Compression, ETag/caching, cache headers, request timeout |
| **Governance** | SOC2 audit logger, governance middleware, test-mode isolation |

### Request Signing
- HMAC-based request signing for webhook deliveries
- Signature verification for incoming webhook payloads
- Replay attack prevention with timestamp validation

### Idempotency
- Idempotency key support for all mutating operations
- Automatic deduplication of replayed requests
- Configurable retention window for idempotency records

## Monitoring & Operations

### SLA Monitoring
- Configurable SLA thresholds per tenant
- Real-time SLA compliance tracking
- Alerting pipeline for SLA breaches

### SLO Alerting
- Service Level Objective definitions with error budget tracking
- Multi-channel alerting (email, webhook, Slack integration)

### Health Checks
- `/api/v1/health` endpoint with version and timestamp
- System health router for infrastructure status
- Grafana dashboard templates for operational monitoring

## CI/CD Pipeline

23 GitHub Actions workflows ensuring code quality, security, and deployment integrity:

| Workflow | Purpose |
|----------|---------|
| `ci.yml` | Full lint → typecheck → build → test pipeline |
| `e2e.yml` | Playwright E2E test execution |
| `security.yml` | Dependency scanning, secret detection |
| `secrets-scan.yml` | Gitleaks secret scanning |
| `migration-guardian.yml` | Database migration safety validation |
| `release-provenance.yml` | SLSA provenance attestation for releases |
| `deploy-production.yml` | Production deployment with rollback support |
| `guardrails.yml` | Policy enforcement gates |
| `rust-verify.yml` | Rust kernel verification |
| `tigerbeetle-cluster.yml` | TigerBeetle cluster health |

## Deployment Options

| Model | Description | Target |
|-------|-------------|--------|
| **Self-Hosted (OSS)** | Full platform, customer-managed infrastructure | Developer evaluation, regulated industries requiring on-prem |
| **Settler Cloud** | Managed SaaS with tenant isolation | Mid-market companies, scaling startups |
| **Managed Enterprise** | Dedicated infrastructure, custom SLAs, white-glove onboarding | Fortune 500, financial institutions |

---

*For security-specific details, see [SECURITY_INVARIANTS.md](SECURITY_INVARIANTS.md). For architecture, see [PRODUCT_OVERVIEW.md](PRODUCT_OVERVIEW.md).*
