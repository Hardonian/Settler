# REPO_TRUTH

Date: 2026-03-05
Branch: feat/100pt-audit-zero-remainder

## 1) Repo map (depth 4)

Command:

```bash
find . -maxdepth 4 -mindepth 1 | sed 's#^./##' | head -n 400
```

Result (excerpt): monorepo with `packages/web` (Next.js app), `packages/api` (Express API), shared SDK/packages, tests, scripts, and extensive docs.

Runtime boundaries identified:

- Web runtime: `packages/web` (Next.js App Router).
- API runtime: `packages/api` (Express server + v1 routes).
- SDK/runtime libs: `packages/sdk`, `packages/react-settler`, `packages/adapters`, `packages/types`, `packages/protocol`.
- Worker runtime: `packages/workhorse` (Python).

Build/test tooling identified:

- Workspace manager: pnpm workspaces.
- Task runner: Turborepo.
- TS compiler: TypeScript.
- Unit/integration tests: Jest + Vitest.
- E2E: Playwright.

CI/pipeline signals in repo:

- root scripts `verify`, `verify:routes`, `verify:boundaries`, `verify:oss`, `verify:security`.

## 2) Baseline runs (commands + outcomes)

### Install

```bash
pnpm install --frozen-lockfile
```

Outcome: pass.

### Lint

```bash
pnpm lint
```

Outcome: pass with warnings (no errors).

### Typecheck

```bash
pnpm typecheck
```

Outcome: pass.

### Test

```bash
pnpm test
```

Outcome: partial pass observed (all executed suites passing), but full workspace command was interrupted by long-running `@settler/web` build phase under turbo.

### Build

```bash
pnpm build
```

Outcome: partial pass observed for non-web packages and API; `@settler/web` Next.js production build entered long compile with no terminal completion in this environment window.

### Dev/prod start

Commands discovered:

- `pnpm dev`
- `pnpm --filter @settler/web dev`
- `pnpm --filter @settler/web start`

Not executed end-to-end in this pass due time consumed by workspace-wide build/test execution.

## 3) Public surfaces inventory

Command:

```bash
find packages/web/src/app -maxdepth 3 -type d | sed 's#^packages/web/src/app##' | sort
```

### Marketing routes

Examples:

- `/(marketing)`
- `/about`
- `/(marketing)/home`

### App routes

Examples:

- `/app/*`
- `/admin/*`
- `/console/*`

### API routes

Examples:

- `/api/v1/*`
- `/api/public/*`
- `/api/console/*`
- `/api/enterprise/*`
- `/api/stripe/*`

### Webhooks

- `/api/stripe/webhook`
- `/api/connectors/webhook`

### CLI commands

From root `package.json` scripts:

- `pnpm demo`
- `pnpm settler:replay ...`
- `pnpm verify:*` family
- `pnpm workhorse:*` family

## 4) Claims inventory (initial)

Primary claim source scanned: `README.md`.

Key claims and current evidence mapping:

- Deterministic platform claim -> mapped to `verify:determinism` script and determinism docs.
- OSS vs Enterprise boundary claim -> mapped to `verify:oss` and `verify:boundaries` scripts + boundary docs.
- Proof artifacts/replay claim -> mapped to demo + replay commands (`pnpm demo`, `pnpm settler:replay`).
- No-hard-500 aspiration -> mapped to existing error standardization tests in API and route verification scripts.

Where exact guarantees could not be fully re-verified in this run (notably full web build completion), audit language in follow-up docs has been downgraded to verified scope only.
