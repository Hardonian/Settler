# SKILLS.md — Capability Map & Future Work Guide

## 1. How to Use This File

Use this document to route tasks to the right agent, model, or tooling within the Settler monorepo. It maps work types to recommended approaches and identifies gaps that need addressing. Agents should reference this file before starting work to understand what's available, what's risky, and what's planned.

## 2. Current Capability Inventory

### UI/Frontend

| Capability                | Detected | Notes                                                                   |
| ------------------------- | -------- | ----------------------------------------------------------------------- |
| Next.js 16 App Router     | Yes      | `packages/web` uses App Router with Server Components                   |
| Design tokens             | Yes      | `design-system/tokens.json` with colors, typography, spacing, semantics |
| Tailwind CSS              | Yes      | Configured in `packages/web`                                            |
| Component library         | Partial  | `packages/react-settler` exists, some Radix UI primitives               |
| Visual regression testing | Yes      | Playwright with 4 viewport projects (mobile/tablet/desktop light/dark)  |
| DOM Reality enforcement   | Yes      | `tests/e2e/dom-reality-*.spec.ts` - anti-flakiness tests                |

### Content System

| Capability           | Detected  | Notes                                                             |
| -------------------- | --------- | ----------------------------------------------------------------- |
| MDX support          | Yes       | `@next/mdx` configured, `docs/` uses markdown                     |
| Copy locations       | Scattered | UI copy in components, docs in `docs/`, marketing in `marketing/` |
| Microcopy guidelines | Yes       | `docs/microcopy-guidelines.md` exists                             |
| Content audit        | Yes       | `docs/content_audit.md` exists                                    |

### Tooling

| Capability | Detected | Notes                                            |
| ---------- | -------- | ------------------------------------------------ |
| Linting    | Yes      | ESLint + custom boundary rules in `.eslintrc.js` |
| TypeScript | Yes      | Multi-project config, turbo caching              |
| Prettier   | Yes      | Format on save, enforced in CI                   |
| Turborepo  | Yes      | `turbo.json` with cached builds                  |
| Jest       | Yes      | Unit tests in packages                           |
| Playwright | Yes      | E2E + visual + DOM Reality tests                 |

### CI/CD

| Capability         | Detected | Notes                                             |
| ------------------ | -------- | ------------------------------------------------- |
| GitHub Actions     | Yes      | 50+ workflows in `.github/workflows/`             |
| Vercel deployment  | Yes      | `vercel.json` configured                          |
| Build verification | Yes      | `scripts/verify-build-setup.sh`, migration guards |
| Security scanning  | Yes      | `security.yml` workflow                           |

### Observability

| Capability    | Detected | Notes                                                        |
| ------------- | -------- | ------------------------------------------------------------ |
| Sentry        | Yes      | Both Node.js (`@sentry/node`) and Next.js (`@sentry/nextjs`) |
| OpenTelemetry | Yes      | `packages/api` has full OTEL instrumentation                 |
| Logging       | Yes      | Winston logger, structured logging in API                    |
| Metrics       | Yes      | Prometheus client in API                                     |

## 3. Skill Lanes

### Lane 1: Product/UX Writing

**Where it happens:** `packages/web/src/app/`, `docs/`, `marketing/`
**Tone:** Enterprise-safe, consultancy-grade, deterministic language
**Examples:**

- Writing new dashboard copy that matches existing patterns
- Updating error messages to include traceIds
- Adding inline documentation for new API endpoints
- Reviewing marketing pages for consistency with core product

### Lane 2: UI System Work

**Where it happens:** `design-system/tokens.json`, `packages/web/src/components/`
**Constraints:** Must reference `design-system/tokens.json` for any color/spacing decisions
**Examples:**

- Adding new semantic tokens for new UI states
- Creating accessible components following existing patterns
- Fixing token drift (hardcoded colors vs token references)
- Updating visual regression baselines after intentional design changes

### Lane 3: Frontend Engineering

**Where it happens:** `packages/web/src/app/`, `packages/web/src/components/`, `packages/react-settler/`
**Patterns:** Server Components by default, `'use client'` for interactivity
**Examples:**

- Adding new routes following App Router conventions
- Implementing error boundaries with graceful degradation
- Integrating API clients with React Query
- Fixing hydration mismatches

### Lane 4: API/Backend Engineering

**Where it happens:** `packages/api/src/`
**Patterns:** Express server, domain/application/infrastructure layered architecture
**Examples:**

- Adding new reconciliation endpoints
- Implementing idempotency for webhooks
- Fixing tenant isolation issues
- Performance optimization of hot paths

### Lane 5: Integration Boundaries

**Where it happens:** `packages/adapters/`, `packages/sdk-*`, `packages/protocol/`
**Constraints:** ESLint prevents direct `packages/*/src` imports—use workspace:\* dependencies
**Examples:**

- Adding new adapter (Stripe, Shopify, PayPal patterns)
- Updating SDKs after API changes
- Modifying protocol definitions
- Ensuring SDK-API contract parity

### Lane 6: Background Jobs

**Where it happens:** `packages/jobforge-*`, `packages/workhorse/`, `packages/api/src/jobs/`
**Patterns:** JobForge for Node.js jobs, Workhorse (Python) for batch processing
**Examples:**

- Adding new job types
- Configuring retry rules
- Fixing job queue connectivity
- Extending tenant cache invalidation

