# Trust Packet

This document provides the information typically required for enterprise security review and procurement. It describes what Settler does and does not do, with references to verifiable evidence in this repository.

## Product summary

Settler is a deterministic reconciliation platform. It matches financial transactions across data sources (e.g., payment processor vs. bank ledger) and produces audit-grade evidence for every decision.

**Settler processes:** Transaction metadata, amounts, dates, identifiers, reconciliation results, exception records, audit logs.

**Settler does not process:** Raw payment credentials, PII beyond what exists in transaction metadata, or any data outside the reconciliation domain.

## Architecture overview

| Component         | Technology                     | Purpose                                              |
| ----------------- | ------------------------------ | ---------------------------------------------------- |
| Control Plane API | Node.js / Express / TypeScript | Orchestration, routing, tenant management            |
| Console           | Next.js                        | Operator dashboard                                   |
| Primary Database  | PostgreSQL (Supabase)          | Projections, metadata, audit logs, tenant config     |
| Ledger            | TigerBeetle                    | Immutable financial-grade transaction ledger         |
| Cache / Queue     | Redis                          | Job queue, caching (optional for basic operation)    |
| CLI               | TypeScript                     | Operator tooling, verification, test data generation |

See: [`docs/architecture/platform-architecture.md`](architecture/platform-architecture.md)

## Tenant isolation

Settler is multi-tenant by design. Tenant isolation is enforced at multiple layers:

1. **Database (Row-Level Security):** All PostgreSQL tables with tenant data have RLS policies. Every query is scoped by `tenant_id`.
2. **API middleware:** Every authenticated request is bound to a tenant. Cross-tenant access is mechanically prevented.
3. **Ledger isolation:** TigerBeetle accounts are partitioned by tenant.

**Verification evidence:**

- RLS policies: [`supabase/migrations/`](../supabase/migrations/) (search for `CREATE POLICY`)
- Tenant middleware: [`packages/api/src/middleware/`](../packages/api/src/middleware/)
- Security invariants: [`SECURITY_INVARIANTS.md`](../SECURITY_INVARIANTS.md)
- Cross-tenant test suite: `pnpm test:cross-tenant`

## Authentication and authorization

| Method                       | Use case                     | Implementation                    |
| ---------------------------- | ---------------------------- | --------------------------------- |
| API Key (`X-API-Key` header) | Server-to-server, SDK, CI/CD | Scoped to tenant, revocable       |
| JWT Bearer token             | Console sessions, user auth  | Supabase Auth, short-lived tokens |
| Webhook signatures           | Event verification           | HMAC-SHA256, timestamp validation |

OIDC SSO is **configuration-gated** (Okta, Entra ID, Google Workspace env contracts). It is not operational until configured and validated per deployment. SAML is not asserted as GA in this repository path. SCIM directory sync is **not implemented** in application code (`pnpm run verify:scim-posture`).

## Audit logging

Every significant operation produces an audit log entry:

- Reconciliation runs (start, complete, fail)
- Exception state transitions (created, investigating, resolved, ignored)
- API key lifecycle (created, revoked)
- Data exports
- Configuration changes

Audit logs include: timestamp, actor ID, tenant ID, action, resource, and metadata.

**Verification evidence:**

- Audit log schema: [`prisma/schema.prisma`](../prisma/schema.prisma) (search for `AuditLog`)
- Audit log service: [`packages/api/src/services/`](../packages/api/src/services/)

## Data handling

### Data at rest

- PostgreSQL: Encrypted at rest (Supabase managed infrastructure or self-hosted with disk encryption)
- TigerBeetle: Data file integrity verified by the engine; encryption at rest via volume-level encryption
- Application-level encryption for sensitive fields using `ENCRYPTION_KEY`

### Data in transit

- All API traffic over TLS 1.2+
- Webhook payloads signed with HMAC-SHA256
- Internal service communication within private network

### Data retention

- Reconciliation data: Retained for the lifetime of the tenant account (configurable)
- Audit logs: Minimum 90-day retention (configurable, cannot be reduced below 90 days)
- Deleted data: Purged within 30 days of deletion request

### Data portability

Full data export is available at any time:

