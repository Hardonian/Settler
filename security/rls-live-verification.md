# Live RLS Verification

Last updated: 2026-03-08

## Purpose

Provide an operational, deterministic path to prove live database RLS enforcement in addition to static policy checks.

## Entrypoints

- `pnpm run verify:rls:live` (runs `scripts/verify-rls-status.ts`)
- `node scripts/security/verify-rls-boundary.mjs` (captures proof level artifact and policy state)

## Required environment

At least one must be set:

- `DATABASE_URL`
- `DIRECT_URL`
- `SUPABASE_DB_URL`

Optional policy gate:

- `SECURITY_REQUIRE_LIVE_RLS=1` — fail if live DB verification cannot run or fails.

## Pass/fail semantics

- **pass** → artifact proof level `live-db-confirmed`
- **db configured + verifier fails** → `live-db-attempted-failed` (blocking)
- **db not configured + policy requires live proof** → `live-db-required-missing-config` (blocking)
- **db not configured + policy does not require live proof** → `static-only` boundary (non-proof of live DB)

## Artifact

- `artifacts/security/rls-verification-latest.json`

This artifact is consumed by `scripts/security-evidence.mjs` and surfaced in `security/evidence/security-summary.*`.
