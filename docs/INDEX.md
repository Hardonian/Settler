# Settler Documentation Index

This index provides a launch-ready reading path aligned to the current platform implementation.

## 1) START HERE

- [START_HERE.md](./START_HERE.md) — local setup, verification gates, and canonical entry points.

## 2) Quick Start

- [../README.md](../README.md) — five-minute demo and core platform capabilities.
- [getting-started/README.md](./getting-started/README.md) — step-by-step onboarding.

## 3) Core Concepts

- [TERMINOLOGY.md](./TERMINOLOGY.md) — canonical primitives and naming conventions.
- [PRODUCT_OVERVIEW.md](./PRODUCT_OVERVIEW.md) — product framing grounded in implementation.
- [SYSTEM_GUARANTEES.md](./SYSTEM_GUARANTEES.md) — determinism, replay, integrity, and isolation boundaries.

## 4) Workflows and Execution

- [WORKFLOWS.md](./WORKFLOWS.md) — workflow modeling and execution lifecycle.
- [ENGINE.md](./ENGINE.md) — deterministic reconciliation engine internals.
- [CONSOLE.md](./CONSOLE.md) — operator workflow inside the web console.

## 5) Proofs and Replay

- [EVIDENCE.md](./EVIDENCE.md) — artifact generation and verification chain.
- [LINEAGE.md](./LINEAGE.md) — execution lineage and traceability model.
- [positioning/CLAIM_VALIDATION.md](./positioning/CLAIM_VALIDATION.md) — product claim validation status.

## 6) Connectors

- [integrations/connectors-overview.md](./integrations/connectors-overview.md) — connector model and integration guidance.
- [REGISTRY.md](./REGISTRY.md) — connector/rule registry references.
- [integration-recipes.md](./integration-recipes.md) — implementation examples.

## 7) AI Copilot

- [MODEL_SPEC.md](../MODEL_SPEC.md) — advisory AI guardrails and behavioral boundaries.
- [platform/ai-copilot.ts](../platform/ai-copilot.ts) — copilot implementation reference.

## 8) Chaos Testing

- [platform/chaos-harness.ts](../platform/chaos-harness.ts) — deterministic fault injection model.
- [scripts/stress-reliability.ts](../scripts/stress-reliability.ts) — event backbone reliability verification.

## 9) Policy

- [ACCESS_CONTROLS.md](./ACCESS_CONTROLS.md) — authorization and enforcement patterns.
- [SECURITY_INVARIANTS.md](./SECURITY_INVARIANTS.md) — mandatory security invariants.
- [RLS_POLICY_VERIFICATION.md](./RLS_POLICY_VERIFICATION.md) — tenant isolation verification.

## 10) Architecture

- [../ARCHITECTURE.md](../ARCHITECTURE.md) — top-level system architecture map.
- [architecture/README.md](./architecture/README.md) — architecture deep dives.
- [SOURCE_OF_TRUTH.md](./SOURCE_OF_TRUTH.md) — authoritative documentation boundaries.

## 11) Contributing

- [../CONTRIBUTING.md](../CONTRIBUTING.md) — contribution process and quality gates.
- [contributing.md](./contributing.md) — contributor onboarding notes.
- [MAINTAINER_GUIDE.md](./MAINTAINER_GUIDE.md) — release and maintenance operations.

---

### Notes on legacy docs

The repository contains historical and GTM-focused documentation that is still useful context, but may use legacy terms (`adapter`, `ReplayLab`, `evidence pack`). For launch-facing and developer onboarding surfaces, follow this index and [TERMINOLOGY.md](./TERMINOLOGY.md).
