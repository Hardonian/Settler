# Settler Platform Overview

Last updated: 2026-03-12

Settler is a unified platform with four cooperating layers:

1. **Rust kernel** for deterministic compute primitives and hash/evidence stability.
2. **TypeScript control plane** for orchestration, tenancy, policy, and API contracts.
3. **CLI** for operator and power-user workflows.
4. **Console** for day-two operations, enterprise governance, and observability.

## Layer roles

- **Kernel:** deterministic canonicalization, proof-bundle hashing, artifact identity hashing.
- **Control plane:** request orchestration, fallback handling, multi-tenant controls, metrics APIs.
- **CLI:** run/replay/foundry/verification workflows, preflight diagnostics, automation entrypoint.
- **Console:** operational dashboards, reconciliations, proofs, replay lab, policies, organizations, audit centers.

## Enterprise capabilities

Enterprise differentiation is surfaced through:

- bulk audit workflows and job orchestration
- policy governance and access controls
- deterministic replay and proof explorer
- cross-ledger reconciliation and drift analysis
- compliance evidence export
- operational monitoring dashboards
- AI insight/anomaly surfaces (where implemented)

## Safety and trust posture

- Kernel execution includes fallback-safe TypeScript implementations.
- Degraded states are explicit and measurable.
- Operation-level disable flags support controlled rollback.
- Readiness checks verify binary availability and operation support before primary use.

## What this means for launch

Settler is presented as one coherent platform:

- deterministic kernel primitives
- orchestrated control plane workflows
- CLI power path
- Console operational path
- enterprise-grade governance and evidence surfaces

Claims beyond implemented behavior are explicitly avoided.
