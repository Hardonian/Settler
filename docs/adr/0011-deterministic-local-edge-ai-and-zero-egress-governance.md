# ADR 0011: Deterministic Local Edge AI and Zero-Egress Governance

## Status

Accepted

## Context

Generative text is not evidence for a financial discrepancy. Agent output also crosses a privilege boundary: proposing work and executing work are different capabilities. A tenant, action, or payload change after approval must invalidate authorization.

## Decision

- `@settler/edge-ai-core` classifies only from supplied numeric fields, declared fee/rate schedules, bounded timestamp differences, and reference similarity. Missing benchmarks or out-of-bound deltas return an unknown/unproven result rather than a guessed cause.
- Classification is local and has no network dependency. Narrative UI may summarize the returned arithmetic proof but may not upgrade its certainty.
- Each of the five API agents emits `AgentJobDraft` with `autoExecute: false`, `requireApproval: true`, and `requiresHumanReview: true`.
- The API governance broker is the approval boundary. JobForge is an optional durable dispatch transport after approval; its presence does not replace authorization checks in the handler.
- A policy token is HMAC-SHA-256 signed and bounded to tenant, agent, execution action, canonical payload hash, approval nonce, issue time, and expiry (maximum 15 minutes). Missing or weak signing configuration fails closed.
- Tenant context is resolved from the authenticated request. Agent payloads cannot select or override it. Tenant-scoped agent histories and database queries include that context.
- Direct mutations are permitted only in an explicitly privileged handler after token verification. Draft creation, analysis, and explanation paths do not mutate ledger state.

## Consequences

- Novel discrepancy types remain unclassified until a reviewed deterministic rule exists.
- Human approval adds latency to remediation.
- In-memory draft storage is preview-only. Production durability and cross-instance token replay prevention require the JobForge/database-backed deployment path; the strategic surface must remain gated until configured.

## Verification

- `packages/edge-ai-core/src/__tests__/discrepancy-classifier.test.ts`
- `packages/api/src/services/ai-agents/__tests__/agent-governance.test.ts`
- API route authorization and tenant-isolation tests
