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

## Tenant Isolation Guarantees

- Tenant-bound routes must enforce at least one isolation mechanism: explicit tenant scoping, tenant context injection, RLS-backed access, or tenant authorization checks.
- Route surface is discovered into `security/route-registry.json` and validated by `scripts/verify-tenant-coverage.ts`.
- Cross-tenant denial is validated by runtime tests (`test:cross-tenant`) and fails CI on regressions.

## Rate Limiting Design

- Settler applies route-level rate controls with tenant-aware context where available.
- Production can enforce distributed limiter presence via environment policy (`REQUIRE_REDIS_RATE_LIMIT=1`).
- Operator failure semantics: if distributed backing store is unavailable and strict enforcement is enabled, verification must fail before release.

## Authentication Flow

- API routes authenticate via API key and/or session-backed identity depending on route contract.
- Tokens and credentials are validated before tenant-scoped operations execute.
- Invalid, malformed, or expired credentials are rejected with non-2xx responses.

## Security Headers & CSP

Settler middleware applies hardened response headers including:

- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `Content-Security-Policy` (nonce-based script/style allowances, no `unsafe-eval`, no `unsafe-inline`)

## Dependency Security

- Dependency risk checks are executed via `pnpm run audit:deps`.
- High/critical production vulnerabilities are blocking.
- Triage notes and mitigation expectations are tracked in `security/vulnerability-triage.md`.

## Known Limitations

- Some public/health/admin/internal endpoints are intentionally exempt from tenant-scoping checks and validated under separate auth/public-route models.
- OSV scanner execution depends on binary availability in runtime image; CI remains authoritative for OSV enforcement when local binary is absent.
- Static guardrail verification confirms required controls are present in code; dynamic penetration-style validation is handled by runtime suites and smoke probes.

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
