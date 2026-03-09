# Package Graph Audit (Dependency Pruning Pass)

_Date: 2026-03-09_

## Scope and method

This audit covers all active `packages/*` workspace manifests and the root workspace/tooling manifests (`package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.json`).

Commands used:

- `rg --files -g 'package.json' -g 'pnpm-workspace.yaml' -g 'turbo.json' -g 'nx.json'`
- `node` workspace manifest inventory script
- `rg "@jobforge/config|jobforge-config"`

## Current workspace graph (post-pruning)

- Active workspaces: **19** packages under `packages/*` (including metadata-only `@settler/sdk-csharp` and `@settler/sdk-java` manifests required for workspace integrity).
- Categories (reconciled in this pass): app, CLI, library, adapter/integration, internal tooling/config.
- Internal namespace split remains intentional:
  - Product/runtime packages in `@settler/*`
  - JobForge integration packages in `@jobforge/*`

## Findings

### 1) Dead workspace package discovered and removed

`@jobforge/config` (`packages/jobforge-config`) had no runtime source, no meaningful consumer import sites, and only provided a thin `eslint.js` export while still adding an install/build graph node.

Signals:

- No source files beyond `eslint.js` + manifest.
- No import references in runtime code.
- Only stale devDependency references from `@jobforge/errors` and `@jobforge/fetch`.
- Root tsconfig path alias pointed to a non-existent `src` path.

Decision:

- Remove workspace package.
- Remove stale devDependency references.
- Remove stale TS path alias.

### 2) Duplicate/overlapping dependency families (kept but documented)

Observed high-frequency dependencies across packages (expected but now explicit): `typescript`, `@types/node`, `eslint`, `zod`, `jest`, `vitest`.

Rationale:

- Test stack remains mixed (`jest` + `vitest`) due package-level ownership and existing verification contracts.
- No forced migration performed in this pass to avoid broad behavioral risk.

### 3) Root/tooling drift closed in this pass

Pre-existing integrity drift was resolved by adding workspace metadata manifests for `sdk-csharp` and `sdk-java`, fixing stale script path references, and adding missing package build/typecheck contracts required by `repo-integrity`.

## Outcome summary

- Workspace graph clarified: dead package removed and non-JS SDK folders now represented by explicit metadata manifests.
- Stale dependency references removed.
- TS workspace alias truth improved.
- Documentation added for package category and dependency policy to prevent recurrence.
