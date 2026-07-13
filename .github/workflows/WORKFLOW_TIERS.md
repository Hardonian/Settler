# GitHub Workflow Tiers

This document defines the tiered workflow strategy for CI/CD.

## Tiers

### Tier 1: Required (Blocking)

These checks must pass before merge:

- `ci.yml` — Core CI: conflict-markers, parity, API tests, web tests, determinism
- `security.yml` — Security invariants, dependency audit, secret scanning, CodeQL
- `guardrails.yml` — Pricing links, env vars, hard 500s, unverified claims, docs alignment
- `migration-guardian.yml` — Comprehensive migration safety validation

### Tier 2: Advisory (Non-Blocking)

These run but don't block merges:

- `dependency-review.yml` — PR dependency audit
- `auto-merge.yml` — Auto-merge safety checks
- `rust-verify.yml` — Rust code verification

### Tier 3: Deployment

Triggered on push to main or manually:

- `deploy-production.yml` — Production deployment via Vercel
- `deploy-preview.yml` — Preview deploys for PRs
- `deploy-edge-functions.yml` — Edge function deployment
- `auto-migrate-on-main.yml` — Auto-apply migrations after merge

### Tier 4: Release

Triggered on tags or manually:

- `release.yml` — Release management
- `release-cli.yml` — CLI artifact releases
- `release-provenance.yml` — SBOM and provenance generation
- `release-safety-check.yml` — Pre-release safety validation

### Tier 5: Sync

- `auto-sync-oss.yml` — OSS mirror sync

## Main Branch Protection

Branch protection requires only Tier 1 checks to pass.
