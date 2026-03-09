# Repo Integrity Contract

Command: `pnpm run repo-integrity`

## What it enforces

1. Workspace folders included by root workspace globs contain valid `package.json` for JS/TS workspaces.
2. Workspace package names resolve to real workspace directories.
3. Internal dependencies (`@settler/*`) referenced by workspaces exist.
4. `package.json` scripts invoking `tsx`/`node`/`ts-node` reference real files.
5. TypeScript workspaces define `build` (or `build:vercel`) and `typecheck` scripts.
6. No tracked `node_modules/` files.

## Workspace model

The workspace model intentionally excludes non-Node surfaces from pnpm resolution:

- `packages/sdk-csharp`
- `packages/sdk-java`
- `packages/sdk-go`
- `packages/sdk-python`
- `packages/sdk-ruby`
- `packages/workhorse`

These may exist in-repo for mirror/toolchain reasons, but they are outside the Node monorepo contract gate.

## Usage

- Run directly: `pnpm run repo-integrity`
- Included in bootstrap: `pnpm run bootstrap`
- Recommended before merging monorepo/package graph changes.
