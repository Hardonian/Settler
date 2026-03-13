# External Env/Runtime Proof (Live Access Pass)

Date: 2026-03-13
Branch: work

## Scope

This pass validated the external-readiness path from repo contract to runtime boundaries using only evidence available in this environment.

## Phase 0 — Precheck

Validated:

- `config/env.required.json` contract exists and still declares required groups (`supabase-url`, `supabase-anon`, `database-url`, `service-role`).
- root scripts `verify:env:required`, `verify:env:parity`, `verify:env:trace`, `verify:launch:readiness`, and `audit:migrations` are present.
- prior repo-generated artifacts remain in place (`docs/verification/env-resolution-audit.md`, `docs/verification/migration-audit.md`).

## Phase 1 — Doppler local proof

### Runtime install attempt (explicit)

Attempted to install CLI tooling in this runtime before proof execution:

- `npm install -g vercel@latest` → `403 Forbidden` from `https://registry.npmjs.org/vercel`
- `npx -y vercel --version` → same registry `403 Forbidden`
- `curl -fsSL https://cli.doppler.com/install.sh` → `403` from network proxy
- `apt-get update` (to explore distro package path) → multiple `403 Forbidden` repository failures

Result: CLI installation is blocked by outbound package/network policy in this environment, not by repo code.

### Contract checks without Doppler injection

- Doppler CLI is not installed in this execution environment, so `doppler run -- ...` could not be executed.
- Ran non-Doppler contract checks directly:
  - `pnpm run verify:env:required` → all required groups unresolved (no injected env)
  - `pnpm run verify:env:parity` → unresolved required groups
  - `pnpm run verify:env:trace` → env absent in root process, child node process, and `pnpm exec` subprocess

### Repo-side boundary hardening fix

- `turbo.json` now allowlists all tracked contract variables used by trace tooling, including `DIRECT_URL`, `SUPABASE_DB_URL`, `VERCEL_ENV`, `VERCEL_URL`, `VERCEL_GIT_COMMIT_SHA`, and `DOPPLER_TOKEN` across `build`/`dev`/`test`/`typecheck` tasks.
- Post-fix trace confirms Turbo allowlist coverage for every tracked key.

## Phase 2 — Vercel parity proof

- Vercel CLI is unavailable due installation-blocking network policy; no authenticated project/preview/prod env metadata could be pulled.
- Repo-side Vercel parity checks executed:
  - `pnpm run vercel:parity` passed for command-chain parity.
  - `pnpm run verify:vercel-runtime-parity` passed for framework/runtime invariants.
- External scope/name parity against real Vercel environment variables remains unproven due missing CLI/auth context.

## Phase 3 — Live DB + migration truth

- No DB credentials were present in environment (`DATABASE_URL`, `SUPABASE_*` unset in this shell).
- `pnpm run db:check` confirms no remote DSN configuration and cannot connect.
- Live `_prisma_migrations` inspection is therefore unproven in this environment.
- Repository-only migration audit remains available via `pnpm run audit:migrations`.

## Phase 4 — Repo-side gaps closed

Applied smallest safe fix:

- Expanded Turbo task env allowlists to avoid losing required/aliased contract vars across Turbo task boundaries.

No destructive schema or migration changes were made.

## Phase 5 — Verification summary

Executed in this pass:

- `pnpm run verify:env:required` (fails without external env injection)
- `pnpm run verify:env:parity` (fails without external env injection)
- `pnpm run verify:env:trace` (passes; shows missing env and Turbo allowlist state)
- `pnpm run verify:launch:readiness` (fails at setup due missing env)
- `pnpm run audit:migrations` (passes; regenerates repo migration audit)
- `pnpm run vercel:parity` (passes)
- `pnpm run verify:vercel-runtime-parity` (passes)
- `pnpm run db:check` (fails; no DB DSN configured)

## Verdict

**B — repo ready pending external configuration**, with one repo-side pass-through defect fixed.

External blockers that remain:

1. Outbound network/package policy blocks installing Doppler and Vercel CLIs in this runtime.
2. Vercel project auth/metadata cannot be queried without the CLI and credentials.
3. Live DB credentials unavailable (cannot inspect `_prisma_migrations` truth or confirm applied migration state).
