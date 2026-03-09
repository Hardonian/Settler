# Workspace Contracts

Settler uses a pnpm workspace rooted at `package.json` + `pnpm-workspace.yaml` with primary glob `packages/*` and explicit excludes for non-Node SDKs and archival surfaces.

## Active workspace packages

Current JS/TS workspace packages resolved under `packages/*`:

- `@settler/api`
- `@settler/web`
- `@settler/cli`
- `@settler/sdk`
- `@settler/react-settler`
- `@settler/types`
- `@settler/protocol`
- `@settler/adapters`
- `@settler/edge-node`
- `@settler/edge-ai-core`
- `@jobforge/*` workspace utilities (`adapter-settler`, `config`, `errors`, `fetch`, `sdk-ts`, `shared`, `typescript-config`)

## Excluded package surfaces

The root workspace intentionally excludes these folders from pnpm resolution:

- `packages/sdk-csharp`
- `packages/sdk-java`
- `packages/sdk-go`
- `packages/sdk-python`
- `packages/sdk-ruby`
- `packages/workhorse`

These folders may still exist for OSS mirrors, reference artifacts, or non-Node toolchains, but they are not part of the Node workspace contract.

## Script contracts

At repo level, the canonical onboarding + integrity command surface is:

- `pnpm run bootstrap`
- `pnpm run doctor`
- `pnpm run demo`
- `pnpm run dev:stack`
- `pnpm run repo-integrity`

TypeScript workspaces must expose `build` (or `build:vercel`) and `typecheck` scripts. Script entries that invoke `tsx`/`node`/`ts-node` must point to existing files.

## Enforcement

`pnpm run repo-integrity` is the automated guardrail for workspace contract drift. It validates:

1. manifest presence for JS/TS workspace folders,
2. workspace name ↔ directory consistency,
3. internal dependency references,
4. script file-path validity,
5. TypeScript workspace script contracts,
6. absence of tracked `node_modules`.
