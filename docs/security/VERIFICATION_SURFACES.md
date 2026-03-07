# Security Verification Surfaces

This repository uses layered verification for release confidence. Each layer proves different things.

## 1) Static/config verification

**Command:** `pnpm run verify:security`

What it proves:

- Expected code tokens (header names, function calls, middleware wiring) are present in specific files.
- Tenant-isolation guardrails (auth context, tenant scoping, rate limiting) are present on 5 selected high-risk `/api/v1/` routes.
- Production limiter backend configuration risk is surfaced (warning or failure, depending on policy).
- Route coverage gap is reported (how many routes are checked vs total discovered).

What it does **not** prove:

- That the detected tokens are correctly implemented or reachable at runtime.
- End-to-end tenant isolation under real credentials and data fixtures.
- End-to-end distributed limiter behavior across multiple instances.
- That unclassified routes are safe — only that they have not been evaluated.

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

For multi-instance production deployments, Redis-backed limiter configuration is required for consistent enforcement:

- Required envs: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- If absent, limiter falls back to process-local memory. Each instance tracks independently — an attacker distributing requests across instances effectively multiplies their allowed rate by the instance count.
- To enforce strict policy in `verify:security`: set `REQUIRE_REDIS_RATE_LIMIT=1`.

### Failure semantics

| Scenario | Behavior |
|---|---|
| Redis configured and healthy | Distributed rate limiting, shared counters |
| Redis configured but unavailable at request time | Silent fallback to process-local; one-time warning logged per process |
| Redis not configured, local/dev | Process-local rate limiting (acceptable for single-instance dev) |
| Redis not configured, production | Process-local fallback with startup warning; cross-instance drift risk |

### Operator actions

1. **Single-instance production (Vercel hobby):** Process-local limiting is acceptable. Limits reset on redeploy.
2. **Multi-instance production:** Configure Upstash Redis. Set `REQUIRE_REDIS_RATE_LIMIT=1` in CI env to enforce.
3. **Monitor:** If Redis becomes unavailable after startup, rate limiting silently degrades. Monitor for the `[RateLimit] Redis limiter unavailable in production` log message.
