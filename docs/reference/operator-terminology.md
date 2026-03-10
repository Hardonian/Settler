# Operator Terminology (Canonical)

Use these terms consistently across issues, docs, support, and telemetry contracts.

- **run**: a single reconciliation execution instance.
- **job**: scheduled or user-triggered unit that may create one or more runs.
- **replay run**: deterministic re-execution of a prior run.
- **support issue**: user/operator help request requiring investigation.
- **incident**: runtime degradation or failure requiring operational triage.
- **error signature**: stable grouping key (`ErrorName|Route|Module`).
- **usage event**: contract-level meter event for analytics/billing.
- **telemetry event**: operational health signal (logs/metrics/traces), not inherently billable.
- **tenant**: canonical isolation boundary (workspace/org synonyms should map to tenant in technical surfaces).
