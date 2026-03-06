# Settler

**Settler is the open-source reconciliation control plane for provable financial truth.**

Run deterministic reconciliation workflows, inspect mismatches with traceable context, replay the exact run, and export verifiable evidence.

## Why Settler exists

Most teams reconcile across Stripe, ERP, banking, and internal ledgers with scripts + spreadsheets + dashboards that cannot explain divergence under pressure.

Settler gives you a system of record for reconciliation operations:
- deterministic runs
- policy-checked routing
- review workflows
- tamper-evident evidence outputs

## How it works

1. **Ingest and normalize** records from source systems.
2. **Reconcile and route** mismatches with explicit rules/policies.
3. **Review and resolve** exceptions with operator context.
4. **Replay and prove** results with exported evidence artifacts.

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

- **Replay any run:** verify that reruns produce the same fingerprint for the same inputs/config.
- **Prove every result:** export evidence packs per run for audit and incident response.
- **Enforce policy in operations:** codify routing/review behavior instead of relying on tribal process.
- **Keep OSS control:** self-host the core runtime and keep enterprise add-ons optional.

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
- **Connections:** define external data sources.
- **Pipelines:** deterministic processing configurations.
- **Runs:** immutable execution instances.
- **Results:** normalized reconciliation outputs.
- **Review Queue:** operator decisions and resolution states.
- **Governance/Audit:** policy, evidence, and traceability surfaces.

Key packages:
- `packages/api` – reconciliation API/domain/infrastructure.
- `packages/web` – Next.js App Router product + console + docs routes.
- `packages/adapters` – connector/adaptor implementations.
- `packages/sdk`, `packages/react-settler`, `packages/sdk-go`, `packages/workhorse` – client and worker tooling.

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
