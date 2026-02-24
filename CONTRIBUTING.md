# Contributing to Settler

Thanks for investing time in Settler. This guide explains how to set up the repo, make safe changes, and pass the required quality gates.

## Project Overview

Settler is a multi-package monorepo. Most changes land in:

- `packages/api` — reconciliation API (domain, application, infrastructure, routes)
- `packages/web` — Next.js console
- `packages/adapters` — integration adapters
- `packages/jobforge-*` — background job infrastructure
- `packages/workhorse` — Python worker
- `packages/sdk-*` — language SDKs

If you are unsure where a change belongs, open an issue first.

## Development Setup

### Prerequisites

- Node.js 24.x (see `.nvmrc`)
- pnpm 10.x (see `package.json`)
- PostgreSQL (Supabase or local Postgres)

### Initial Setup

```bash
pnpm install
cp .env.example .env
```

Update `.env` with your Postgres/Supabase credentials.

### Run Migrations

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB"
pnpm exec tsx scripts/run-migrations-remote.ts
```

### Start the Web Console

```bash
pnpm --filter @settler/web dev
```

## Quality Gates (Required)

Settler requires verification before changes can be merged.

### Fast Verification (Pre-commit)

```bash
pnpm run verify:fast
```

### Full Verification (Pre-push)

```bash
pnpm run verify:full
```

### Docs Reality Checks

Documentation must match the repository state. Run:

```bash
pnpm run verify:docs
```

## Safe Change Guidelines

- Preserve tenant isolation (RLS and tenant-scoped queries).
- Keep reconciliation logic deterministic.
- Update docs and scripts together.
- Avoid adding network calls to hot paths without retries/timeouts.

## Making a Small First Contribution

Good first contributions include:

- Documentation fixes (README, docs, diagrams).
- Adapter improvements and new integration tests.
- SDK improvements and typed examples.
- Minor UI enhancements in `packages/web`.

Check the issue list for **good first issue** labels or open a proposal with a small scope.

## Issue and Discussion Guidelines

Use the issue templates in `.github/ISSUE_TEMPLATE` for:

- Bug reports
- Feature requests
- Questions/clarifications

If GitHub Discussions are enabled, we recommend the following categories:

- **Q&A:** usage questions and troubleshooting
- **Ideas:** feature proposals and roadmap discussions
- **Show & Tell:** integrations and community demos
- **Design/Architecture:** changes with system-wide impact

## Code Style

### TypeScript

- Strict typing; avoid `any`.
- Prefer named exports.
- Use consistent error envelopes: `{ code, message, traceId, retryable }`.

### Formatting

- Prettier formatting is enforced.
- Run `pnpm run format:check` before submitting.

## Testing

```bash
pnpm run test
```

For workspace-specific tests:

```bash
pnpm --filter @settler/web test
```

## Pull Request Process

1. Create a feature branch.
2. Keep PRs focused and describe the user impact.
3. Ensure `pnpm run verify:full` passes.
4. Update docs if behavior or commands change.

## Support

Need help? See [SUPPORT.md](SUPPORT.md).

## Demo and Capsule Verification

```bash
settler demo
```

Capture the generated capsule path and verify with:

```bash
settler verify --file <capsule-path>
```

## Connector / Pack / Rule Contributions

- Connector adapters live in `packages/adapters/src` and must include deterministic mapping behavior.
- Marketplace rule metadata lives in `marketplace/rules/registry.json`.
- Adapter registry metadata lives in `marketplace/adapters/registry.json`.
- New connectors/rules must include tests and docs updates in `packages/web/content/pages/integrations.mdx` or related docs.

## Docs and Link Integrity

```bash
pnpm run verify:docs
pnpm run verify:links
```

## Release Workflow Overview

- Tags (`vX.Y.Z`) trigger release workflows.
- `.github/workflows/release-cli.yml` publishes OS/arch CLI artifacts and SHA256 checksum files.
- Install smoke checks validate `settler version` and `settler doctor` from packaged artifacts.
