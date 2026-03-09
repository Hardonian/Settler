# Proof Verification Failures

## Symptom

`settler verify` or replay verification reports failed proof/capsule validation.

## Checks

1. Artifact integrity (no manual edits).
2. Hash algorithm expectations match implementation.
3. Required metadata fields are present.
4. Input/output snapshots are from the same run.

## Operator workflow

- Capture `trace_id` and execution metadata.
- Generate bug bundle via `settler bugreport`.
- Cross-check with audit trail endpoints.

## Non-goals

Proof verification does not establish business correctness of input data; it establishes execution integrity against recorded artifacts.
