# Self-Healing Guardrails

## Hard Guardrails

- No silent suppression of failures.
- No destructive automatic action.
- No automatic cross-tenant mutation.
- No policy bypass remediations.
- No infinite remediation loops.

## Enforced Controls

- **Rule gating**: remediation requires explicit class->rule match.
- **Safety predicates**: idempotency key requirements and auto-safety checks.
- **Attempt cap**: per-rule max attempts per failure.
- **Backoff metadata**: each rule defines deterministic backoff behavior.
- **Audit trail**: every attempt records trigger mode, rule, checks, action, outcome, timestamp, trace.

## Degradation Behavior

When safety checks fail, system returns:

- blocked remediation outcome
- precise reason in notes
- operator guidance with trace/artifact references
