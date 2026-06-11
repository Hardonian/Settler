# Contributing to Settler

Settler is a reconciliation intelligence platform — deterministic outcomes, verifiable evidence, and tenant-safe operations are non-negotiable. Contributions that uphold those properties are welcome.

## Development Setup

```bash
pnpm install
pnpm dev:stack
```

For deterministic local fixtures and demo evidence:

```bash
pnpm demo:settler
pnpm generate:test-data:smoke
```

## Before You Implement

Read these in order before making meaningful changes:

1. [`AGENTS.md`](AGENTS.md) — agent execution contract
2. [`MODEL_SPEC.md`](MODEL_SPEC.md) — product identity and operating doctrine
3. [`docs/repo-os/README.md`](docs/repo-os/README.md)
4. [`docs/repo-os/verification-matrix.md`](docs/repo-os/verification-matrix.md)
5. [`docs/repo-os/checklists/implementation-pass.md`](docs/repo-os/checklists/implementation-pass.md)

## Work Classification

Label every pull request as one of:

- **Maintenance** — cosmetic, polish, or consistency work
- **Leverage** — improves operator throughput, verification confidence, release safety, or contract coherence
- **Moat** — compounds reconciliation intelligence, evidence depth, policy memory, or audit trust

If classified as **Moat**, include the compounding loop impact in your PR description.

## Required PR Report Format

Use the canonical structure from [`docs/repo-os/checklists/implementation-pass.md`](docs/repo-os/checklists/implementation-pass.md):

1. EXECUTIVE SUMMARY
2. WHAT WAS ALREADY PRESENT
3. ROOT GAPS FOUND
4. FILES CREATED / CHANGED
5. CANONICAL OWNERSHIP DECISIONS
6. VERIFICATION RUN
7. REMAINING GAPS OR FOLLOW-UPS
8. NEXT HIGHEST-LEVERAGE TASK

## Quality Gates

Before every PR:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm verify:fast
```

For release-grade changes:

```bash
pnpm verify:full
```

For route, contract, or documentation-truth changes:

```bash
pnpm verify:surface-docs
pnpm verify:route-classes-doc
pnpm verify:api-family-docs
pnpm verify:routes
```

For tenant or security-sensitive changes:

```bash
pnpm run verify:tenant
pnpm run test:cross-tenant
pnpm run verify:security:fast
```

## Repository Structure

| Path                           | Purpose                                               |
| ------------------------------ | ----------------------------------------------------- |
| `packages/api`                 | API routes, domain services, security middleware      |
| `packages/web`                 | Operator console surfaces                             |
| `packages/cli`                 | Deterministic foundry, replay, and simulation tooling |
| `packages/reconciliation-core` | Core matching engine and proofpack generation         |
| `scripts/`                     | Verification and operational scripts                  |
| `docs/`                        | Canonical product and engineering documentation       |
| `docs/archive/`                | Historical docs retained for traceability             |

## Documentation Rules

- Extend canonical docs before creating new top-level markdown files
- If a document is superseded, move it to `docs/archive/` and add index entries in `docs/_meta/archive-index.*`
- Keep root-level docs limited to stable entry points (`README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, security and legal docs)
- Follow [`docs/_meta/DOCS_GOVERNANCE.md`](docs/_meta/DOCS_GOVERNANCE.md)

## Pull Request Expectations

- Keep diffs minimal and deterministic
- Do not ship unverified claims — behavior assertions require tests, script output, or verification artifacts
- Include evidence for behavior changes
- Call out tenant and security assumption changes explicitly
- All PRs must pass the full `pnpm verify` suite
