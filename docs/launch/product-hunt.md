# Product Hunt Launch Copy

## Tagline

Deterministic reconciliation with replayable proof artifacts.

## Short description

Settler runs reconciliation workflows with verifiable outputs and replay checks.

## Full description

Settler is an engineering-first reconciliation platform focused on deterministic execution, tenant safety, and verifiable outcomes. Every run can emit evidence artifacts and can be replay-verified using repository tooling.

## Key features

- Deterministic execution + replay verification
- Multi-tenant safety checks and route/runtime verification
- CLI + web surfaces backed by repo-integrity and verify gates

## Maker comment

We only claim what is reproducible with `pnpm run verify` and supporting scripts in this repository.

## Launch FAQ

- **Is this open source?** Core repository content is open in this monorepo.
- **How do I validate claims?** Run `pnpm run typecheck`, `pnpm run build`, `pnpm run test`, `pnpm run repo-integrity`, `pnpm run verify`.
