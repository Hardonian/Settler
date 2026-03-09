# Monorepo Structure

## Workspace layout

- Root orchestration: `package.json`, `pnpm-workspace.yaml`, `turbo.json`.
- Active JS/TS workspaces: `packages/*`.
- Non-workspace examples/repro surfaces are intentionally outside `packages/*` active graph.

## Package domains

- `@settler/*`: product/runtime surfaces (web, api, sdk, protocol, adapters, types, CLI integration points).
- `@jobforge/*`: async job processing ecosystem (SDK, shared contracts, adapters, transport helpers, error layer, TS config).

## Structural principles

1. Keep package boundaries only where they represent real ownership/runtime isolation.
2. Remove skeletal or non-runtime packages that provide no contract value.
3. Prefer shared primitives over ad-hoc helper packages.
4. Keep optional or integration-heavy surfaces out of core onboarding path when possible.

## Recent simplification

- Removed `@jobforge/config` as dead package to reduce workspace graph breadth and stale dependency surface.

## Metadata workspaces

- Non-JS SDK directories (`packages/sdk-csharp`, `packages/sdk-java`) are represented with minimal private workspace manifests so repository integrity checks can validate workspace completeness deterministically.
