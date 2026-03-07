# Security Policy

## Reporting a Vulnerability

If you believe you have found a security issue, report it responsibly.

- **Email:** security@settler.dev
- **Include:** impact, reproduction steps, affected scope, and suggested mitigations.

## Supported Versions

Security fixes are prioritized on the active default branch and currently supported release lines.

## Security Model

Settler is a multi-tenant system with layered controls:

1. **Authentication and identity extraction** at API boundary.
2. **Tenant context propagation** into route handlers and data queries.
3. **Tenant-scoped persistence access** (tenant filters and RLS-backed controls where configured).
4. **Security middleware controls** (headers, request identifiers, rate limiting).
5. **Continuous verification in CI** for tenant coverage, runtime cross-tenant denial, and dependency risk.

## Tenant Isolation Model

Settler enforces tenant isolation through layered controls:

- **Static token check:** every route file that serves tenant data must contain a recognized isolation control token (e.g. `buildContext(`, `tenantId`, `authenticateApiKey(`). This is verified by `scripts/verify-tenant-coverage.ts` and gates CI.
- **High-risk route classification:** a subset of routes with the highest isolation risk are individually reviewed and checked for specific guardrail patterns via `scripts/security/tenant-guardrails.mjs`.
- **Route surface coverage gap:** `scripts/verify-security.mjs` surfaces any routes that are neither individually classified nor in the known-exempt prefix set. These are gated by the static token check but warrant case-by-case review when the count changes.
- **Cross-tenant runtime denial:** the `test:cross-tenant` fixture suite asserts that cross-tenant API calls are rejected. This runs in CI and fails the build on regression.

**What is not guaranteed by these controls alone:** static token presence does not prove correct runtime scoping. A token appearing in a file could be in dead code, a comment, or a branch that does not cover all code paths. Runtime tests provide stronger but not exhaustive assurance.

## Rate Limiting Design

- Settler applies route-level rate controls with tenant-aware context where available.
- A process-local fallback limiter is active by default; this may drift across multiple server instances in production.
- To enforce distributed rate limiting, set `REQUIRE_REDIS_RATE_LIMIT=1` and provision `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`. If enforcement is required and Redis is absent, release verification must fail.

## Authentication Flow

- API routes authenticate via API key and/or session-backed identity depending on route contract.
- Tokens and credentials are validated before tenant-scoped operations execute.
- Invalid, malformed, or expired credentials are rejected with non-2xx responses.

## Security Headers & CSP

Settler middleware applies hardened response headers on all responses:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (camera, microphone, geolocation restricted)
- `Content-Security-Policy` (nonce-based script/style allowances; no `unsafe-eval`, no `unsafe-inline`)
- `Strict-Transport-Security` (applied on HTTPS responses; not sent on HTTP in local development by design)

Note: CSP enforcement mode and header completeness on framework-generated error pages (e.g. Next.js 500, edge runtime errors) is not fully verified by automated probes. These paths are considered best-effort rather than enforced guarantees.

## Dependency Security

- Dependency risk checks are executed via `pnpm run audit:deps`.
- High/critical production vulnerabilities are blocking in `strict` mode (the CI default).
- If the npm audit registry endpoint is unavailable (network restriction or registry auth), the outcome is recorded as `unavailable-hard` (strict) or `unavailable-soft` (warn mode), not as a clean pass.
- Triage notes and mitigation expectations are tracked in `security/vulnerability-triage.md`.

## Known Limitations

- **Admin and internal route exemption:** routes under `/api/admin/`, `/api/cron/`, and `/api/internal/` are exempt from tenant-scoping checks. These routes are expected to enforce their own authentication model. They are not individually verified by the automated tenant coverage system.
- **Coverage gap:** not every API route has been individually reviewed in the high-risk classification system. The coverage gap is surfaced by `pnpm run verify:security` and should be reviewed when it changes.
- **OSV scanner is optional locally:** OSV scanner execution depends on binary availability in the runtime image; CI remains authoritative for OSV enforcement when the local binary is absent.
- **Static checks are not dynamic proof:** guardrail verification confirms required control tokens are present in source; it does not prove runtime execution correctness. Dynamic proof requires runtime tests and periodic manual review.
- **RLS enforcement requires a live database test:** Row-Level Security policies are validated by integration tests (`RUN_DB_TESTS=true`) that require a live database connection. Static analysis does not verify RLS enforcement.

## Incident Handling

- Triage severity based on tenant impact, exploitability, and data exposure.
- Contain, remediate, and communicate with affected stakeholders.
- Publish post-incident corrective actions for material incidents.

## Safe Disclosure

Please do not publicly disclose vulnerabilities before remediation is available.

## Disclosure and Response Expectations

- Initial acknowledgement target: **72 hours**.
- Severity triage target: **5 business days**.
- Coordinated remediation and disclosure timeline is shared with reporter after validation.
