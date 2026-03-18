# Changelog

All notable changes to Settler are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added policy-as-code substrate modules (`/policies`, `/runner`, `/economic`, `/evidence`) with deterministic compilation and runtime execution funnel via `executeWithPolicy()`.
- Added deterministic demo and replay commands that generate evidence artifacts under `examples/demo-output` and replay fixtures under `examples/demo-output-fixtures`.
- Added verification gates for policy boundaries and replay checks (`verify:policy`) and strengthened route smoke verification requirements.
- Added new documentation: `docs/demo.md`, `docs/determinism.md`, `docs/policies.md`, `docs/investor.md`, and `docs/one-pager.md`.
- Added release engineering automation with deterministic artifact packaging (`release:artifacts`), checksum verification (`verify:release:artifacts`), and release dry-run orchestration (`release:dry-run`).
- Added a dedicated `release-engineering` GitHub Actions workflow with strict release gates and artifact publication for semver tags.
- Added OSS packaging policy enforcement to block private-workspace dependency leakage into OSS release bundles.

### Changed

- Rebuilt root and package documentation around deterministic execution ledger, replay lab, proof verification, policy simulation, and failure-intelligence terminology.
- Added role-based docs navigation and new support/troubleshooting surfaces for replay divergence, proof verification failures, API errors, and health/doctor workflows.
- Reconciled API documentation with mounted route families in `packages/api/src/index.ts` and clarified v1 vs v2 (strategic/internal) status.
- Updated homepage messaging to emphasize verifiable execution, replay outcomes, and remediation guardrails instead of generic reconciliation phrasing.

- Updated root `verify` and `verify:oss` scripts to enforce lint/typecheck/build/test plus boundaries/policy/routes.
- Updated README proof sections to link directly to deterministic demo evidence and replay contract.

### Added

- Added `pnpm demo:assets` automation (`scripts/demo-assets.mjs`) to generate operator dashboard, run explorer, truth explorer, replay verification, and system health screenshots under `docs/assets`.
- Added launch-readiness documentation: `docs/DIFFERENTIATORS.md`, `docs/launch/launch-checklist.md`, `docs/BENCHMARKS.md`, and architecture diagram docs under `docs/architecture`.

### Changed

- Updated `pnpm demo:settler` pipeline to enforce a full demo flow (dataset load, reconciliation, runtime alerts, run inspection, replay, policy simulation) and print guided operator actions.
- Updated benchmark harness to write `docs/BENCHMARKS.md` by default with reconciliation throughput, run duration, API latency proxy, and memory usage.
- Refined core launch docs (`README.md`, `CONTRIBUTING.md`, `ARCHITECTURE.md`, `docs/API_REFERENCE.md`) to align claims with executable repo surfaces.

## [1.0.0] - 2026-02-23

### Added

- Reconciliation engine primitives across connections, pipelines, runs, and results.
- Operator review queue and governance/audit baseline flows in API and web surfaces.
- Monorepo package topology for API, web, adapters, SDKs, and worker tooling.

### Operational

- Release gates via lint, typecheck, test, build, and repository verification scripts.
- Marketing and route boundary controls to keep public routes free from auth/server dependency bleed.
