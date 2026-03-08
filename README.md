# Settler

**Settler is a deterministic reconciliation engine for financial data that emits verifiable evidence artifacts for every run.**

Engineering teams hit the same failure mode: Stripe, bank exports, and internal ledgers diverge, but root-cause analysis is slow because execution history is incomplete or non-replayable. Settler solves this by combining deterministic execution, explicit rule evaluation, and replay verification in one auditable path.

## What it produces

Every reconciliation run writes four outputs to `examples/demo-output/` (or your configured output path):

| File | Contents |
|------|----------|
| `run.json` | Execution metadata: timing, adapter versions, rule set used |
| `results.json` | Match/mismatch summary with rule path traces for every record pair |
| `evidence.json` | SHA-256 hash-linked audit artifact — the replay-verification input |
| `report.html` | Human-readable mismatch report for review packages |

## Quick start — first run in 5 minutes

No database or API keys required for the demo path.

```bash
# Clone and install
git clone https://github.com/Hardonian/Settler.git
cd Settler
pnpm install

# Copy env (DATABASE_URL not required for demo)
cp .env.example .env

# Run a Stripe↔QuickBooks demo reconciliation
pnpm demo

# Inspect results and evidence
cat examples/demo-output/results.json
cat examples/demo-output/evidence.json

# Replay verification — re-runs deterministically and confirms hash match
pnpm settler:replay examples/demo-output/evidence.json
```

For SDK-based reconciliation against your own data sources, see [`docs/launch/QUICK_START.md`](docs/launch/QUICK_START.md).

## Key capabilities

- **Deterministic execution** — same inputs and rules always produce the same output.
- **Evidence artifacts are first-class outputs** — `evidence.json` with SHA-256 fingerprints, not debug logs.
- **Replay verification** — re-run any past reconciliation from stored artifacts to confirm results.
- **Policy evaluation in the execution loop** — access controls and guardrails evaluated at runtime, not post-hoc.
- **Connector normalization** — adapters normalize inputs into a canonical schema before matching, reducing non-deterministic drift.

## Why determinism matters

Most reconciliation workflows fail during root-cause analysis, not during the run itself. When a variance surfaces in production, you need to know: did the rule change? Did the data change? Did the engine behave differently?

Settler eliminates that uncertainty. Determinism makes debugging tractable, rule testing reliable, and audit straightforward.

## Technical differentiation

Settler differs from generic workflow tools in five concrete ways:

1. **Determinism is enforced** (not advisory) via execution fences and canonicalization.
2. **Proof artifacts are first-class outputs** (`evidence.json`, fingerprints, hash-linked lineage).
3. **Replay is a built-in verification path**, not a best-effort debug mode.
4. **Policy evaluation is in the execution loop**, not a separate post-processing stage.
5. **Connector safety includes normalization + tenant boundaries** to reduce non-deterministic drift.

## Architecture at a glance

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the runtime diagram and component flow: workflow execution, event backbone, workers, artifact store, proof generation, connector integrations, and policy engine.

## Security evidence model

Security verification artifacts are machine-readable and intentionally explicit about evidence quality:

- `VERIFIED`: runtime or authenticated evidence confirms the claim.
- `DEGRADED`: checks passed, but confidence is reduced (e.g., missing authenticated advisory feed).
- `UNAVAILABLE`: evidence was not produced in this environment.
- `SKIPPED`: verification was intentionally not executed (e.g., runtime-only probes during local development).
- `FAILED`: evidence demonstrates a failing control.

Artifacts are written to:

- `security/dependency-evidence.json`
- `security/rls-evidence.json`
- `security/security-verdict.json`

## Product surfaces

**Public routes:** `/product`, `/how-it-works`, `/reconciliation`, `/replay-lab`, `/proof-explorer`, `/policies`, `/security`, `/oss`, `/enterprise`

**Control-plane routes:** `/app/executions`, `/app/reconciliation`, `/app/replay`, `/app/proofs`, `/app/policies`, `/app/audit`, `/app/system-health`, `/app/integrations`

## Contributor on-ramp

1. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) for local setup, package layout, and quality gates.
2. Run `pnpm demo` to verify your environment produces a working evidence artifact.
3. Browse [`docs/launch/EXAMPLE_WORKFLOWS.md`](docs/launch/EXAMPLE_WORKFLOWS.md) for walkthrough examples with expected outputs.
4. Check open issues for **good first issue** labels, or open a proposal before starting larger changes.
5. Use issue/PR templates in [`.github/ISSUE_TEMPLATE`](.github/ISSUE_TEMPLATE) and [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md).

Good first contributions: documentation fixes, new adapter integrations (see `packages/adapters/src/drivers/`), SDK examples, and minor UI improvements.

## License and security

- License: [`LICENSE`](LICENSE) — Apache 2.0
- Security policy: [`SECURITY.md`](SECURITY.md)
- Report security issues: `security@settler.dev`
