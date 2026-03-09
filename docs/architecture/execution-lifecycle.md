# Canonical Execution Lifecycle

Settler uses a shared lifecycle for CLI, API, worker, and replay execution paths:

1. request received
2. input validated
3. execution initiated
4. policy evaluation
5. execution steps performed
6. outputs produced
7. proof generated
8. results persisted
9. response returned
10. event logged

## Canonical states

Execution state transitions are constrained to:

- `PENDING`
- `RUNNING`
- `FAILED`
- `COMPLETED`

Any adapter-specific or route-specific statuses should be mapped to this canonical state set in receipts, logs, and replay artifacts.
