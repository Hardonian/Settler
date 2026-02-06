# AGENTS.md — Operating Manual for AI Agents

## 1. Purpose

Settler is a **reconciliation-as-a-service** platform that provides:

- **Multi-tenant API** for deterministic financial record matching
- **Next.js web console** for operational visibility and admin workflows
- **Background job processing** via JobForge (Node.js) and Workhorse (Python)
- **SDKs** in TypeScript, Python, Go, Ruby, C#, Java
- **Adapters** for Stripe, Shopify, PayPal, and extensible integration points

**Target users:** Engineers building reconciliation pipelines, fintech operators running internal finance ops, contributors extending adapters/SDKs.

**"Done" means:**

- All lint, typecheck, and build commands pass
- Tests execute without regression
- Documentation reflects actual behavior (verified via `pnpm run verify:docs`)
- No secrets committed, no broken imports, tenant isolation preserved

## 2. Repo Map (Practical)

### Key Directories

| Directory             | Purpose                                          |
| --------------------- | ------------------------------------------------ |
| `packages/api`        | Reconciliation API server (Express + TypeScript) |
| `packages/web`        | Next.js console application                      |
| `packages/adapters`   | Integration adapters (Stripe, Shopify, PayPal)   |
| `packages/jobforge-*` | Job queue infrastructure (8 packages)            |
| `packages/workhorse`  | Python worker for batch processing               |
| `packages/sdk-*`      | Language SDKs (TS, Python, Go, Ruby, C#, Java)   |
| `packages/types`      | Shared TypeScript types                          |
| `packages/protocol`   | Protocol definitions                             |
| `design-system/`      | Design tokens (`tokens.json`)                    |
| `scripts/`            | Utility scripts for migration, validation, QA    |
| `tests/e2e/`          | Playwright E2E tests                             |
| `docs/`               | Extensive documentation (400+ files)             |

### Sources of Truth

- **Content:** `app/` (Next.js App Router), `docs/`, `marketing/`
- **Components:** `packages/web/src/components/`, `packages/react-settler/`
- **Config:** `package.json`, `turbo.json`, `eslint.config.js`, `.eslintrc.js`
- **Tokens/Styles:** `design-system/tokens.json` (colors, typography, spacing, semantics)
- **Tests:** `tests/e2e/` (Playwright), `packages/*/src/__tests__/` (Jest)

## 3. Golden Rules (Invariants)

### Security & Privacy

- Never commit secrets, API keys, or credentials. Use `.env.example` for templates.
- Respect tenant isolation: RLS policies and tenant-scoped queries must remain intact.
- Service-role credentials and database URLs are high-privilege secrets.

### Data Integrity

- Reconciliation logic must remain **deterministic**—no hidden side effects.
- Error responses must follow the canonical envelope: `{ code, message, traceId, retryable }`.

### Operational Safety

- No hard 500 routes; always return graceful fallbacks with proper error codes.
- Background jobs must follow retry rules defined in JobForge configuration.

### Code Quality

- Minimal diffs: avoid refactors unless explicitly requested.
- Keep lint/typecheck/build green at all times.
- Documentation must match repository state (verified via `pnpm run verify:docs`).

### Build Determinism

- Use turbo for incremental builds; cache is critical for CI performance.
- Environment variables are strictly enumerated in `turbo.json`—don't add new ones without updating the config.

## 4. Agent Workflow

### Discover → Diagnose → Implement → Verify → Report

**Discover:** Understand the scope by reading relevant package `package.json`, `README.md`, and any linked docs in `docs/`.

**Diagnose:** Before making changes:

- Run `pnpm run verify:fast` to establish baseline
- Check `turbo.json` for task dependencies
- Review `.eslintrc.js` for boundary enforcement rules
- Identify affected packages via `turbo run build --dry-run`

**Implement:**

- Make the smallest safe patch possible
- Prefer targeted fixes over broad refactors
- Use workspace dependencies (`workspace:*`)—never import from `packages/*/src` directly

**Verify:**

- Execute the change safety checklist (Section 6)
- Run domain-specific tests (e.g., `pnpm run test:e2e:reality` for UI changes)
- Validate docs with `pnpm run verify:docs`

**Report:** Summarize files changed, verification commands run, and any known limitations.

## 5. Command Cookbook

### Core Commands

| Command              | Purpose                   | Notes                           |
| -------------------- | ------------------------- | ------------------------------- |
| `pnpm install`       | Install dependencies      | Required before any work        |
| `pnpm run dev`       | Start development servers | Turbo orchestrates packages     |
| `pnpm run build`     | Build all packages        | Uses turbo caching              |
| `pnpm run lint`      | Lint all packages         | Enforces boundary rules         |
| `pnpm run typecheck` | Type-check all packages   | Generates buildinfo for caching |
| `pnpm run test`      | Run Jest tests            | Requires build first            |
| `pnpm run test:e2e`  | Run Playwright E2E tests  | Requires dev server             |

### Verification Commands

| Command                 | Purpose                                      |
| ----------------------- | -------------------------------------------- |
| `pnpm run verify:fast`  | Lint + typecheck (pre-commit)                |
| `pnpm run verify:full`  | Full verification including build (pre-push) |
| `pnpm run verify:docs`  | Validate docs reality                        |
| `pnpm run validate:all` | Lint + typecheck + format check              |

### Package-Specific Commands

| Command                          | Purpose               |
| -------------------------------- | --------------------- |
| `pnpm --filter @settler/web dev` | Start Next.js console |
| `pnpm --filter @settler/api dev` | Start API server      |
| `pnpm run workhorse:lint`        | Lint Python worker    |
| `pnpm run workhorse:test`        | Test Python worker    |

### Database Commands

| Command                    | Purpose                      |
| -------------------------- | ---------------------------- |
| `pnpm run db:push`         | Push Prisma schema           |
| `pnpm run db:migrate:prod` | Run migrations on production |

**Note:** Commands are defined in `package.json`. Always verify with `grep` if unsure.

## 6. Change Safety Checklist

Before committing:

- [ ] **Lint passes:** `pnpm run lint` (or `pnpm run lint:fix` to auto-fix)
- [ ] **Typecheck passes:** `pnpm run typecheck`
- [ ] **Build passes:** `pnpm run build`
- [ ] **Smoke test:** For UI changes, run `pnpm run qa:smoke`
- [ ] **No dead imports:** Verify with `pnpm run verify:skip-build`
- [ ] **No unused files:** Review diff for accidentally added files
- [ ] **Token drift:** If touching UI, verify `design-system/tokens.json` consistency
- [ ] **Docs updated:** Run `pnpm run verify:docs` to catch drift

## 7. Code Standards

### TypeScript Conventions

- Strict typing: avoid `any` where possible
- Named exports preferred for components and utilities
- Error envelopes follow schema: `{ code: string, message: string, traceId: string, retryable: boolean }`

### ESLint & Boundary Enforcement

- `.eslintrc.js` enforces monorepo boundaries
- **Rule:** Never import from `packages/*/src`—use workspace dependencies
- Example violation: `import { foo } from '../../api/src/routes'` (blocked)

### Component Patterns (Next.js)

- Use App Router (`app/` directory)
- Prefer Server Components where possible
- Client components marked with `'use client'`
- Error boundaries for graceful degradation

### Error Handling

- Centralized error handling in `packages/api/src/errors/`
- Structured logging via Winston
- Sentry integration for observability

### Environment Variables

- **Location:** `.env.example` (template), `.env.local` (local overrides)
- **Validation:** Scripts in `scripts/validate-typed-env.ts`
- **Enumeration:** All envs for builds are listed in `turbo.json` under each task

## 8. PR / Commit Standards

### Branch Naming

- `feature/*` — New features
- `fix/*` — Bug fixes
- `chore/*` — Maintenance (docs, deps, config)
- `refactor/*` — Code restructuring without behavior change

### Commit Message Style

```
<type>(<scope>): <subject>

<body (optional)>

<footer (optional)>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples from this repo:

```
feat(api): add idempotency middleware
fix(web): resolve token drift in buttons
docs(readme): update quickstart steps
```

### PR Expectations

- PR template located in `.github/PULL_REQUEST_TEMPLATE.md` (if present)
- Description must include:
  - **Root cause** of the change
  - **Files changed** (list)
  - **Verification steps** (commands run)

## 9. Roadmap Hooks (Agent-Ready Backlog)

These are actionable, repo-specific improvements aligned with current direction:

1. **SDK Python type parity** — Address typecheck issues flagged in `33884e19`
2. **Token centralization audit** — Complete migration of hardcoded colors to `design-system/tokens.json`
3. **Import boundary enforcement** — Expand ESLint rules to cover new packages as they're added
4. **CI gate hardening** — Add `verify:docs` to pre-commit hooks via Husky
5. **Workhorse test coverage** — Expand Python test suite beyond smoke tests
6. **DOM Reality enforcement** — Complete rollout of `dom-reality-*` tests across all routes
7. **Webhook idempotency docs** — Finalize `docs/WEBHOOK_IDEMPOTENCY.md` implementation
8. **Performance hot-path audit** — Continue work from `d4f03082` on multiplier table optimization
9. **Migration safety checks** — Enhance `migration-guardian.yml` workflow
10. **Visual regression baseline refresh** — Update Playwright snapshots after UI updates

---

**For questions:** See `docs/OPERATIONS.md` or `CONTRIBUTING.md`

## 10. Safe-to-Edit Map (Guardrails)

**Safe zones (preferred for changes):**

- `packages/web/src/app/` (UI + route handlers)
- `packages/api/src/` (API logic and middleware)
- `scripts/` (automation, verification, QA)
- `docs/` (documentation)

**High-risk zones (extra caution):**

- `supabase/` and `prisma/` migrations
- `packages/*/src/__tests__/` (test correctness gates)
- `.github/workflows/` (CI gate behavior)

## 11. Standard Command Canon (Copy/Paste)

- Install: `pnpm install`
- Lint: `pnpm run lint`
- Typecheck: `pnpm run typecheck`
- Tests: `pnpm run test`
- E2E: `pnpm run test:e2e`
- Build: `pnpm run build`
- Docs reality: `pnpm run verify:docs`
