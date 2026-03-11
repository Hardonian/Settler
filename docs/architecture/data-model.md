# Data Model Entrypoint

This is the architecture-level entrypoint for Settler data-model references.

## Core model surfaces

- [Execution ledger](./execution-ledger.md): run identity, status, and evidence linkage.
- [Failure intelligence](./failure-intelligence.md): structured failure categories and diagnostics.
- [Canonical event protocol](./canonical-event-protocol.md): event envelope and versioning rules.
- [Route map](./route-map.md): API route families and control-plane boundaries.

## Source-of-truth schema location

- Runtime database schema and migrations live under `prisma/`.
- Architecture docs describe semantics and invariants; implementation contracts are enforced by code and verification scripts.
