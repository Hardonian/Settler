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

- API route discovery is generated into `security/route-registry.json` by `pnpm run security:routes`.
- `pnpm run verify:tenant` performs **static control-presence verification** on tenant-bound API routes.
  - This check proves guardrail tokens are present.
  - This check does **not** prove runtime denial behavior by itself.
- Runtime denial behavior is validated by `pnpm run test:cross-tenant`, which is the enforcement proof for cross-tenant access denial.
- Exempt routes are explicit in the tenant coverage artifact (`artifacts/security/tenant-coverage-latest.json`) with route + reason.

## Rate Limiting Design

- Settler applies route-level rate controls with tenant-aware context where available.
- Production can enforce distributed limiter presence via environment policy (`REQUIRE_REDIS_RATE_LIMIT=1`).
- Operator failure semantics: if distributed backing store is unavailable and strict enforcement is enabled, verification must fail before release.

## Authentication Flow

- API routes authenticate via API key and/or session-backed identity depending on route contract.
- Tokens and credentials are validated before tenant-scoped operations execute.
- Invalid, malformed, or expired credentials are rejected with non-2xx responses.

## Security Headers & CSP

- Header/CSP contract verification runs through `pnpm run verify:security:headers`.
- The probe artifact explicitly records:
  - route probeability coverage,
  - degraded execution reasons (for example, server not startable),
  - failed checks with per-route diagnostics.
- Degraded header verification is blocking unless explicitly overridden with `SECURITY_HEADER_PROBE_ALLOW_DEGRADED=1`.
- Strict probe failure blocking can be enabled with `SECURITY_HEADER_PROBE_STRICT=1`.

## Dependency Security

- Dependency risk checks are executed via `pnpm run audit:deps`.
- Audit behavior is policy-controlled by `SECURITY_AUDIT_MODE=strict|warn|off`.
- CI forbids `SECURITY_AUDIT_MODE=off`.
- Dependency artifacts report completeness/degraded state explicitly (`artifacts/security/dependency-audit-latest.json`).
- Triage notes and mitigation expectations are tracked in `security/vulnerability-triage.md`.

## Evidence and Drift Verification

- `pnpm run security:evidence` generates `security/evidence/manifest.json`, `security/evidence/security-summary.md`, and `security/evidence/security-summary.json`.
- Evidence manifest includes commit SHA, timestamp, CI run id (if available), policy modes, required artifact presence, and checksums.
- `pnpm run verify:security:drift` fails when security surface or policy outcomes drift from baseline and reports actionable route/exemption/audit deltas.

## Known Limitations

- Tenant coverage verification is static token-based guardrail presence. Runtime denial proof is provided by dedicated runtime suites.
- Some routes are intentionally exempt from tenant-scoping checks and require separate auth model review.
- OSV scanner execution depends on binary availability in runtime image; degraded/partial scanner states are explicitly recorded in artifacts.
- Header/CSP probe coverage excludes dynamic API routes (`[param]`) unless a concrete probe target is supplied.

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
