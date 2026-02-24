# Changelog

All notable changes to Settler are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Strengthened release boundary linting to prevent enterprise imports from OSS route surfaces.
- Standardized release documentation for OSS vs Enterprise scope and verification gates.
- Purged tracked generated artifacts (Playwright outputs and generated media binaries) from git index.

## [1.0.0] - 2026-02-23

### Added

- Deterministic reconciliation control plane primitives across connections, pipelines, runs, and results.
- Operator review queue and governance/audit baseline flows in API and web surfaces.
- Monorepo package topology for API, web, adapters, SDKs, and worker tooling.

### Operational

- Release gates via lint, typecheck, test, build, and repository verification scripts.
- Marketing and route boundary controls to keep public routes free from auth/server dependency bleed.
