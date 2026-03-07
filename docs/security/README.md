# Security and Reliability

## Buyer trust path (canonical)

1. Security posture: [`docs/SECURITY.md`](../SECURITY.md)
2. Access controls + tenancy: [`docs/ACCESS_CONTROLS.md`](../ACCESS_CONTROLS.md)
3. Incident response: [`docs/INCIDENT_RESPONSE.md`](../INCIDENT_RESPONSE.md)
4. RLS verification: [`docs/RLS_POLICY_VERIFICATION.md`](../RLS_POLICY_VERIFICATION.md)
5. Operational runbooks: [`docs/OPERATIONS_RUNBOOK.md`](../OPERATIONS_RUNBOOK.md)
6. Security verification surfaces: [`docs/security/VERIFICATION_SURFACES.md`](./VERIFICATION_SURFACES.md)
7. Production limiter guidance: [`docs/security/RATE_LIMITING_PRODUCTION.md`](./RATE_LIMITING_PRODUCTION.md)

## Security verification boundaries (no puffery)

- **Static/config verification (`pnpm run verify:security`)**
  - Verifies control and guardrail presence in high-risk files/routes.
  - Includes tenant-isolation guardrail presence checks for selected routes (static signal only).
  - Does **not** prove exploit resistance or full runtime isolation.
- **Runtime smoke verification (`pnpm run verify:security:runtime`)**
  - Starts/targets a real HTTP app instance and probes security headers, limiter behavior, and negative auth/tenant cases.
  - Distinguishes setup unavailability from assertion failures.
- **Dependency/supply-chain verification (`pnpm run verify:security:supply-chain`)**
  - Runs vulnerability scan (`pnpm audit`) and generates CycloneDX + SPDX SBOM (`npm sbom`).
  - Does **not** replace code-level SAST or live penetration testing.
- **Security evidence pack (`pnpm run security:evidence`)**
  - Produces portable route/tenant/runtime/header/dependency artifacts tied to commit SHA + timestamp.
  - Runs drift detection against security baseline to catch contract regressions.
- **Out of scope by design**
  - Full DAST, full SAST policy enforcement, and manual red-team exercises remain separate tracks.

## Available now vs designed for

- **Available now:** deterministic runs, evidence exports, operator review workflow, baseline auditability.
- **Designed for:** deeper enterprise governance and broader controls-plane expansion.
- **Future/experimental:** clearly marked in roadmap docs; do not present as shipped.

## Verification tiering

- **Pre-commit:** staged, low-memory checks only (format/lint + staged package lint guard).
- **Pre-push:** `verify:fast` for broader local confidence.
- **CI/Release:** `verify:release` + supply-chain evidence policy enforcement.

See `docs/release/VERIFICATION.md` and `docs/security/VERIFICATION_SURFACES.md` for exact policy semantics.
