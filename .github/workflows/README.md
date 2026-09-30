# GitHub Actions Workflows

This directory contains GitHub Actions workflows for CI/CD automation.

## Workflow Inventory

| Workflow                    | Purpose                                                              | Trigger             |
| --------------------------- | -------------------------------------------------------------------- | ------------------- |
| `ci.yml`                    | Core CI: conflict markers, parity, API tests, web tests, determinism | push + PR           |
| `security.yml`              | Security invariants, dependency audit, secret scanning, CodeQL       | push + PR + weekly  |
| `guardrails.yml`            | Pricing links, env vars, hard 500s, unverified claims, doc alignment | PR + push to main   |
| `e2e.yml`                   | E2E & visual regression tests                                        | push + PR           |
| `migration-guardian.yml`    | Read-only Prisma and Supabase migration contract validation          | push + PR           |
| `auto-migrate-on-main.yml`  | Serialized Prisma and Supabase production migration owner            | push + manual       |
| `deploy-production.yml`     | Production deployment via Vercel                                     | push to main        |
| `deploy-preview.yml`        | Preview deploys for PRs                                              | PR                  |
| `deploy-edge-functions.yml` | Edge function deployment                                             | push to main        |
| `release.yml`               | Release management                                                   | push + manual       |
| `release-cli.yml`           | CLI artifact releases                                                | push + manual       |
| `release-provenance.yml`    | SBOM and provenance generation                                       | push + manual       |
| `release-safety-check.yml`  | Pre-release safety validation                                        | push + PR           |
| `auto-merge.yml`            | Auto-merge safety checks                                             | PR                  |
| `public-mirror-sync.yml`    | Open-source public mirror synchronization and tag sync (#96)         | push to main / tags |
| `dependency-review.yml`     | PR dependency review                                                 | PR                  |
| `rust-verify.yml`           | Rust code verification                                               | push + PR           |

## Tiered Strategy

See [WORKFLOW_TIERS.md](./WORKFLOW_TIERS.md) for the tier classification.

## Environment Secrets Required

### Production

- `SUPABASE_ACCESS_TOKEN` — Supabase Management API token for production migrations
- `SUPABASE_PROJECT_REF` — Supabase project targeted by production migrations
- `DATABASE_URL` — Production database credential source; migrations replace its endpoint with the linked IPv4 session pooler in memory
- `JWT_SECRET` — Production JWT secret
- `ENCRYPTION_KEY` — Production encryption key
- `VERCEL_TOKEN` — Vercel deployment token
- `VERCEL_ORG_ID` — Vercel organization ID
- `VERCEL_PROJECT_ID` — Vercel project ID

### CI/Testing

- `TURBO_TOKEN` — Turborepo cache token
- `TURBO_TEAM` — Turborepo team
- `SNYK_TOKEN` — Snyk security scanning token
- `SUPABASE_DB_URL_STAGING` — Staging database URL

## Migration Workflow

When a PR with migration files is merged to main:

1. `migration-guardian.yml` validates immutable history, Prisma schema parity, and new Supabase SQL during PR review without database access
2. `auto-migrate-on-main.yml` applies Prisma migrations through the IPv4 session pooler, then applies new Supabase SQL through the Management API with an atomic checksum ledger
3. `deploy-production.yml` deploys the updated application

The production migration job deliberately avoids direct Postgres connections from GitHub-hosted runners because Supabase direct endpoints are IPv6 by default. See [MIGRATION_SECRETS_SETUP.md](../MIGRATION_SECRETS_SETUP.md).

## Manual Triggers

Most workflows support `workflow_dispatch` for manual triggering:
Actions → Select workflow → Run workflow
