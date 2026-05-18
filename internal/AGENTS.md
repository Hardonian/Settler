# Settler – AGENTS.md

Status: **CANONICAL agent execution contract**  
Last updated: 2026-03-29

## 1) Mission and operating identity

Settler is a reconciliation-intelligence and exception/evidence operating system.

Agent work must optimize for:

- operator truth first
- canonical run/detail truth
- deterministic behavior
- explicit degraded states
- tenant isolation
- evidence before claims
- no silent contract drift
- moat-compounding outcomes over generic polish

## 2) Canonical instruction stack

Use these files first, in order:

1. `AGENTS.md` (this file)
2. `MODEL_SPEC.md`
3. `docs/repo-os/README.md`
4. `docs/repo-os/verification-matrix.md`
5. `docs/repo-os/checklists/implementation-pass.md`
6. `CONTRIBUTING.md`

When guidance conflicts, follow the higher-priority file and update lower-priority docs in the same pass.

## 3) Non-negotiables

- No theatre: do not claim proof you did not establish.
- No silent degraded behavior: degraded/fallback states must be explicit and machine-visible.
- No tenant leakage: protect against cross-tenant data, metadata, cache, and export bleed.
- No silent contract drift: routes, schemas, policy outputs, and evidence contracts must stay aligned.
- No vague pattern references: cite exact files/scripts/tests used as precedent.

## 4) Required execution loop (every meaningful pass)

1. Read impacted canonical docs and route/contract/security surfaces.
2. Classify work as **Maintenance**, **Leverage**, or **Moat**.
3. Implement the smallest safe change that improves system truth.
4. Run verification commands appropriate to impact (see `docs/repo-os/verification-matrix.md`).
5. Report evidence, residual risk, and next highest-leverage task.

## 5) Moat-aware default questions (major features)

- What reconciliation/policy/evidence knowledge compounds from real usage?
- What exception/adjudication history becomes reusable institutional memory?
- What raises workflow lock-in and switching cost?
- What improves proofpack quality and audit trust?
- What is hard to copy without accumulated historical data?

## 6) Verification expectations

At minimum for code changes: lint + typecheck + tests for touched surfaces.

Add route/security/tenant/replay/determinism verification when impacted.

Use exact commands from:

- `docs/repo-os/verification-matrix.md`
- root `package.json` scripts

## 7) Reporting contract

Use the report format in `docs/repo-os/checklists/implementation-pass.md`.

Each verification command must be listed with status icon:

- ✅ pass
- ⚠️ environment limitation / warning
- ❌ fail

## 8) Cursor Cloud specific instructions

### Services overview

| Service     | Port | Command                                     | Notes                               |
| ----------- | ---- | ------------------------------------------- | ----------------------------------- |
| Next.js Web | 3000 | `cd packages/web && pnpm run dev`           | Marketing site + Developer Console  |
| Express API | 4000 | `cd packages/api && PORT=4000 pnpm run dev` | Requires `.env.local` sourced first |
| PostgreSQL  | 5432 | System service                              | `sudo pg_ctlcluster 16 main start`  |

### Starting the dev stack

1. Start PostgreSQL: `sudo pg_ctlcluster 16 main start`
2. Source env vars: `set -a && source .env.local && set +a`
3. Start API: `cd packages/api && PORT=4000 pnpm run dev`
4. Start Web: `cd packages/web && pnpm run dev`

Or use `pnpm run dev:stack`.

### Non-obvious gotchas

- Prisma v7 requires `@prisma/adapter-pg` in `packages/api/src/infrastructure/db/prisma.ts`.
- API startup requires `.env.local` loaded first.
- Redis is optional; in-memory fallback is expected in local dev.
- TigerBeetle is optional by default (`TIGERBEETLE_ENABLED=false`).
- Production `pnpm build` can fail without Sentry credentials; dev mode is unaffected.
- Golden migration requires `analytics`, `auth`, and `app_private` schemas pre-created.
- Node.js `>=24.0.0 <25.0.0` is required.
- Husky pre-push runs `pnpm verify:fast`.
- `verify:fast`/`verify:full` profiles are defined in `scripts/verify-release.mjs`.

### Lint / Test / Build

- `pnpm lint`
- `pnpm test`
- `pnpm --filter @settler/api test`
- `pnpm --filter @settler/web test`
- `pnpm typecheck`
- `pnpm build`
