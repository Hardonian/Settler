# Security Verification Surfaces

This repository uses layered verification for release confidence. Each layer proves different things.

## 1) Static/config verification

**Command:** `pnpm run verify:security`

What it proves:

- Required security control hooks are still present (headers, limiter hooks, middleware wiring).
- Tenant-isolation guardrails are present on selected high-risk routes.
- Production limiter backend configuration risk is surfaced (warning or failure, depending on policy).

What it does **not** prove:

- Runtime exploitability.
- End-to-end tenant isolation under real credentials and data fixtures.
- End-to-end distributed limiter behavior across multiple instances.

## 2) Runtime security smoke

**Command:** `pnpm run verify:security:runtime`

What it probes (live HTTP):

- Security headers on `/api/v1/health`.
- Rate-limit activation semantics on `/api/v1/receipts` with repeated requests.
- Negative auth/tenant boundary on `/api/v1/runs` (expects unauthenticated denial).

Behavior details:

- Can launch a local server (if built) or target `--baseUrl` / `SECURITY_SMOKE_BASE_URL`.
- Produces machine-readable output at `artifacts/security/runtime-smoke/<run-id>/summary.json`.
- Uses `passed` / `failed` / `skipped` with explicit reasons (e.g., missing build, route missing, assertion failed).

## 3) Dependency + supply-chain verification

**Command:** `pnpm run verify:security:supply-chain`

What it does:

- Runs dependency CVE scanning with `pnpm audit --json`.
- Fails on vulnerabilities at or above `SECURITY_AUDIT_FAIL_LEVEL` (default: `high`).
- If the registry audit endpoint is unavailable, run can soft-skip only when `SECURITY_AUDIT_ALLOW_UNAVAILABLE=1` (reason is recorded in summary).
- Generates SBOM outputs in:
  - CycloneDX (`sbom.cyclonedx.json`)
  - SPDX (`sbom.spdx.json`)

Artifacts:

- `artifacts/security/supply-chain/<run-id>/summary.json`
- `artifacts/security/supply-chain/<run-id>/audit.json`
- SBOM files listed above

## 4) Release integration

`verify:release` now validates security evidence via `verify:security:evidence`.

In CI (`release-verify` workflow):

- `security-supply-chain` job produces security artifacts.
- `verify-release` job downloads those artifacts and runs with `RELEASE_REQUIRE_SECURITY_EVIDENCE=1`.
- Release verification fails if supply-chain evidence is missing/invalid.

## Redis-backed limiter guidance (production)

For multi-instance production deployments, Redis-backed limiter configuration is strongly recommended:

- Required envs: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- If absent, limiter falls back to process-local memory and may drift across instances.
- To enforce strict policy in verification: set `REQUIRE_REDIS_RATE_LIMIT=1`.
