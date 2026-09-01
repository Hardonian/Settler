# Settler – MODEL_SPEC.md

Version: 2.0.0  
Last Updated: 2026-08-31

## Product Identity

Settler is a reconciliation-intelligence and exception/evidence operating system, not just a UI/API wrapper.

## Product Focus

- Deterministic reconciliation outcomes
- Operator-visible exception handling and adjudication
- Provenance-rich run detail and cryptographic evidence artifacts (proofpacks)
- Multi-tenant safety with explicit 5-layer security boundaries

## Operating Doctrine (Non-Negotiable)

- **Operator truth first:** Never present uncertain or degraded behavior as complete success.
- **Canonical run/detail truth:** Each run must remain replayable, attributable, and auditable.
- **Determinism by default:** Explicitly mark non-deterministic boundaries.
- **Evidence before claims:** Behavior assertions require tests/verification artifacts.
- **Tenant isolation always:** No cross-tenant data or metadata bleed.
- **Contract discipline:** No silent drift in API, policy, route-class, or evidence surfaces.
- **No AI slop or theater:** Concise, professional execution. No over-commenting, filler language, or generic placeholders.
- **Pragmatic Enterprise:** Architecture must be seed-ready, highly cost-effective (serverless/scale-to-zero), and avoid over-engineering.

## Work Classification Standard

All significant implementation work must be labeled:

- **Maintenance:** Cosmetic/polish consistency work.
- **Leverage:** Improvements in operator throughput, verification confidence, release safety, contract coherence.
- **Moat:** Compounding reconciliation intelligence, evidence depth, policy memory, workflow lock-in, audit trust.

## Required Pressure-Test for Major Feature Work

1. What new reconciliation intelligence compounds from real usage?
2. Which operator decisions/exceptions become reusable policy memory?
3. How does this strengthen evidence/provenance trust?
4. How does this increase switching cost/workflow centrality?
5. How are tenant boundaries and degraded-state semantics verified?

## Degraded-State Behavior Matrix

| Subsystem | Failure / Degradation Mode | Degraded Posture | Operator Notification |
| --- | --- | --- | --- |
| **AI Exception Copilot** | Model timeout / quota exhaustion | Fall back to deterministic rule matching; no auto-adjudication | Banner in exception workbench: "Rule-based fallback active" |
| **Redis Cache / Queue** | Cluster unreachable | Fall back to in-memory/direct database queries; retry BullMQ | Warning in `/api/v1/health`; jobs persist in DB queue table |
| **TigerBeetle Ledger** | Cluster sync latency > 500ms | Buffer transactions in Postgres staging; replay on restore | Operator console warns of ledger settlement lag |
| **External Source Adapter** | Rate-limited (429) / network timeout | Exponential backoff retry queue with dead-letter isolation | Adapter sync status shows `DEGRADED` with next retry timer |
| **Audit Proofpack Engine** | WASM / Rust kernel panic | Emit unhashed raw JSON evidence bundle marked `UNVERIFIED` | Critical audit alert; proof verification flags unsealed pack |

## Canonical Execution References

- `AGENTS.md`
- `SECURITY_INVARIANTS.md`
- `docs/repo-os/README.md`
- `docs/repo-os/verification-matrix.md`
- `docs/repo-os/checklists/implementation-pass.md`
- `prompts/IMPLEMENTATION_EXECUTION_HEADER.md`
