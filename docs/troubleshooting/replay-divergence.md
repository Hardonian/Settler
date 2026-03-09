# Replay Divergence

## Symptom

Replay result does not match original run hash or outcome.

## Likely causes

- Input payload changed after original capture.
- Rule set/version changed.
- Adapter normalization logic changed.
- Environment-dependent behavior leaked into execution.

## Steps

1. Confirm proof/replay artifact references the expected input.
2. Compare rule versions and adapter versions.
3. Re-run with identical environment flags.
4. Inspect failure records (`settler failures`).
5. Escalate if deterministic boundaries are broken for unchanged inputs.

## Safe remediation

- Do not overwrite original artifact.
- Record divergence with trace ID.
- Open incident if multiple tenants are impacted.
