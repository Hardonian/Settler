# Settler

**Settler is a deterministic workflow platform for financial reconciliation that emits verifiable proof artifacts for every run.**

Engineering teams routinely hit the same failure mode: Stripe, bank exports, and internal ledgers diverge, but root-cause analysis is slow because execution history is incomplete or non-replayable. Settler solves this by combining deterministic execution, policy evaluation, and replay verification in one auditable path.

## Key capabilities

- **Deterministic workflow execution** for recon pipelines across normalized connector inputs.
- **Replay with cryptographic evidence** so every run can be re-verified from stored artifacts.
- **Policy-governed operations** that evaluate access, budgets, and guardrails as part of execution.

## Quick usage example

```bash
pnpm install
pnpm demo
pnpm settler:replay examples/demo-output/evidence.json
```

This generates `examples/demo-output/run.json`, `results.json`, `evidence.json`, and `report.html` from a deterministic Stripe↔QuickBooks demo workflow.

## Quick start (time-to-first-value)

1. **Clone + install**
   ```bash
   git clone https://github.com/settler/settler.git
   cd settler
   pnpm install
   ```
2. **Set environment values**
   ```bash
   cp .env.example .env
   ```
   For demo and replay, `DATABASE_URL` is not required.
3. **Execute a deterministic example workflow**
   ```bash
   pnpm demo
   ```
4. **Inspect outputs + proof**
   ```bash
   cat examples/demo-output/results.json
   cat examples/demo-output/evidence.json
   ```
5. **Replay verification**
   ```bash
   pnpm settler:replay examples/demo-output/evidence.json
   ```

For expanded launch-oriented walkthroughs (example workflows, expected outputs, replay instructions), see [`docs/launch/QUICK_START.md`](docs/launch/QUICK_START.md).

## Architecture at a glance

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the runtime diagram and component flow (workflow execution, event backbone, workers, artifact store, proof generation, connector integrations, policy engine).

## Technical differentiation

Settler differs from generic workflow tools in five concrete ways:

1. **Determinism is enforced** (not advisory) via execution fences and canonicalization.
2. **Proof artifacts are first-class outputs** (`evidence.json`, fingerprints, hash-linked lineage).
3. **Replay is a built-in verification path**, not a best-effort debug mode.
4. **Policy evaluation is in the execution loop**, not a separate post-processing stage.
5. **Connector safety includes normalization + tenant boundaries** to reduce non-deterministic drift.

## Security evidence model

Security verification artifacts are machine-readable and intentionally explicit about evidence quality:

- `VERIFIED`: runtime or authenticated evidence confirms the claim.
- `DEGRADED`: checks passed, but confidence is reduced (e.g., missing authenticated advisory feed).
- `UNAVAILABLE`: evidence was not produced in this environment.
- `SKIPPED`: verification was intentionally not executed (for example, runtime-only probes during local work).
- `FAILED`: evidence demonstrates a failing control.

Artifacts are emitted to:

- `security/dependency-evidence.json`
- `security/rls-evidence.json`
- `security/security-verdict.json`

## Product surfaces and route map

Public routes include `/product`, `/reconciliation`, `/replay-lab`, `/proof-explorer`, `/policies`, `/security`, `/oss`, and `/enterprise`.

Control-plane routes include `/app/executions`, `/app/reconciliation`, `/app/replay`, `/app/proofs`, `/app/policies`, `/app/audit`, `/app/system-health`, and `/app/integrations`.

## Contributor on-ramp

- Read [`CONTRIBUTING.md`](CONTRIBUTING.md) for local setup and quality gates.
- Browse launch-ready examples in [`docs/launch/EXAMPLE_WORKFLOWS.md`](docs/launch/EXAMPLE_WORKFLOWS.md).
- Use issue/PR templates in [`.github/ISSUE_TEMPLATE`](.github/ISSUE_TEMPLATE) and [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md).

## License and security

- License: [`LICENSE`](LICENSE)
- Security policy: [`SECURITY.md`](SECURITY.md)