- Via API: `POST /api/v1/exports`
- Via CLI: `settler export --tenant <id>`
- Formats: CSV, JSON
- Includes: Runs, exceptions, evidence, audit logs

See: [`DATA_PORTABILITY.md`](../DATA_PORTABILITY.md)

## Privacy

- Settler is a data processor (not controller) for customer transaction data
- No transaction data is used for model training or shared across tenants
- Data Processing Agreement (DPA) available on request
- GDPR deletion requests handled within 30 days
- No data sub-processors beyond stated infrastructure providers

See: [`PRIVACY.md`](../PRIVACY.md), [`legal/DPA_TEMPLATE.md`](../legal/DPA_TEMPLATE.md)

## Infrastructure and deployment

### Managed (hosted)

- Hosted on Vercel (application) and Supabase (database)
- Infrastructure in US and EU regions
- Automated deployments from `main` branch with CI/CD gates

### Self-hosted

- Docker Compose deployment: [`packages/api/docker-compose.yml`](../packages/api/docker-compose.yml)
- Enterprise deployment: [`enterprise/docker-compose.yml`](../enterprise/docker-compose.yml)
- No phone-home telemetry in self-hosted mode

## CI/CD and release integrity

- 70+ CI/CD workflows enforcing quality gates
- All PRs require: lint, typecheck, build, test suite pass
- Release provenance workflow: [`.github/workflows/release-provenance.yml`](../.github/workflows/release-provenance.yml)
- Dependency management via Dependabot: [`.github/dependabot.yml`](../.github/dependabot.yml)

## Vulnerability management

- Security policy: [`SECURITY.md`](../SECURITY.md)
- Responsible disclosure via security@settler.io
- Dependency scanning via Dependabot and automated security workflows
- Security-focused CI workflows: [`.github/workflows/security.yml`](../.github/workflows/security.yml)

## Open source components

Settler uses a dual licensing model:

- **Core protocol** (`@settler/protocol`): MIT licensed — [LICENSE](../packages/protocol/LICENSE)
- **Platform** (API, Console, CLI): Proprietary — [LICENSE](../LICENSE)
- **React components** (`@settler/react-settler`): Dual licensed

Full dependency tree available via `pnpm ls --depth=0` or the SBOM generation workflow.

## Compliance readiness

| Framework        | Status                        | Evidence                                                                |
| ---------------- | ----------------------------- | ----------------------------------------------------------------------- |
| SOC 2 Type II    | In preparation                | [`docs/compliance/SOC2_PREPARATION.md`](compliance/SOC2_PREPARATION.md) |
| GDPR             | Operational controls in place | [`PRIVACY.md`](../PRIVACY.md), DPA template                             |
| Audit trail      | Implemented                   | Audit log system, evidence generation                                   |
| Data portability | Implemented                   | Export API, CLI, [`DATA_PORTABILITY.md`](../DATA_PORTABILITY.md)        |

## Procurement FAQ

**Q: Can we get a security questionnaire response?**
A: Yes. Contact sales@settler.io or your account manager. We maintain a pre-filled SIG Lite / CAIQ response pack.

**Q: Do you have a DPA?**
A: Yes. A template is available at [`legal/DPA_TEMPLATE.md`](../legal/DPA_TEMPLATE.md). Custom DPAs are available for enterprise agreements.

**Q: Can we run Settler in our own infrastructure?**
A: Yes. Self-hosted deployment is supported via Docker Compose. Enterprise deployment support is available.

**Q: What happens to our data if we stop using Settler?**
A: You can export all data at any time. After account closure, data is deleted within 30 days. See the [Teardown Guide](getting-started/teardown.md).

**Q: Do you have SOC 2?**
A: SOC 2 Type II certification is in preparation. Current security controls are documented in [`SECURITY.md`](../SECURITY.md) and [`SECURITY_INVARIANTS.md`](../SECURITY_INVARIANTS.md). The security architecture is described in [`docs/SECURITY_ARCHITECTURE.md`](SECURITY_ARCHITECTURE.md).

## Contact

- Security issues: security@settler.io
- Procurement questions: sales@settler.io
- Technical support: support@settler.io
- General: [SUPPORT.md](../SUPPORT.md)
