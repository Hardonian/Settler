# Architecture

## Canonical architecture narrative

Settler runs as a reconciliation engine with a traceability spine:

1. **Ingestion/connectors** pull transaction/document feeds.
2. **Normalization** converts source variance into typed internal records.
3. **Reconciliation engine** applies deterministic matching and tolerance rules.
4. **Policy/rules layer** enforces governance and decision constraints.
5. **Exception handling** routes unmatched/ambiguous records to operator review.
6. **Evidence/audit layer** stores run lineage, decisions, hashes, and exports.
7. **API/SDK layer** exposes contract-first execution and retrieval surfaces.
8. **Operator/admin planes** provide monitoring, controls, and review lifecycle.

## Hosted vs enterprise boundary

- OSS/public surfaces must run without enterprise-only configuration.
- Enterprise modules add advanced controls and operational tooling without changing deterministic core behavior.
- Missing enterprise configuration must degrade gracefully on public routes.

## Deep links

- Full architecture: [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md)
- Event model: [`docs/EVENT_MODEL.md`](../EVENT_MODEL.md)
- Ingestion reference: [`docs/INGESTION.md`](../INGESTION.md)
- Reliability and operations: [`docs/OPERATIONS.md`](../OPERATIONS.md)
