# Settler

**Open-source engine that reconciles financial data across systems, surfaces mismatches, and produces verifiable evidence for every run.**

Stripe says one thing. Your bank says another. Your ledger says something else. Settler finds every difference, explains why, and proves the results are correct.

## Why Settler exists

Companies reconcile across Stripe, banks, ERPs, and internal ledgers using spreadsheets and scripts that break silently, produce unexplainable results, and cannot be audited.

Settler replaces that with a reconciliation engine where:
- Every run is **repeatable** — same inputs and rules always produce the same results
- Every mismatch is **surfaced** — with full context about what didn't match and why
- Every result is **provable** — evidence packs are generated automatically for audit
- Every exception is **tracked** — from detection through resolution

## How it works

1. **Ingest** records from Stripe, banks, ERPs, and ledgers.
2. **Reconcile** with explicit matching rules defined in code.
3. **Detect** mismatches and route them to a review queue.
4. **Prove** results with exported evidence (input data, rules applied, outputs, cryptographic hashes).
5. **Replay** any run to verify or debug the results.

## What you can do in 5 minutes

```bash
pnpm install
cp .env.example .env
pnpm exec tsx scripts/run-migrations-remote.ts
pnpm --filter @settler/web dev
pnpm demo
pnpm settler:replay examples/demo-output/evidence.json
```

Demo outputs are written to `examples/demo-output`:
- `run.json`
- `results.json`
- `evidence.json`
- `report.html`

## Why Settler is different

- **Replayable runs:** re-run any reconciliation with identical results. Debugging and auditing become tractable.
- **Evidence generation:** every run produces an evidence pack — what data went in, what rules applied, what matched, what didn't.
- **Rules as code:** matching rules live in your repository, go through pull requests, and run in CI.
- **Exception workflow:** mismatches route to a review queue with assignment, resolution tracking, and audit context.
- **Self-hosted, open source:** Apache 2.0 licensed. Your data stays in your infrastructure.
- **API and SDK first:** reconciliation runs can be triggered programmatically and embedded in operational workflows.

## OSS vs Enterprise at a glance

### OSS (this repo, self-hostable)

- Reconciliation API and data model for organizations/workspaces, connections, pipelines, runs, results, rules, and review workflows.
- Next.js web surfaces for product, docs, and console operations.
- SDKs (`@settler/sdk`, `@settler/react-settler`, Go/Python scaffolding) and adapters.
- Baseline governance and audit primitives in core API/web flows.

### Enterprise (optional extensions)

- Enterprise route surfaces under `packages/web/src/app/enterprise` and enterprise API endpoints under `packages/web/src/app/api/enterprise`.
- Advanced governance/tenancy controls and premium operational panels.
- Enterprise capabilities are optional; OSS build and public routes work without enterprise-only configuration.

Detailed boundary notes: [`docs/oss-vs-enterprise.md`](docs/oss-vs-enterprise.md).

## Quickstart (OSS)

Prerequisites:
- Node.js 22+
- pnpm 10.13.1+
- Postgres/Supabase

Set at minimum:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Run local stack:

```bash
pnpm exec tsx scripts/run-migrations-remote.ts
pnpm --filter @settler/web dev
```

Open `http://localhost:3000`.

## Self-host and local development

- Primary setup and run flow: [`docs/getting-started/README.md`](docs/getting-started/README.md)
- Deployment path: [`docs/deployment-guide.md`](docs/deployment-guide.md)
- Enterprise compose example: [`enterprise/docker-compose.yml`](enterprise/docker-compose.yml)

If you are evaluating quickly, run `pnpm demo` first, then wire your own data sources.

## Architecture overview

Core runtime primitives:
- **Connections:** external data sources (Stripe, banks, ERPs, ledgers).
- **Pipelines:** reconciliation workflow configurations.
- **Runs:** individual reconciliation executions (immutable, replayable).
- **Results:** matched and mismatched records with full context.
- **Review Queue:** exception handling with assignment and resolution tracking.
- **Evidence:** audit-ready proof of what happened in each run.

Key packages:
- `packages/api` – reconciliation API, domain logic, and data layer.
- `packages/web` – Next.js web app (product console, docs, marketing).
- `packages/adapters` – connectors for Stripe, banks, ERPs, and other data sources.
- `packages/sdk`, `packages/react-settler`, `packages/sdk-go`, `packages/workhorse` – client SDKs and background workers.

## Contributing

- Contributor guide: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Verification baseline:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Full release-grade verification:

```bash
pnpm verify
```

## Documentation map

- Docs home: [`docs/README.md`](docs/README.md)
- Getting started: [`docs/getting-started/README.md`](docs/getting-started/README.md)
- Product canon: [`docs/product/README.md`](docs/product/README.md)
- Architecture: [`docs/architecture/README.md`](docs/architecture/README.md)
- API + SDK: [`docs/api/README.md`](docs/api/README.md)
- Security + trust: [`docs/security/README.md`](docs/security/README.md)
- Operations: [`docs/ops/README.md`](docs/ops/README.md)

## License and support

- License: [`LICENSE`](LICENSE)
- Security reports: [`SECURITY.md`](SECURITY.md)
- Issues: open a GitHub issue with reproduction details.
