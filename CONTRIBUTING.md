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

## Quality gates before PR

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm verify
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
