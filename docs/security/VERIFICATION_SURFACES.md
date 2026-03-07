# Security Verification Surfaces

This repository uses layered verification for release confidence. Each layer proves different things.

## 1) Static/config verification

**Command:** `pnpm run verify:security`

What it proves:

- Required security control hooks are still present (headers, limiter hooks, middleware wiring).
- Tenant-isolation guardrails are present on selected high-risk routes.
- Production limiter backend configuration risk is surfaced (warning or failure, depending on policy).
- Reports runtime tenant-coverage status if runtime artifacts exist.

What it does **not** prove:

- Runtime exploitability.
- Full end-to-end tenant isolation under real credentials and fixtures by itself.
- End-to-end distributed limiter behavior across multiple instances.

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

**Command:** `pnpm run verify:security:supply-chain`

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

For multi-instance production deployments, Redis-backed limiter configuration is strongly recommended:

- Required envs: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- If absent, limiter falls back to process-local memory and may drift across instances.
- To enforce strict policy in verification: set `REQUIRE_REDIS_RATE_LIMIT=1`.
