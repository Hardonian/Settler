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

Detailed boundary notes: [`docs/oss-vs-enterprise.md`](docs/oss-vs-enterprise.md).

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

## CLI Install (release artifacts)

Use signed release artifacts and SHA256 checksums for install.

```bash
curl -fsSL https://raw.githubusercontent.com/settler/settler/main/scripts/install/install.sh | bash
settler version
settler doctor
```

Windows PowerShell:

```powershell
irm https://raw.githubusercontent.com/settler/settler/main/scripts/install/install.ps1 | iex
settler version
settler doctor
```

See [`LAUNCHKIT.md`](LAUNCHKIT.md) for artifact naming, manual checksum verification, and release workflow details.

## One-command demo

```bash
pnpm demo
```

The demo is local-only, deterministic, and writes proof artifacts to `examples/demo-output` (`run.json`, `results.json`, `evidence.json`, `report.html`). Replay is first-class via:

```bash
pnpm settler:replay examples/demo-output/evidence.json
```

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

## Support

- Issues: open a GitHub issue with reproduction details.
- Discussions: use GitHub Discussions for Q&A and architecture proposals.
- Security reports: follow [`SECURITY.md`](SECURITY.md).

## Deterministic Proof Links

- Demo guide: `docs/demo.md`
- Determinism contract: `docs/determinism.md`
- Policy compiler and runtime guards: `docs/policies.md`
- Investor truth anchors: `docs/investor.md`
