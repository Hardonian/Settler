# Contributing (Docs + Repo Workflow)

This guide focuses on contributor workflow for the Settler repository.

## Branching model

- Branch from the default branch using a focused name (`feat/*`, `fix/*`, `docs/*`).
- Keep each branch scoped to a single concern (for example: docs clarity pass, replay reliability fix).
- Rebase before opening a PR to minimize merge noise.

## Coding and documentation standards

- Prefer deterministic behavior and explicit failure modes.
- Do not introduce tenant-unsafe shortcuts.
- Keep terminology aligned with canonical product names:
  - Reconciliation Engine
  - Truth Explorer
  - Replay Lab
  - Policy Lab
  - Operator Intelligence
  - Run Explorer
  - Import Workbench
  - Synthetic Foundry
  - Live Event Stream
- If implementation and documentation disagree, update docs or code in the same PR.

## Test and verification expectations

Before opening a PR, run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Recommended additional checks for runtime confidence:

```bash
pnpm doctor
pnpm demo:settler
pnpm repo-integrity
```

## Pull request workflow

1. Explain the user or operator outcome first.
2. List exact commands used for verification.
3. Include risk notes for behavior that could not be verified locally.
4. Keep claims constrained to commands and artifacts that actually passed.

## CI checks

At minimum, PRs are expected to remain green on lint, typecheck, test, and build surfaces.

For security and tenant-boundary sensitive changes, include explicit evidence commands (for example `pnpm verify:security:fast`) in the PR description.
