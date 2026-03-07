# Security Verification Surfaces

This repository uses layered verification for release confidence. Each layer proves different things.

## 1) Static/config verification

**Command:** `pnpm run verify:security`

What it proves:

- Expected code tokens (header names, function calls, middleware wiring) are present in specific files.
- Tenant-isolation guardrails (auth context, tenant scoping, rate limiting) are present on 5 selected high-risk `/api/v1/` routes.
- Production limiter backend configuration risk is surfaced (warning or failure, depending on policy).
- Reports runtime tenant-coverage status if runtime artifacts exist.

What it does **not** prove:

- Runtime exploitability.
- Full end-to-end tenant isolation under real credentials and fixtures by itself.
- End-to-end distributed limiter behavior across multiple instances.
- That unclassified routes are safe — only that they have not been evaluated.

## 2) Runtime security smoke + fixture-based tenant checks

**Commands:**

- `pnpm run verify:security:runtime`
- `pnpm --filter @settler/web exec jest src/__tests__/api/tenant-runtime-cross-tenant.test.ts --runInBand`

What they probe (live/runtime behavior):

- Security headers on `/api/v1/health`.
- Rate-limit activation semantics on `/api/v1/receipts` with repeated requests.
- Negative auth/tenant boundary on `/api/v1/runs` (expects unauthenticated denial).
- Cross-tenant denial on high-risk run endpoints (direct read, list non-enumerability, results/evidence access).

Behavior details:

- Runtime smoke can launch a local server (if built) or target `--baseUrl` / `SECURITY_SMOKE_BASE_URL`.
- Produces machine-readable output at `artifacts/security/runtime-smoke/<run-id>/summary.json`.
- Uses `passed` / `failed` / `skipped` with explicit reasons (e.g., missing build, route missing, assertion failed).

## 3) Dependency + supply-chain verification

**Command:** `pnpm run audit:deps`

Dependency audit policy modes (`SECURITY_AUDIT_MODE`):

- `strict` (default): fails on backend unavailability, scanner failures, or actionable findings.
- `warn`: permits pass with explicit warning outcome and machine-readable artifact trail.
- `off`: local-only bypass mode; hard-blocked in CI.

Policy state model:

- `pass`: audit executed and met threshold.
- `fail`: audit executed and exceeded threshold.
- `unavailable-hard`: audit unavailable and policy forbids soft skip.
- `unavailable-soft`: audit unavailable and explicit soft-skip policy is enabled.
- `misconfigured`: local auth/config issue (e.g., missing token) prevented audit and cannot be soft-skipped as availability.

Operational controls:

- `SECURITY_AUDIT_FAIL_LEVEL` controls fail threshold (default `high`).
- `SECURITY_AUDIT_ALLOW_UNAVAILABLE=1` permits soft-skip in non-release contexts.
- `SECURITY_AUDIT_CONTEXT=release` + `SECURITY_AUDIT_ALLOW_UNAVAILABLE_ON_RELEASE=1` is required for release-context soft-skip.
- Unavailability reason is explicitly classified (`endpoint_403`, `missing_auth`, `network_error`, `timeout`, `unsupported_environment`, `malformed_response`).

Artifacts:

- `artifacts/security/supply-chain/<run-id>/summary.json`
- `artifacts/security/supply-chain/<run-id>/audit.json`
- `artifacts/security/supply-chain/<run-id>/sbom.cyclonedx.json`
- `artifacts/security/supply-chain/<run-id>/sbom.spdx.json`

## 4) Release integration

`verify:release` validates security evidence via `verify:security:evidence` and carries forward audit state in verification summaries.

In CI (`release-verify` workflow):

- `security-supply-chain` job produces security artifacts.
- `verify-release` job downloads those artifacts and runs with `RELEASE_REQUIRE_SECURITY_EVIDENCE=1`.
- Soft-skip in release requires explicit workflow input (`allow_audit_soft_skip=true`); otherwise unavailable audit fails release.

## Redis-backed limiter guidance (production)

For multi-instance production deployments, Redis-backed limiter configuration is required for consistent enforcement:

- Required envs: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- If absent, limiter falls back to process-local memory. Each instance tracks independently — an attacker distributing requests across instances effectively multiplies their allowed rate by the instance count.
- To enforce strict policy in `verify:security`: set `REQUIRE_REDIS_RATE_LIMIT=1`.

### Failure semantics

| Scenario                                         | Behavior                                                               |
| ------------------------------------------------ | ---------------------------------------------------------------------- |
| Redis configured and healthy                     | Distributed rate limiting, shared counters                             |
| Redis configured but unavailable at request time | Silent fallback to process-local; one-time warning logged per process  |
| Redis not configured, local/dev                  | Process-local rate limiting (acceptable for single-instance dev)       |
| Redis not configured, production                 | Process-local fallback with startup warning; cross-instance drift risk |

### Operator actions

1. **Single-instance production (Vercel hobby):** Process-local limiting is acceptable. Limits reset on redeploy.
2. **Multi-instance production:** Configure Upstash Redis. Set `REQUIRE_REDIS_RATE_LIMIT=1` in CI env to enforce.
3. **Monitor:** If Redis becomes unavailable after startup, rate limiting silently degrades. Monitor for the `[RateLimit] Redis limiter unavailable in production` log message.

## 5) Security evidence pack + drift detection

**Command:** `pnpm run security:evidence`

Generated artifacts:

- `security/evidence/manifest.json`
- `security/evidence/route-registry.json`
- `security/evidence/tenant-coverage.json`
- `security/evidence/cross-tenant-results.json`
- `security/evidence/header-probe.json`
- `security/evidence/dependency-audit.json`
- `security/evidence/security-summary.md`

Drift checks compare the current run against `security/baseline/security-drift-baseline.json` for route totals, tenant coverage, header probe failures, and dependency audit outcome. Intentional baseline changes require `SECURITY_BASELINE_UPDATE=1`.
