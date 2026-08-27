# Intentional Boundaries

As part of the Settler enterprise launch strategy, several constraints and boundaries are enforced by design. These are not "missing features," but intentional omissions that protect the core value prop of determinism, auditability, and safety.

## 1. Zero-Mutation Windows

Settler enforces a `FreezeState` on critical routes. There are specific periods (e.g., during reconciliation execution, or post-audit) where state mutations are strictly blocked.
**Why:** To ensure that the ledger cannot drift while algorithms are actively processing matches.

## 2. API Contract Rigidity

Data ingestion formats are strictly typed via Zod and Prisma. We do not support "dynamic" or schemaless fields outside of designated JSON metadata boundaries.
**Why:** Schemaless data ingestion prevents deterministic matching.

## 3. The Replay Barrier

A reconciliation run cannot be "undone." If an error occurs, an inverse compensating transaction must be filed, or a subsequent run must be executed to append new state.
**Why:** Real enterprise systems cannot erase history. Audit trails are append-only.

## 4. Multi-Tenant Opacity

A tenant cannot query any data across the system without explicit context boundaries. The API layer prevents cross-tenant aggregate queries.
**Why:** Security and data residency compliance.
