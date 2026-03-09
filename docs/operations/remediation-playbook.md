# Remediation Playbook

## Auto-remediation Rules (Safe)

- `rule-rate-limit-backoff`: bounded retry for idempotent rate-limit failures.
- `rule-queue-fencing-retry`: single retry with fence and idempotency key.
- `rule-validation-quarantine`: quarantine malformed payloads.
- `rule-timeout-reschedule`: reschedule timed-out work only when commit evidence is absent.

## Operator-only Remediations

Do not auto-execute:

- financial/ledger mutation paths
- cross-tenant operations
- policy bypasses
- destructive record operations
- non-idempotent external replay actions

## Lifecycle

1. Record failure.
2. Match remediation rule.
3. Run safety predicates.
4. Execute bounded action.
5. Record outcome with remediation evidence.
6. Verify post-condition.
7. Escalate with guidance if blocked.

## Operator Commands

- `settler failures list`
- `settler failures show <failure_id>`
- `settler failures clusters`
- `settler failures trends`
- `settler failures remediate <failure_id>`

(Commands use the control-plane failure API as source of truth.)
