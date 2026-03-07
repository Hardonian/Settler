# Settler Architecture Overview

Settler is an Open Source Reconciliation Engine with a simple surface and a deterministic core.

## System Shape

- **Web surface (`packages/web`)**: Dashboard, docs, and demo UX.
- **API surface (`packages/api` + `packages/web/src/app/api`)**: Run creation, run listing, metrics, and evidence access.
- **Engine + runner (`runner`, `scripts/moat`)**: Deterministic run execution and replay verification.
- **Platform layer (`platform/`)**: Unified subsystem integration — trust graph, policy simulator, AI copilot, chaos harness, event consumers, connector registry.
- **Connector ecosystem (`packages/adapters`)**: Sandboxed external data connectors with normalization.
- **CLI (`packages/cli`)**: Command-line interface including MCP server, replay lab, foundry, and proof verification.
- **Protocol (`packages/protocol`)**: Framework-agnostic types for reconciliation workflows.
- **Storage (Postgres/Supabase via Prisma)**: Tenant-scoped run state and metrics.

## Runtime Flow

1. Operator or integration starts a run.
2. Engine processes normalized records deterministically.
3. Policy engine compiles and enforces governance rules.
4. Results + evidence are persisted as content-addressed artifacts.
5. Event backbone distributes events to subsystem consumers.
6. Trust graph records execution lineage and artifact provenance.
7. Replay verifies fingerprints for provable outcomes.

## Subsystem Architecture

### Core Primitives (`platform/primitives.ts`)

All subsystems share these canonical types:

| Primitive   | Purpose                                    |
|-------------|---------------------------------------------|
| Execution   | A workflow run with input/output hashes     |
| Artifact    | Content-addressed output (evidence, report) |
| Workflow    | Tenant-scoped reconciliation definition     |
| Policy      | Governance rules with budgets and identity  |
| Connector   | External data source adapter                |
| Event       | Durable, idempotent platform event          |
| Proof       | Cryptographic proof capsule with hash chain |
| Tenant      | Isolated organizational boundary            |

### Trust Graph (`platform/trust-graph.ts`)

- **Nodes**: Execution, Artifact, Policy, Connector, Proof
- **Edges**: produced, consumed, governed_by, proved_by, sourced_from, replayed_from, derived_from
- Tenant-isolated: cross-tenant edges are forbidden
- Content-addressed: node IDs are deterministic hashes
- Snapshotable: produces a root hash for graph verification

### Event Backbone (`runner/eventBackbone.ts` + `platform/event-consumers.ts`)

- **Append-only NDJSON log** with idempotency keys
- **Consumer offset tracking** for exactly-once processing
- **Consumers**: Trust Graph, Observability, Policy Audit, Connector Metrics
- **Replayable**: same event stream for live execution and replay

### Policy Engine & Simulator (`policies/` + `platform/policy-simulator.ts`)

- **Compilation** to enforcement plans with hash-based integrity
- **Simulation**: what-if analysis against historical executions
- **Comparison**: diff two policies to see retroactive impact

### Determinism Guarantees (`platform/determinism.ts`)

- **Auditor**: detects timestamps, random IDs, AI mutations, connector non-determinism
- **Execution Fence**: blocks non-deterministic operations during deterministic blocks
- **Connector Output Normalizer**: replaces random UUIDs with deterministic IDs
- **Replay Verification**: asserts fingerprint match

### AI Copilot (`platform/ai-copilot.ts`)

- Advisory-only — never executes directly
- Blocked during deterministic execution via execution fence
- Requires human review; full audit trail
- Rate-limited per execution

### Chaos Harness (`platform/chaos-harness.ts`)

- **Fault types**: worker crash, network partition, connector failure, event delay, partial write, artifact corruption
- **Invariant checks**: replay correctness, proof integrity, execution idempotency, tenant isolation

### MCP Server (`packages/cli/src/mcp/server.ts`)

Exposes: runWorkflow, replayExecution, verifyProof, inspectPolicy, traceArtifact, listConnectors, eventBackboneHealth.

## Data Flow

```
workflow trigger → event backbone → policy enforcement → worker execution
→ artifact generation → proof pack → trust graph update → observability
```

## Determinism Contract

1. AI cannot modify deterministic execution path directly.
2. Connector outputs are normalized; random UUIDs → deterministic IDs.
3. All workflow state transitions are deterministic.
4. Replay produces identical fingerprints.
5. Non-deterministic operations are blocked inside execution fence.

## Deep Dive

For detailed internals (deterministic replay, content-addressed evidence, policy engine, run storage, and execution model), read [`docs/ENGINE.md`](docs/ENGINE.md).
