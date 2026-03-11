# Operator Terminology (Canonical)

Use these terms consistently across README, docs, UI labels, scripts, and API references.

## Platform components

- **Reconciliation Engine**: deterministic run execution and matching logic.
- **Truth Explorer**: proof, lineage, and evidence investigation surface.
- **Replay Lab**: deterministic re-execution and drift checks.
- **Policy Lab**: simulation surface for policy outcome analysis.
- **Operator Intelligence**: incident and investigation context for operators.
- **Run Explorer**: run-level investigation and status surface.
- **Import Workbench**: controlled ingest and normalization entrypoint.
- **Synthetic Foundry**: deterministic synthetic data generation and verification tooling.
- **Live Event Stream**: runtime event visibility for operational awareness.

## Core entities

- **Run**: a single reconciliation execution instance.
- **Replay run**: deterministic re-execution of a prior run.
- **Tenant**: canonical isolation boundary.
- **Incident**: runtime degradation requiring operational triage.
- **Telemetry event**: operational signal (logs/metrics/traces).
- **Usage event**: meter event for analytics and/or billing contracts.

## Avoided synonyms

To reduce confusion, avoid mixing these synonyms in technical docs:

- Use **Policy Lab** instead of "policy sandbox".
- Use **Run Explorer** instead of "execution ledger" UI label.
- Use **Live Event Stream** instead of "runtime event signals" when describing the operator surface.
- Use **Synthetic Foundry** instead of "synthetic reconciliation foundry" in headings.
