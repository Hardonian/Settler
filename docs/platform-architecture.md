# Platform Architecture (Launch Convergence)

Last updated: 2026-03-12

## System responsibilities

### Rust kernel

The Rust kernel provides deterministic compute primitives used by reconciliation and evidence paths:

- canonicalization and stable hashing operations (`canonicalize_hash`, `proof_bundle_hash`, `artifact_identity_hash`)
- protocol/version-checked execution envelopes
- deterministic replay support through hash and evidence stability guarantees

### TypeScript control plane

The TypeScript control plane coordinates user workflows and safety boundaries:

- API orchestration and tenancy-aware request handling
- fallback execution paths and degraded-state signaling
- policy controls, job orchestration, and export/report surfaces

### CLI

The CLI is the power-user/operator interface:

- deterministic local workflows (demo, replay, foundry, verification)
- kernel readiness checks and fallback-aware execution
- scriptable bulk operations for enterprise/internal operations

### Console

The Console is the operational interface:

- run/reconciliation/proof/replay visibility
- enterprise policy/governance/admin surfaces
- operations dashboards and live observability signals

### Documentation layer

Documentation is treated as an operational surface:

- capability-to-surface mapping
- safety-control and fallback semantics
- enterprise differentiation without unverifiable claims

## Runtime flow

1. User initiates action via Console, API, or CLI.
2. Control plane authorizes tenant scope and evaluates policy/feature gating.
3. Kernel primitives execute where enabled; TS fallback remains deterministic and machine-visible when required.
4. Evidence and metrics are produced for replay, audits, and diagnostics.
5. Console/docs expose outcomes and operational health.

## Launch-readiness invariants

- No critical user route should hard-500 due to kernel unavailability.
- Kernel degradation must be explicit (`fallbackReason`, health/degraded signals).
- Tenant boundaries are enforced as first-class API and operations concerns.
- Enterprise capabilities are discoverable in Console and docs.
- Docs claims are constrained to implemented, observable behavior.

## Repository partitioning

The repo is converged around these domains:

- kernel: `crates/settler-kernel`, `crates/settler-kernel-cli`
- control plane + app surfaces: `packages/api`, `packages/web`
- operator/automation surfaces: `packages/cli`, `scripts/`
- documentation and launch evidence: `docs/`, `reports/`, `evidence/`
