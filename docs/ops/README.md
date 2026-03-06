# Operations

Operational guidance for running Settler in production.

## Core references

- Operations baseline: [`docs/OPERATIONS.md`](../OPERATIONS.md)
- Operations runbook: [`docs/OPERATIONS_RUNBOOK.md`](../OPERATIONS_RUNBOOK.md)
- Deployment notes: [`docs/deployment-notes.md`](../deployment-notes.md)
- Incident response: [`docs/INCIDENT_RESPONSE.md`](../INCIDENT_RESPONSE.md)

## Reliability principles

- Deterministic runs are immutable and replayable.
- Exceptions are reviewed in explicit lifecycle states.
- Failures should degrade gracefully on user-facing routes and preserve audit lineage.
