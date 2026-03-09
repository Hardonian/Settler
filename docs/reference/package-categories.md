# Package Categories

## Category definitions

- **app**: deployable product surface (e.g., `@settler/web`, `@settler/api`).
- **CLI**: user/operator command surface (`@settler/cli`).
- **library**: reusable runtime or type contract package.
- **adapter/integration**: bridges to external/internal subsystems.
- **internal tooling/config**: build/lint/type config packages only.
- **experimental/archived**: not in core verification path.

## Current category map (active workspaces)

- app: `@settler/web`, `@settler/api`
- CLI: `@settler/cli`
- library: `@settler/sdk`, `@settler/types`, `@settler/protocol`, `@settler/react-settler`, `@jobforge/shared`, `@jobforge/sdk-ts`, `@jobforge/errors`, `@jobforge/fetch`, `@settler/edge-ai-core`, `@settler/edge-node`
- adapter/integration: `@settler/adapters`, `@jobforge/adapter-settler`
- internal tooling/config: `@jobforge/typescript-config`, `@settler/sdk-csharp`, `@settler/sdk-java` (workspace metadata packages for non-TS SDK surfaces)

## Contract expectations

- app/CLI: build + typecheck + lint + test contracts.
- library: at minimum typecheck + lint; build when published/runtime-consumed.
- tooling/config: no runtime deps; minimal scripts, clear ownership.
