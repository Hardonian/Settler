# Release Threat Assessment (OWASP Top 10)

This assessment is release-focused and maps primary controls to OWASP Top 10 (2021) categories. It is intended as an operator checklist, not a substitute for periodic full penetration testing.

## Control baseline checked in release verification

`pnpm run verify:security` validates that key controls are present in code paths for:

- request authentication + tenant scoping,
- rate limiting (in-memory and Redis-backed paths),
- cache-control and conditional request handling,
- security response headers,
- webhook signature-safe handling, and
- OWASP hardening documentation continuity.

## OWASP Top 10 mapping

| OWASP Category                               | Current control posture                                                                  | Primary code/doc anchors                                                              |
| -------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| A01 Broken Access Control                    | Tenant-scoped API auth and explicit unauthorized responses.                              | `packages/web/src/lib/api/v1/recon/core.ts`, `packages/api/src/routes/tenant-data.ts` |
| A02 Cryptographic Failures                   | Signed webhook verification and deterministic hashing for integrity checks.              | `packages/api/src/routes/webhooks.ts`, `launch/assets-manifest.json`                  |
| A03 Injection                                | Schema validation and strict input parsing in critical routes.                           | `packages/web/src/lib/api/v1/recon/core.ts`, `packages/api/src/routes/*.ts`           |
| A04 Insecure Design                          | Problem+json failure contracts and defensive fail-closed handlers in verification paths. | `packages/web/src/lib/api/v1/recon/core.ts`, `scripts/verify-release.mjs`             |
| A05 Security Misconfiguration                | Security headers and release-time security control verification.                         | `packages/web/src/lib/security/headers.ts`, `scripts/verify-security.mjs`             |
| A06 Vulnerable/Outdated Components           | Locked dependency graph + release verification gate in CI.                               | `pnpm-lock.yaml`, `.github/workflows/release-verify.yml`                              |
| A07 Identification & Authentication Failures | API key auth checks and explicit auth-required problems.                                 | `packages/web/src/lib/api/v1/recon/core.ts`                                           |
| A08 Software & Data Integrity Failures       | SHA256 launch manifest verification and artifact verification stage.                     | `scripts/verify-launch-assets.mjs`, `scripts/verify-launch-artifacts.mjs`             |
| A09 Security Logging & Monitoring Failures   | Stage logs and verification summary artifacts captured in CI uploads.                    | `scripts/verify-release.mjs`, `.github/workflows/release-verify.yml`                  |
| A10 SSRF                                     | SSRF protections and route-level security checks in API codebase.                        | `packages/api/src/infrastructure/security/SSRFProtection.ts`                          |

## Residual risk notes

- Primary screenshot capture is environment-sensitive (browser runtime dependency). Release verification mitigates this with deterministic fallback + mandatory artifact verification.
- In-memory rate limiting remains process-local by design for local/dev fallback; distributed enforcement should use Redis-backed limiter in horizontally scaled deployments.

## Operator action before public release

1. Run `pnpm run verify:release -- --run-id=<id>`.
2. Confirm `artifacts/verification/<id>/summary.json` reports `passed: true`.
3. Confirm launch artifact manifest exists and `pnpm run verify:artifacts` succeeds.
4. Upload verification artifacts for review in release PR/workflow.
