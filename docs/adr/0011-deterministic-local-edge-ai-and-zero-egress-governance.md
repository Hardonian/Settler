# ADR 0011: Deterministic Local Edge AI and Zero-Egress Governance

## Status

Accepted

## Context

Financial reconciliation engines operating under enterprise governance cannot tolerate non-deterministic or generative hallucination in variance analysis. Previous industry architectures that relied on off-the-shelf Large Language Models (LLMs) to explain discrepancies suffered from critical vulnerabilities:

1. **Generative Hallucination**: LLMs frequently invent speculative narratives for balance variances (e.g., alleging exchange rate shifts or chargebacks) without verifying arithmetic proofs against raw ledger entries.
2. **Data Egress and Confidentiality Risk**: Transmitting sensitive transaction amounts, customer identifiers, and account numbers to third-party cloud LLM APIs violates data sovereignty and PCI-DSS / SOC 2 requirements.
3. **Unbounded Autonomous Agency**: Autonomous background agents that directly trigger ledger adjustments or database mutations introduce operational failure modes, including runaway balance corrections and unintended funds movement.

## Decision

We establish a strict dual-layer governance architecture for all automated discrepancy intelligence and AI agent operations:

### 1. Deterministic Local Edge AI (`@settler/edge-ai-core`)
- Root-cause discrepancy classification (`PROCESSOR_FEE_DEDUCTION`, `FX_CONVERSION_SPREAD`, `SETTLEMENT_TIMING_DRIFT`, `REFERENCE_ID_MUTATION`) must be computed **purely via deterministic mathematical proofs** calculated locally from numeric field deltas and ISO-8601 timestamps.
- **Zero Generative Hallucination**: No textual explanation is presented without an accompanying deterministic mathematical proof. If delta checks fail tolerance thresholds (e.g., fee formula verification fails or FX rates deviate from ECB reference rates), the engine flags an unclassified exception rather than guessing.
- **Zero Egress**: All classifications execute locally in-process without outbound cloud API requests or external telemetry egress.

### 2. Autonomous Agent Policy-Token Bounded Governance (`JobForgeClient`)
- All 5 autonomous agents in `packages/api/src/services/ai-agents/` (`InfrastructureOptimizerAgent`, `AnomalyDetectorAgent`, `SyntheticUserSimulatorAgent`, `SupportCopilotAgent`, `ReleaseQAAgent`):
  - Strictly output **draft-only job requests** (`autoExecute: false, requireApproval: true`).
  - Declare explicit governance metadata: `riskLevel`, `estimatedImpact`, `requiresHumanReview: true`, and `signedPolicyBound`.
  - Are formally barred from bypassing `JobForgeClient` or executing direct database mutations/ledger transfers.
- **Enforced Execution Invariant**: Direct execution of any high-privilege action strictly enforces `assertSignedPolicyToken(policyToken)`, requiring an authenticated, cryptographically signed policy token issued after human approval.

## Consequences

### Positive
- **100% Deterministic Financial Explanations**: Variance classifications are mathematically guaranteed by arithmetic proofs.
- **Full Data Sovereignty**: All analysis is local-first, offline-capable, and private.
- **Elimination of Agent Runaway Risk**: No AI agent can autonomously mutate financial records or trigger transfers without human-in-the-loop signoff.

### Negative / Trade-offs
- Novel, unmodeled discrepancy types require explicit formula definitions rather than relying on generative approximations.
- Human review is required to approve draft remediation jobs before execution.
