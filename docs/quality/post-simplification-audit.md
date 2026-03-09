# Post-simplification Audit (Reality Pass)

Date: 2026-03-09
Branch: `feat/post-simplification-audit-stabilization`

## Scope

Audit performed across workspace contracts, onboarding command surfaces, repo-integrity, and high-signal docs after dependency pruning + monorepo simplification.

## Reality map

### Workspace/package graph

- Active Node workspaces are under `packages/*` with explicit excludes for non-Node SDKs and `workhorse`.
- Root scripts still reference a broad ecosystem, but onboarding-critical scripts (`bootstrap`, `doctor`, `demo`, `dev:stack`, `repo-integrity`) exist and resolve.

### Onboarding entrypoints

- `bootstrap`: installs deps, runs repo-integrity, then first-run doctor.
- `doctor`: grouped diagnostics; first-run mode intentionally softer than strict mode.
- `demo`: deterministic run + replay verification.
- `dev:stack`: starts `@settler/api` + `@settler/web`.

### Repo-integrity truth gate

- `pnpm run repo-integrity` passes and validates key monorepo contracts.
- Validation logic matches simplified workspace model and excludes non-Node folders explicitly.

## Findings

### Fixed in this pass

1. **Bootstrap/doctor first-run env drift**
   - `.env.local.example` previously left core runtime vars blank/invalid for first-run doctor + stack startup.
   - Added local-safe defaults for Supabase URL/keys, client mirror vars, `DATABASE_URL`, and valid 32-char `ENCRYPTION_KEY`.

2. **Missing workspace contract reference doc**
   - `docs/reference/workspace-contracts.md` was absent; added authoritative workspace contract page.

3. **Quickstart/README contract reconciliation**
   - Updated onboarding docs to clearly distinguish core local path vs optional integrations and strict diagnostics behavior.

### Residual drift/risk (not hidden)

1. **Strict doctor currently fails on hard-500 scan in user API routes.**
   - This is a real quality issue, not bypassed in this stabilization pass.

2. **`dev:stack` can still fail fast when runtime infrastructure is not available (DB/connectivity).**
   - Env contract now clearer, but infrastructure availability remains an external prerequisite.

3. **Historical docs still mention legacy/non-workspace surfaces in architecture/audit reports.**
   - Core onboarding/reference docs are reconciled; deeper historical docs need dedicated archival cleanup pass.

## Commands executed as evidence

- `pnpm run repo-integrity` ✅
- `pnpm run bootstrap` ✅
- `pnpm run doctor -- --skip-pipeline --first-run` ✅ (via bootstrap)
- `pnpm run doctor -- --skip-pipeline` ❌ (real strict-mode failures surfaced)
- `pnpm run demo` ✅
- `timeout 25s pnpm run dev:stack` ⚠️ (startup observed; terminated intentionally after validation window)
