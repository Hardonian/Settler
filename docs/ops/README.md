# Operations

Operational guidance for running Settler in production.

## Core references

- Operations baseline: [`docs/OPERATIONS.md`](../OPERATIONS.md)
- Operations runbook: [`docs/OPERATIONS_RUNBOOK.md`](../OPERATIONS_RUNBOOK.md)
- Deployment notes: [`docs/deployment-notes.md`](../deployment-notes.md)
- Incident response: [`docs/INCIDENT_RESPONSE.md`](../INCIDENT_RESPONSE.md)

- GitHub triage routing: [`docs/ops/github-triage-routing.md`](./github-triage-routing.md)
- Observability error contract: [`docs/ops/observability-error-contract.md`](./observability-error-contract.md)
- Usage metering contract: [`docs/ops/usage-metering-contract.md`](./usage-metering-contract.md)
- Failed run triage runbook: [`docs/runbook/operator-failure-triage.md`](../runbook/operator-failure-triage.md)
- Operator terminology: [`docs/reference/operator-terminology.md`](../reference/operator-terminology.md)

## Reliability principles

- Deterministic runs are immutable and replayable.
- Exceptions are reviewed in explicit lifecycle states.
- Failures should degrade gracefully on user-facing routes and preserve audit lineage.
