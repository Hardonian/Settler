# GitHub Actions Workflows

This directory contains GitHub Actions workflows for CI/CD automation.

## Workflow Inventory

| Workflow                    | Purpose                                                              | Trigger              |
| --------------------------- | -------------------------------------------------------------------- | -------------------- |
| `ci.yml`                    | Core CI: conflict markers, parity, API tests, web tests, determinism | push + PR            |
| `security.yml`              | Security invariants, dependency audit, secret scanning, CodeQL       | push + PR + weekly   |
| `guardrails.yml`            | Pricing links, env vars, hard 500s, unverified claims, doc alignment | PR + push to main    |
| `e2e.yml`                   | E2E & visual regression tests                                        | push + PR            |
| `migration-guardian.yml`    | Comprehensive migration safety validation                            | push + PR + schedule |
| `auto-migrate-on-main.yml`  | Auto-apply migrations after merge to main                            | push to main         |
| `deploy-production.yml`     | Production deployment via Vercel                                     | push to main         |
| `deploy-preview.yml`        | Preview deploys for PRs                                              | PR                   |
| `deploy-edge-functions.yml` | Edge function deployment                                             | push to main         |
| `release.yml`               | Release management                                                   | push + manual        |
| `release-cli.yml`           | CLI artifact releases                                                | push + manual        |
| `release-provenance.yml`    | SBOM and provenance generation                                       | push + manual        |
| `release-safety-check.yml`  | Pre-release safety validation                                        | push + PR            |
| `auto-merge.yml`            | Auto-merge safety checks                                             | PR                   |
| `auto-sync-oss.yml`         | OSS mirror sync                                                      | push to main         |
| `dependency-review.yml`     | PR dependency review                                                 | PR                   |
| `rust-verify.yml`           | Rust code verification                                               | push + PR            |

## Tiered Strategy

See [WORKFLOW_TIERS.md](./WORKFLOW_TIERS.md) for the tier classification.

## Environment Secrets Required

### Production

- `DATABASE_URL` — Production database connection string
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

1. `migration-guardian.yml` validates the migration during PR review
2. `auto-migrate-on-main.yml` applies the migration after merge
3. `deploy-production.yml` deploys the updated application

## Manual Triggers

Most workflows support `workflow_dispatch` for manual triggering:
Actions → Select workflow → Run workflow
