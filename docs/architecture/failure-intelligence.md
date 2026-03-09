# Failure Intelligence Architecture

Settler now uses a deterministic failure intelligence pipeline:

1. **Classification**: incoming failures are mapped to one of 17 canonical classes.
2. **Persistence**: each failure is appended to an audit-safe in-memory store abstraction with linked artifacts.
3. **Root-cause hypotheses**: ranked, evidence-backed hypotheses are produced from class, signature recurrence, and replay/dependency signals.
4. **Recurrence clustering**: failures are clustered by normalized signature + deployment/policy versions.
5. **Remediation policy execution**: rule-based, safety-gated remediation attempts execute only for eligible classes.
6. **Operator copilot guidance**: blocked/unsafe paths emit concrete next-step guidance.
7. **Dashboard/API outputs**: trends, clusters, MTTR, and auto-remediation success are queryable.

## Key Invariants

- No hidden errors; all failures are retained with traceability fields.
- Tenant scope filtering is enforced at query/read time.
- Auto-remediation requires policy match + safety predicates + attempt caps.
- Unsafe or unproven remediation is blocked and escalated.

## Data Model Highlights

`FailureRecord` preserves:

- `failureId`, `failureClass`, `severity`
- `traceId`, `executionId`, `tenantId`
- `component`, `operation`, `timestamp`
- `humanSummary`, `machineDetails`
- `retryable`, `safeToAutoRemediate`
- ranked `rootCauseHypothesis`
- `remediationStatus` and attempt history.
