# Settler

Settler is an OSS-first deterministic execution and reconciliation platform.

## Quickstart (core local path)

```bash
pnpm run bootstrap
pnpm run demo
pnpm run dev:stack
```

`bootstrap` already runs `repo-integrity` and first-run doctor.

## Command matrix

- `pnpm run bootstrap` — install + repo-integrity + first-run doctor.
- `pnpm run doctor -- --skip-pipeline --first-run` — first-run diagnostics.
- `pnpm run doctor -- --skip-pipeline` — strict local diagnostics (expects fuller env/runtime readiness).
- `pnpm run demo` — deterministic demo execution + replay verification.
- `pnpm run dev:stack` — canonical local API + web stack entrypoint.
- `pnpm run repo-integrity` — monorepo/workspace contract validator.
- `pnpm run verify` — full lint/typecheck/build/test/security surface.

## Core vs optional setup

Core local onboarding does **not** require optional connectors (Stripe/Resend/Redis/etc.).
Optional integrations should be configured only when validating those specific surfaces.

## Repository structure

- `packages/api` — API/control plane.
- `packages/web` — Next.js UI.
- `packages/cli` — Settler CLI runtime.
- `packages/sdk` + `packages/react-settler` + `packages/types` — SDK/runtime libraries.
- `docs/getting-started/*` — onboarding flow docs.
- `docs/reference/repo-integrity.md` — repo truth gate.
- `docs/reference/workspace-contracts.md` — workspace package contract.

## Onboarding docs

- [Quickstart](docs/getting-started/quickstart.md)
- [Bootstrap](docs/getting-started/bootstrap.md)
- [Doctor](docs/getting-started/doctor.md)
- [First-run demo](docs/demo/first-run-demo.md)
- [Troubleshooting](docs/troubleshooting/installation-and-setup.md)
- [Repo integrity reference](docs/reference/repo-integrity.md)
- [Workspace contracts](docs/reference/workspace-contracts.md)

## Integrity guarantee

`pnpm run repo-integrity` is expected to pass on a healthy checkout and fails hard when workspace manifests, script references, or package contracts drift.

## Launch Readiness Snapshot

Settler launch claims in this repository are constrained to commands and artifacts that are currently reproducible:

- `pnpm run typecheck`
- `pnpm run build`
- `pnpm run test`
- `pnpm run repo-integrity`
- `pnpm run verify`

See `docs/demo/demo-walkthrough.md` for a deterministic walkthrough and `docs/launch/launch-checklist.md` for pre-launch gates.
