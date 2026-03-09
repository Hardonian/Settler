# Settler

Settler is an OSS-first platform for **deterministic execution, replay verification, and traceable operational history**.

It is designed for teams that need more than “job succeeded/failed.” Settler records what ran, why it ran, what policy was applied, and whether the same run can be replayed with matching outcomes.

## Mental model

Think of Settler as a **git-style execution ledger** for operational workflows:

- Every run has a structured record.
- Every run can emit a proof bundle.
- Every run can be replayed to test determinism.
- Divergence is explicit and inspectable, not hidden in logs.

## Core capabilities

- **Deterministic proof engine**: canonicalized inputs + stable hashing + verification artifacts.
- **Replay lab**: rerun captured executions and classify `match` vs `diverged` outcomes.
- **Execution ledger**: run history with trace IDs and append-oriented audit records.
- **Proof explorer + trust graph surfaces**: inspect evidence and lineage relationships.
- **Failure intelligence**: structured failure classes and recurrence analysis primitives.
- **Policy simulation**: evaluate policy outcomes without mutating production state.
- **Operational integrity spine**: trace propagation, structured error semantics, health routes.

## OSS-first model

Settler is open source and self-hostable by default. Enterprise/commercial capabilities are layered as deployment, governance, and support expansions rather than a closed core.

## High-level architecture

- **`packages/api`**: Express control plane, health/metrics, API routes, middleware, deterministic/replay services.
- **`packages/web`**: Next.js marketing + product surfaces (proof explorer, replay, policies, support, status).
- **`packages/cli`**: operator/developer CLI (`doctor`, `demo`, `replay`, `verify`, `policy`, `failures`, `tenant-check`).
- **`packages/sdk*`**: SDK clients for integration.
- **`docs/`**: canonical reference and runbooks.

## 5-minute quickstart

```bash
pnpm install
cp .env.example .env
pnpm demo
pnpm settler:replay examples/demo-output/evidence.json
```

Expected result: replay verification confirms deterministic equivalence for the demo capsule.

## Local development

```bash
# monorepo dev
pnpm dev

# run CLI diagnostics
pnpm --filter @settler/cli dev -- doctor

# show local stack commands
pnpm --filter @settler/cli dev -- dev stack
```

## Main interfaces

### CLI

- `settler doctor` — environment diagnostics.
- `settler demo` — deterministic local demo capsule.
- `settler replay` — replay-lab workflows.
- `settler verify` — proof capsule verification.
- `settler failures` — inspect structured failure records.
- `settler policy` — governance simulation commands.

### API (control plane)

- Health: `/health`, `/health/live`, `/health/ready`
- Metrics: `/metrics`
- Versioned API: `/api/v1/*`, `/api/v2/*`
- OpenAPI document endpoint under `/api/v1`

### Web/product routes

Public narrative and product pages include: `/product`, `/how-it-works`, `/replay-lab`, `/proof-explorer`, `/policies`, `/security`, `/oss`, `/enterprise`, `/status`, `/support`.

## Verification commands

```bash
pnpm --filter @settler/cli build
pnpm --filter @settler/cli dev -- --help
pnpm --filter @settler/api test:tenant-safety
pnpm --filter @settler/web validate:api-routes
```

## Documentation index

Start with [`docs/README.md`](docs/README.md), then use [`docs/INDEX.md`](docs/INDEX.md) by role.

## Security, tenancy, traceability

- Multi-tenant checks are enforced through tenant middleware and tenant-scoped route surfaces.
- Trace metadata is propagated via `X-Trace-Id` and execution identifiers.
- Error semantics favor machine-readable payloads and explicit degraded states.

See:

- [`docs/security/README.md`](docs/security/README.md)
- [`docs/operations/README.md`](docs/operations/README.md)
- [`docs/support/api-error-guide.md`](docs/support/api-error-guide.md)

## Maturity model (truthful status)

- **Stable**: deterministic demo path, health/metrics, CLI runtime diagnostics, tenant safety test suite.
- **Growing**: proof explorer, replay/graph product surfaces, policy simulation UX, failure intelligence depth.
- **Internal/advanced**: selected v2 strategic APIs and enterprise-oriented controls.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

Apache-2.0. See [`LICENSE`](LICENSE).
