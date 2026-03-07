# Settler — Open Source Reconciliation Platform

**Settler runs deterministic reconciliation workflows, produces verifiable artifacts, and supports replay-backed audits for every execution.**

If Stripe, banking data, and your internal ledger disagree, Settler identifies mismatches, records why they happened, and exports proof artifacts you can replay later.

## What Settler does

1. **Workflow execution** across tenant-scoped connectors and policies.
2. **Deterministic reconciliation** with explicit matching rules.
3. **Mismatch detection** with review-ready context.
4. **Artifact + proof generation** (inputs, policy, outputs, hashes).
5. **Replay verification** against canonical execution artifacts.

## Five Minute Demo

```bash
pnpm install
cp .env.example .env
pnpm exec tsx scripts/run-migrations-remote.ts
pnpm --filter @settler/web dev
pnpm demo
pnpm settler:replay examples/demo-output/evidence.json
```

Demo outputs are written to `examples/demo-output` (`run.json`, `results.json`, `evidence.json`, `report.html`).

## Capability reality (OSS)

| Capability                         | Status                         | Notes                                                                                 |
| ---------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------- |
| Deterministic workflow execution   | ✅ Implemented                 | Deterministic guarantees apply to canonicalized inputs + rules + policy context.      |
| Replayable execution               | ✅ Implemented                 | Replay verifies outputs against stored artifacts and hashes.                          |
| Proof chains                       | ✅ Implemented                 | Hash-linked proof artifacts are generated and verified by scripts and runtime checks. |
| Policy enforcement                 | ✅ Implemented                 | Execution policy is evaluated during runtime and verification gates.                  |
| Connector normalization and safety | ✅ Implemented                 | Connector output normalization and sandbox controls are present in platform modules.  |
| AI copilot                         | ✅ Implemented (advisory only) | Copilot suggests actions; it does not execute workflow changes directly.              |
| Chaos-tested reliability           | ✅ Implemented                 | Chaos harness and reliability scripts validate deterministic invariants.              |
| Multi-tenant isolation             | ✅ Implemented                 | Tenant boundaries enforced through RLS and isolation checks.                          |

See [docs/positioning/CLAIM_VALIDATION.md](docs/positioning/CLAIM_VALIDATION.md) for claim-by-claim evidence and boundaries.

## Core primitives

Settler documentation and user-facing surfaces normalize to these primitives:

- **Workflow**
- **Execution**
- **Artifact**
- **Proof**
- **Replay**
- **Policy**
- **Connector**
- **Event**
- **Tenant**
- **Copilot**
- **Chaos Harness**

Reference: [docs/TERMINOLOGY.md](docs/TERMINOLOGY.md).

## Quickstart

Prerequisites:

- Node.js 24+ (see `.nvmrc`)
- pnpm 10.13.1+
- Postgres or Supabase

Set environment values:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Run locally:

```bash
pnpm install
pnpm exec tsx scripts/run-migrations-remote.ts
pnpm --filter @settler/web dev
```

Open `http://localhost:3000`.

## Key packages

- `packages/api` – reconciliation API, domain logic, and data layer
- `packages/web` – Next.js web app (console, docs, marketing)
- `packages/adapters` – connector implementations for Stripe, banks, ERPs, and other sources
- `packages/sdk`, `packages/react-settler`, `packages/sdk-go`, `packages/workhorse` – SDKs and workers

## Documentation path

- Start here: [`docs/START_HERE.md`](docs/START_HERE.md)
- Quick start + onboarding: [`docs/getting-started/README.md`](docs/getting-started/README.md)
- Core concepts + guarantees: [`docs/TERMINOLOGY.md`](docs/TERMINOLOGY.md), [`docs/SYSTEM_GUARANTEES.md`](docs/SYSTEM_GUARANTEES.md)
- Workflows and execution: [`docs/WORKFLOWS.md`](docs/WORKFLOWS.md), [`docs/ENGINE.md`](docs/ENGINE.md)
- Proofs and replay: [`docs/EVIDENCE.md`](docs/EVIDENCE.md), [`docs/LINEAGE.md`](docs/LINEAGE.md)
- Connectors: [`docs/integrations/connectors-overview.md`](docs/integrations/connectors-overview.md)
- AI copilot + chaos harness: [`MODEL_SPEC.md`](MODEL_SPEC.md), [`platform/chaos-harness.ts`](platform/chaos-harness.ts)
- Architecture + contributing: [`ARCHITECTURE.md`](ARCHITECTURE.md), [`CONTRIBUTING.md`](CONTRIBUTING.md)

## License and support

- License: [`LICENSE`](LICENSE)
- Security reports: [`SECURITY.md`](SECURITY.md)
