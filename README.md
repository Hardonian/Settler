# Settler

Settler is a deterministic financial reconciliation platform for teams that need reliable run outcomes, replayable execution, and operator-grade investigation.

It combines a reconciliation runtime with investigation and simulation tools so operators can answer three questions quickly:

1. **What happened?**
2. **Why did it happen?**
3. **What changes if we adjust policy?**

## Project Overview

Settler runs reconciliation as a deterministic execution flow, records evidence for every run, and gives operators clear tooling to inspect outcomes, replay behavior, and evaluate policy changes before they are applied.

This repository contains the API, web console, CLI tools, demo harnesses, and documentation for local development and operational evaluation.

## Key Capabilities

- **Reconciliation Engine** — deterministic matching, mismatch classification, and review queues.
- **Truth Explorer** — evidence and lineage inspection for completed runs.
- **Replay Lab** — deterministic re-execution checks to detect drift.
- **Policy Lab** — simulation surfaces for policy impact before rollout.
- **Operator Intelligence** — incident triage and investigative context.
- **Live Event Stream** — runtime telemetry and operator-facing event visibility.
- **Alert Integrations** — Slack/Teams/Telegram alert fan-out paths.
- **Import Workbench** — controlled ingest path for reconciliation data.
- **Synthetic Foundry** — seeded deterministic data generation for testing and demo flows.

## Architecture Overview

Settler is organized as a monorepo with six core runtime layers:

- **API** (`packages/api`) — route surface, orchestration, tenancy-aware contracts.
- **Reconciliation Engine** (`scripts/moat`, CLI runtime) — deterministic run execution.
- **Operator Services** (API + web app modules) — run investigation, alerts, and controls.
- **Runtime Telemetry** (`scripts`, metrics routes, event pipelines) — health and event capture.
- **Policy Engine / Policy Lab** — policy checks and simulation workflows.
- **Replay System / Replay Lab** — evidence replay and drift verification.

Textual system flow:

`Import Workbench -> Reconciliation Engine -> Run Explorer + Truth Explorer -> Replay Lab + Policy Lab -> Alert Integrations + Live Event Stream`

## Quick Start

Fastest local path:

```bash
pnpm run bootstrap
pnpm run demo:settler
pnpm run dev:stack
git clone <your-fork-or-upstream-url>
cd Settler
pnpm install
cp .env.local.example .env.local
pnpm demo:settler
```

`pnpm demo:settler` runs environment validation, attempts migrations, loads demo data, starts local services, executes a reconciliation simulation, and prints guided next steps.

## Demo Walkthrough

- `pnpm run bootstrap` — install + repo-integrity + first-run doctor.
- `pnpm run doctor -- --skip-pipeline --first-run` — first-run diagnostics.
- `pnpm run doctor -- --skip-pipeline` — strict local diagnostics (expects fuller env/runtime readiness).
- `pnpm run demo:settler` — deterministic Settler demo pipeline (CLI-first showcase).
- `pnpm run simulate:settler` — simulation harness for reconciliation/operator scenarios.
- `pnpm run replay:run` — deterministic replay runner for run investigations.
- `pnpm run benchmark` — benchmark harness for runtime throughput/latency checks.
- `pnpm run chaos:test` — failure-injection/chaos pass for resilience validation.
- `pnpm run tenant:create` — tenant bootstrap utility for local/operator workflows.
- `pnpm run help:surface` — print canonical CLI/UI/API capability workflows from the registry.
- `pnpm run dev:stack` — canonical local API + web stack entrypoint.
- `pnpm run repo-integrity` — monorepo/workspace contract validator.
- `pnpm run verify` — full lint/typecheck/build/test/security surface.
After `pnpm demo:settler` completes:

1. Open **Run Explorer** at `/app/runs`.
2. Open **Truth Explorer** at `/app/proofs`.
3. Review **Alerts** at `/app/alerts`.
4. Open **Replay Lab** at `/app/replay` and replay the generated run.
5. Run policy simulation with `pnpm simulate:settler` for Policy Lab verification.

For CLI artifacts, inspect `examples/demo-output/` and replay with `pnpm replay:run`.

## Project Structure

- `packages/api` — API and reconciliation control-plane services.
- `packages/web` — operator UI (Run Explorer, Truth Explorer, Replay Lab, Policy Lab).
- `packages/cli` — CLI runtime and deterministic foundry tooling.
- `scripts` — bootstrap, diagnostics, simulation, verification, and demo orchestration.
- `prisma` — schema and migrations.
- `docs` — architecture, operations, demo, deployment, and contribution docs.

## Development Commands

- [Quickstart](docs/getting-started/quickstart.md)
- [Bootstrap](docs/getting-started/bootstrap.md)
- [Doctor](docs/getting-started/doctor.md)
- [First-run demo](docs/demo/first-run-demo.md)
- [Troubleshooting](docs/troubleshooting/installation-and-setup.md)
- [Repo integrity reference](docs/reference/repo-integrity.md)
- [Workspace contracts](docs/reference/workspace-contracts.md)
- [Surface area convergence matrix](docs/reference/surface-area-convergence.md)
- [API route classes (auth/tenant taxonomy)](docs/api/route-classes.md)
### Core

- `pnpm install`
- `pnpm build`
- `pnpm dev`
- `pnpm test`
- `pnpm doctor`

### Demo and Simulation

- `pnpm demo:settler`
- `pnpm simulate:settler`
- `pnpm replay:run`

### Command Discovery Index

- `pnpm demo:settler` — full local demo bootstrap flow.
- `pnpm simulate:settler` — deterministic policy/reconciliation simulation harness.
- `pnpm replay:run` — run replay utility.
- `pnpm chaos:test` — deterministic chaos test harness.
- `pnpm tenant:create` — tenant bootstrap utility.
- `pnpm doctor` — environment and dependency diagnostics.

## Environment Configuration

Settler reads `.env.local` first, then `.env`.

Common required variables:

- `DATABASE_URL` (or `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`)
- `REDIS_URL`
- `NEXT_PUBLIC_API_URL` (for local web/API connectivity)

Optional integration variables are validated by feature-specific checks and should only be set when those integrations are enabled.

Run `pnpm doctor` to validate runtime prerequisites (Node version, env shape, database connectivity, Redis connectivity).

## Contributing

- Read [`CONTRIBUTING.md`](./CONTRIBUTING.md) for repository-wide standards.
- Read [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md) for contributor workflow, CI expectations, and PR readiness checks.
- Keep claims in docs constrained to commands that pass in this repository.

## License and Project Philosophy

Licensed under the repository license terms.

Project philosophy:

- deterministic behavior over opaque automation
- tenant-safe defaults over convenience shortcuts
- explicit evidence over implied guarantees
- operator clarity over marketing language
