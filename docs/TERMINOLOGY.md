# Settler Terminology

This document defines the canonical platform primitives used across product copy, documentation, CLI help, and code comments.

## Canonical primitives

Use these terms by default:

| Primitive         | Definition                                                                                | Avoid in user-facing copy                      |
| ----------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **Workflow**      | A tenant-scoped reconciliation definition (sources, rules, policy, schedule).             | Pipeline                                       |
| **Execution**     | A single run of a workflow with deterministic inputs and policy context.                  | Job run, replay run (except in replay context) |
| **Artifact**      | Any content-addressed output produced by an execution (results, reports, snapshots).      | Execution output (generic), bundle file        |
| **Proof**         | A cryptographically verifiable chain that binds inputs, policy, and output hashes.        | ProofPack, evidence pack                       |
| **Replay**        | Re-execution and verification of an execution from canonical artifacts.                   | ReplayLab (for end-user naming)                |
| **Policy**        | Rules that govern execution safety, resource use, and control requirements.               | Governance (unless discussing org process)     |
| **Connector**     | Integration boundary for external systems (Stripe, Shopify, ERP, banks).                  | Adapter (in product docs and CLI help)         |
| **Event**         | Immutable platform event used for observability, replay, and audits.                      | Log record (as a primitive)                    |
| **Tenant**        | Isolation boundary for data, policy, permissions, and execution history.                  | Workspace (unless UI label is fixed)           |
| **Copilot**       | Advisory AI assistant that suggests actions; it never executes workflow changes directly. | Autonomous agent                               |
| **Chaos Harness** | Deterministic failure-injection and invariant verification suite.                         | Chaos engine (for user-facing naming)          |

## Product-language conventions

- Prefer **Proof artifacts** over “evidence packs” in new docs.
- Prefer **Connector** over “adapter” in README/docs/CLI surfaces.
- Keep **Replay** as the primary term; legacy internal modules may retain `replay-lab` naming for compatibility.
- Use **Policy enforcement** for runtime controls; reserve “governance” for project/process docs.
- Use **Artifact** when referencing stored execution output.

## Compatibility notes

Some implementation paths still contain legacy names (`packages/adapters`, `replay-lab`, `EvidenceManifest`). These are compatibility details, not product-language primitives.

When updating user-facing surfaces, normalize to canonical terms and add a compatibility note only if needed.
