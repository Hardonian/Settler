# Settler

Settler is an OSS-first deterministic execution and reconciliation platform.

## Quickstart (fast path)

```bash
pnpm run bootstrap
pnpm run doctor -- --skip-pipeline
pnpm run demo
pnpm run dev:stack
```

## Command matrix

- `pnpm run bootstrap` — first-run install + integrity + first-run doctor.
- `pnpm run doctor -- --skip-pipeline` — local diagnostics (toolchain/env/config).
- `pnpm run demo` — deterministic demo execution with replay proof.
- `pnpm run dev:stack` — canonical local API + web stack entrypoint.
- `pnpm run repo-integrity` — monorepo contract validator.
- `pnpm run verify` — full lint/typecheck/build/test verification suite.
- `pnpm run build` — production build path.

## Repository structure

- `packages/api` — API/control plane.
- `packages/web` — Next.js product/marketing UI.
- `packages/cli` — Settler CLI runtime.
- `packages/sdk` + `packages/react-settler` + `packages/types` — SDK/runtime libraries.
- `docs/getting-started/*` — onboarding flow documentation.
- `docs/reference/repo-integrity.md` — monorepo contract rules.

## Onboarding docs

- [Quickstart](docs/getting-started/quickstart.md)
- [Bootstrap](docs/getting-started/bootstrap.md)
- [Doctor](docs/getting-started/doctor.md)
- [First-run demo](docs/demo/first-run-demo.md)
- [Troubleshooting](docs/troubleshooting/installation-and-setup.md)
- [Repo integrity reference](docs/reference/repo-integrity.md)

## Integrity guarantee

`pnpm run repo-integrity` is expected to pass on a healthy checkout and fails hard when workspace manifests, script references, or package contracts drift.
