# Settler

Settler is a deterministic reconciliation control plane for running auditable Connections → Pipelines → Runs → Results workflows with an operator Review Queue.

## OSS vs Enterprise at a Glance

### OSS (this repo, self-hostable)

- Reconciliation API and data model for organizations/workspaces, connections, pipelines, runs, results, rules, and review workflows.
- Next.js web surfaces for product, docs, and console operations.
- SDKs (`@settler/sdk`, `@settler/react-settler`, Go/Python scaffolding) and adapters.
- Baseline governance and audit primitives in core API/web flows.

### Enterprise (optional extensions)

- Enterprise route surfaces under `packages/web/src/app/enterprise` and enterprise API endpoints under `packages/web/src/app/api/enterprise`.
- Advanced governance/tenancy controls and premium operational panels.
- Enterprise capabilities are optional; OSS build and public routes work without enterprise-only configuration.

Detailed boundary notes: [`docs/OSS_VS_ENTERPRISE.md`](docs/OSS_VS_ENTERPRISE.md).

## Architecture Overview

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

## Quickstart (OSS)

Prerequisites:

- Node.js 22+
- pnpm 10.13.1+
- Postgres/Supabase

```bash
pnpm install
cp .env.example .env
```

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

## Environment Variables

### Minimal OSS

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Optional OSS Integrations

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Enterprise-only

- Enterprise operational variables are isolated to enterprise routes/modules and are optional for OSS runtime.
- Missing enterprise env must not crash public marketing/product routes.

## Local Development and Release Build

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Verification

```bash
pnpm verify
```

`pnpm verify` runs release gates including conflict-marker checks, lint, typecheck, test, build, smoke, boundary linting, and security audit threshold checks.

## Repository Structure

```text
packages/
  api/              # core reconciliation API
  web/              # Next.js app router surfaces
  adapters/         # connectors/adapters
  sdk/              # TS SDK
  react-settler/    # React bindings
  workhorse/        # Python worker
enterprise/         # enterprise-specific materials
docs/               # operational and product docs
scripts/            # verification and release automation
```

## License and Contributing

- License: [`LICENSE`](LICENSE)
- Contributing: [`CONTRIBUTING.md`](CONTRIBUTING.md)
