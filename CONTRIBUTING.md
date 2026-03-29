# Contributing to Settler

Thanks for helping improve Settler.

## Development setup

```bash
pnpm install
pnpm dev:stack
```

For deterministic local fixtures and demo evidence:

```bash
pnpm demo:settler
pnpm generate:test-data:smoke
```

## Repo-OS execution contract (required)

Before implementing meaningful changes, read in this order:

1. `AGENTS.md`
2. `MODEL_SPEC.md`
3. `docs/repo-os/README.md`
4. `docs/repo-os/verification-matrix.md`
5. `docs/repo-os/checklists/implementation-pass.md`

### Work classification

Label the pass as one of:

- **Maintenance**
- **Leverage**
- **Moat**

If classified as **Moat**, include explicit compounding loop impact in your report.

### Required report format

Use the canonical structure from `docs/repo-os/checklists/implementation-pass.md`:

1. EXECUTIVE SUMMARY
2. WHAT WAS ALREADY PRESENT
3. ROOT GAPS FOUND
4. FILES CREATED / CHANGED
5. CANONICAL OWNERSHIP DECISIONS
6. VERIFICATION RUN
7. REMAINING GAPS OR FOLLOW-UPS
8. NEXT HIGHEST-LEVERAGE TASK AFTER THIS PASS

## Quality gates before PR

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm verify:fast
```

For release-grade changes, run:

```bash
pnpm verify:full
```

For route/contract/doc-truth changes, also run:

```bash
pnpm verify:surface-docs
pnpm verify:route-classes-doc
pnpm verify:api-family-docs
pnpm verify:routes
```

For tenant/security-sensitive changes, also run:

```bash
pnpm run verify:tenant
pnpm run test:cross-tenant
pnpm run verify:security:fast
```

## Repository structure

- `packages/api`: API routes, domain services, security middleware.
- `packages/web`: operator console surfaces.
- `packages/cli`: deterministic foundry, replay, and simulation tooling.
- `scripts`: verification and operational scripts.
- `docs`: canonical product/engineering documentation.
- `docs/archive`: historical and superseded docs retained for traceability.

## Documentation contribution rules

- Extend canonical docs before creating new top-level markdown files.
- If a doc is superseded, move it to `docs/archive/` and add index entries in `docs/_meta/archive-index.*`.
- Keep repo-level docs limited to stable entry points (`README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, security/legal docs).
- Follow `docs/_meta/DOCS_GOVERNANCE.md`.

## Pull request expectations

- Keep diffs minimal and deterministic.
- Do not ship unverified claims.
- Include evidence for behavior changes (tests, script output, or verification artifacts).
- Call out tenant/security assumption changes explicitly.
