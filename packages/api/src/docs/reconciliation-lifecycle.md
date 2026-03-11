# Reconciliation Lifecycle Kernel

This document defines the canonical reconciliation aggregate lifecycle used by command handlers and projection ingestion.

## States

- `not_started`: no reconciliation events exist for the aggregate id.
- `in_progress`: reconciliation has started and has not reached a terminal state.
- `paused`: reconciliation execution is intentionally paused and resumable.
- `completed` (terminal): reconciliation succeeded and was finalized.
- `failed` (terminal): reconciliation failed due to execution error.
- `cancelled` (terminal): reconciliation failed with `CancellationError`.

## Allowed command transitions

- `start`: only allowed from `not_started`.
- `retry`: only allowed from `failed` or `cancelled`.
- `cancel`: only allowed from `in_progress` or `paused`.
- `pause`: only allowed from `in_progress`.
- `resume`: only allowed from `paused`.

All other transitions are rejected with `ReconciliationTransitionError` and surfaced to APIs as conflict errors.

## Execution attempt semantics

Each `ReconciliationStarted` event now carries:

- `execution_id`: unique id for that run attempt.
- `attempt_number`: monotonic attempt counter on the aggregate.
- `execution_kind`: `initial` or `retry`.
- `retry_of_execution_id`: the prior execution id when kind is `retry`.

This makes retry history replayable and auditable per-attempt.

## Invariants

- Tenant invariant: all events for a reconciliation aggregate must share the same `tenant_id` as the command/projection context.
- Finalization invariant: `completed` is terminal and cannot be retried/cancelled/restarted.
- Completion data invariant: finalized records must include `completed_at`, `finalization.finalized_at`, and non-negative duration.
- Projection invariant: mutating events after completion are rejected during projection processing.
- Cancellation semantic: cancellation is represented explicitly as `ReconciliationFailed` with `error.type = CancellationError` and mapped to lifecycle state `cancelled`.
