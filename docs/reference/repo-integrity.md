# Repo Integrity Contract

Command: `pnpm run repo-integrity`

Current enforced contract:

1. Workspace folders included by root workspace globs must contain valid `package.json` when JS/TS workspaces.
2. Workspace package names must resolve to real workspace directories.
3. Internal dependencies (`@settler/*`) referenced by workspaces must exist.
4. `package.json` scripts that invoke `tsx/node/ts-node` must reference real files.
5. TypeScript workspaces must define `build` (or `build:vercel`) and `typecheck` scripts.
6. No tracked `node_modules/` files.

The workspace model explicitly excludes non-Node SDK folders (`sdk-csharp`, `sdk-java`, `sdk-go`, `sdk-python`, `sdk-ruby`) and `workhorse` from pnpm workspace resolution.
