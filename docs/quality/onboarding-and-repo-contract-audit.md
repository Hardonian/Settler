# Onboarding and Repo Contract Audit

## Scope

Audit executed for first-run UX and monorepo contract integrity restoration.

## Friction points found

1. `repo-integrity` failed due to non-workspace SDK directories lacking `package.json`.
2. Root and package scripts referenced missing files.
3. TypeScript workspaces missing required `build`/`typecheck` contracts.
4. No canonical one-command bootstrap flow.
5. README command flow was not centered on bootstrap/doctor/demo.

## Root causes

- Workspace globs were too broad relative to mixed-language repo layout.
- Script drift not reconciled with repository file paths.
- Package contract requirements existed in integrity check but not uniformly implemented.

## Remediations applied

- Explicit workspace excludes for non-Node SDKs + workhorse.
- Added missing `packages/web/scripts/check-public-route-boundary.ts`.
- Corrected root foundry script paths to `packages/cli/src/index.ts`.
- Added missing package contracts in JobForge packages.
- Added canonical `bootstrap` and `dev:stack` commands.
- Updated onboarding docs and command discoverability surfaces.