### Lane 7: QA & Release

**Where it happens:** `tests/e2e/`, `scripts/qa-*.ts`, GitHub workflows
**Patterns:** Playwright for E2E, DOM Reality tests for anti-flakiness
**Examples:**

- Writing new E2E tests
- Running visual regression suite
- Executing tenant isolation verification
- Performing smoke tests before release

## 4. Which Agent for Which Task

| Task Type                                | Recommended Approach                       | Validation                                              |
| ---------------------------------------- | ------------------------------------------ | ------------------------------------------------------- |
| Copy hardening (error messages, UI text) | LLM pass → human skim for accuracy         | Consistency scan against `docs/microcopy-guidelines.md` |
| Token system changes (colors, spacing)   | Engineer agent only                        | Visual diff + `pnpm run lint` + `pnpm run build`        |
| New API endpoint                         | Backend engineer                           | Typecheck + integration tests + lint                    |
| New adapter implementation               | SDK engineer + reference existing adapters | Adapter test suite + lint + typecheck                   |
| UI component (existing patterns)         | Frontend engineer + visual diff            | Playwright visual tests + DOM Reality                   |
| E2E test writing                         | QA engineer                                | Run test suite + verify no flakiness                    |
| Documentation updates                    | LLM + human review                         | `pnpm run verify:docs` + link checker                   |
| Dependency updates                       | Renovate/Dependabot + engineer review      | Build + test + lint                                     |
| Security fixes                           | Security engineer + pair with engineer     | Full test suite + security scan                         |

## 5. Known Risks & Pitfalls

### Risk 1: Token Drift

**Symptom:** UI shows inconsistent colors, spacing, or typography
**Likely Cause:** Hardcoded values in components instead of token references
**Diagnosis:** Search for hex colors or pixel values in `packages/web/src/`
**Fix:** Replace with tokens from `design-system/tokens.json`

### Risk 2: Import Boundary Violations

**Symptom:** ESLint errors about importing from package src directories
**Lik Cause:** Direct imports like `import { foo } from '../../../api/src/routes'`
**Fix:** Use workspace dependencies (`@settler/api`) instead

### Risk 3: Tenant Isolation Breach

**Symptom:** Data visible across tenants, RLS policy failures
**Likely Cause:** Missing tenant context in queries, improper scoping
**Diagnosis:** Run `pnpm run validate:tenant-isolation`
**Fix:** Add tenant-scoped queries, verify RLS policies

### Risk 4: Test Flakiness

**Symptom:** Playwright tests fail intermittently
**Likely Cause:** Race conditions, timing issues, missing wait states
**Diagnosis:** Check `tests/e2e/dom-reality-*.spec.ts` for patterns
**Fix:** Add proper wait states, use DOM Reality tests for stability

### Risk 5: Migration Conflicts

**Symptom:** Database migrations fail, schema drift
**Likely Cause:** Multiple migrations modifying same tables
**Diagnosis:** Review `supabase/migrations/` and `scripts/migration-guardian.yml`
**Fix:** Consolidate migrations, use `pnpm run db:verify:migrations`

## 6. Roadmap

### Next 30 Days

- **Complete SDK Python type parity** — Fix remaining typecheck issues in `packages/sdk-python`
- **DOM Reality test expansion** — Add coverage for all console routes
- **Token drift audit** — Systematic scan of `packages/web/src/` for hardcoded values
- **Webhook idempotency docs** — Finalize `docs/WEBHOOK_IDEMPOTENCY.md`
- **Migration safety checks** — Enhance `migration-guardian.yml` with pre-merge gates

### Next 60 Days

- **CI gate hardening** — Add `verify:docs` to pre-commit hooks
- **Import boundary enforcement** — Expand ESLint rules for new packages
- **Visual regression baseline refresh** — Update Playwright snapshots
- **Workhorse test coverage** — Add integration tests for batch jobs
- **Performance monitoring** — Instrument hot paths with OpenTelemetry

### Next 90 Days

- **SDK parity completion** — All SDKs (TS, Python, Go, Ruby, C#, Java) at parity
- **Multi-language docs** — Generate docs from source for all SDKs
- **Adapter extensibility** — Document pattern for custom adapters
- **Enterprise features** — SSO integration documentation, audit logging docs
- **Release automation** — Automated changelog generation from commits

## 7. Definition of Done

A change is "ship-ready" when:

1. **Commands pass:**
   - `pnpm run lint` passes (or auto-fixed)
   - `pnpm run typecheck` passes
   - `pnpm run build` passes
   - `pnpm run verify:docs` passes

2. **Tests pass:**
   - Unit tests pass (`pnpm run test`)
   - E2E tests pass (`pnpm run test:e2e`)
   - Visual regression tests pass (if applicable)

3. **Quality gates met:**
   - No secrets committed (verified by `pnpm run validate:all`)
   - Tenant isolation preserved (verified by `pnpm run validate:tenant-isolation`)
   - No broken imports or dead code
   - Token system respected (if UI changes)

4. **Documentation complete:**
   - Docs updated if behavior changed (`pnpm run verify:docs`)
   - Copy matches enterprise tone
   - No placeholder text

5. **Code review ready:**
   - PR description includes root cause, files changed, verification steps
   - Commits follow conventional format
   - Changes are minimal and focused

---

**Related:** `AGENTS.md` for agent operating procedures, `CONTRIBUTING.md` for developer setup.
