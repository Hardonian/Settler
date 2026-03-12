# Settler Platform Architecture (Canonical)

> Back to platform truth index: [`docs/platform-index.md`](../platform-index.md)

This document is the canonical architecture explanation for Settler.

## 1) Architecture in one view

Settler is composed of five primary layers:

1. **Rust kernel (deterministic compute boundary)**
2. **TypeScript control plane (policy, tenancy, orchestration boundary)**
3. **CLI surface (operator and automation interface)**
4. **Console surface (operator visualization and controls)**
5. **Enterprise integration layer (connectors, policy and enablement controls)**

## 2) Rust kernel role

The Rust kernel provides deterministic primitives with explicit fallback semantics.

Primary responsibilities:

- Canonicalization and stable hashing primitives.
- Deterministic proof and artifact identity operations.
- Typed failure envelopes consumable by TS callers.

Non-responsibilities (kept out of kernel for safety boundary clarity):

- Tenant authN/authZ.
- Persistence and DB writes.
- API request lifecycle and route policy.

Canonical reference: [`docs/architecture/rust-kernel-boundary.md`](./rust-kernel-boundary.md).

## 3) TypeScript control plane responsibilities

The control plane (`packages/api`) is the source of truth for runtime policy and tenant safety.

Responsibilities:

- Route handling and API contracts.
- Tenant boundary enforcement and auth integration.
- Idempotency, request controls, and operational policy checks.
- Orchestration of kernel operations with explicit fallback behavior.
- Health/readiness surfaces for operators.

Canonical references:

- [`docs/architecture/system-architecture.md`](./system-architecture.md)
- [`docs/api/README.md`](../api/README.md)
- [`docs/TENANT_ISOLATION_VERIFICATION.md`](../TENANT_ISOLATION_VERIFICATION.md)

## 4) CLI interface responsibilities

The CLI (`packages/cli`) is the deterministic operator interface for local and CI workflows.

Responsibilities:

- Foundry generation and replay verification.
- Environment diagnostics and support bundle paths.
- Deterministic execution harnessing in automation pipelines.

Canonical references:

- [`packages/cli/README.md`](../../packages/cli/README.md)
- [`packages/cli/KERNEL_RUNNER.md`](../../packages/cli/KERNEL_RUNNER.md)

## 5) Console interface responsibilities

The console (`packages/web`) is the operator control and evidence surface.

Responsibilities:

- Run/proof/replay visibility.
- Operational status and support workflows.
- Human-in-the-loop incident and remediation workflows.

Canonical references:

- [`docs/console.md`](../console.md)
- [`docs/operations/operator-control-plane.md`](../operations/operator-control-plane.md)

## 6) Enterprise layers

Enterprise capabilities are additive controls and integrations on top of the core platform.

Common enterprise dimensions:

- Integration enablement and credential security controls.
- Policy and operational guardrails for managed environments.
- Stronger verification and evidence expectations for audits.

Canonical references:

- [`docs/setup/enterprise-enablement.md`](../setup/enterprise-enablement.md)
- [`docs/ENTERPRISE_QA.md`](../ENTERPRISE_QA.md)

## 7) Deployment assumptions

- Node + pnpm versions must match repository engine constraints.
- Runtime env keys must match canonical matrix.
- Safety controls (kill switches, shadow mode, feature flags) must be operator-visible.

Canonical references:

- [`docs/setup/env-matrix.md`](../setup/env-matrix.md)
- [`docs/setup/deployment-readiness.md`](../setup/deployment-readiness.md)
- [`docs/setup/operator-runbook.md`](../setup/operator-runbook.md)
