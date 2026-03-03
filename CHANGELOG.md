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

### Changed

- Updated root `verify` and `verify:oss` scripts to enforce lint/typecheck/build/test plus boundaries/policy/routes.
- Updated README proof sections to link directly to deterministic demo evidence and replay contract.

## [1.0.0] - 2026-02-23

### Added

- Deterministic reconciliation control plane primitives across connections, pipelines, runs, and results.
- Operator review queue and governance/audit baseline flows in API and web surfaces.
- Monorepo package topology for API, web, adapters, SDKs, and worker tooling.

### Operational

- Release gates via lint, typecheck, test, build, and repository verification scripts.
- Marketing and route boundary controls to keep public routes free from auth/server dependency bleed.
