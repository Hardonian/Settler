# OSS vs Enterprise Boundary

This document defines the release boundary between Settler OSS and optional enterprise surfaces.

## OSS Scope

OSS includes the reconciliation engine primitives and default runtime:

- Organizations/workspaces, connections, pipelines, runs, results, rules, and review queue flows.
- Core governance/audit traces needed for deterministic reconciliation operations.
- API, web console/product routes, adapters, and SDK/tooling required to run self-hosted.

## Enterprise Scope (Optional)

Enterprise extensions are additive and optional:

- Enterprise route group in web app (`/enterprise` pages and enterprise API routes).
- Advanced governance controls and premium operations surfaces.
- Enterprise-only env/config must never be required for OSS startup.

## Enforced Technical Boundaries

- Marketing/public route boundaries are linted via `scripts/boundary-linter.mjs`.
- OSS route surfaces are blocked from importing enterprise modules.
- Enterprise modules may depend on OSS modules; reverse dependency is disallowed.

## Release Expectations

- `pnpm verify` must pass before merge/release.
- Public/marketing routes must degrade gracefully when optional integrations are missing.
- Enterprise absence must not break OSS build or public render paths.
