# Settler Engine

This document describes the technical internals behind Settler, the Open Source Reconciliation Engine.

## Deterministic replay

Settler executes reconciliation workflows with deterministic inputs and configuration so the same run can be replayed and verified later. Replay checks compare expected and actual fingerprints to validate run integrity.

## Content-addressed evidence

Each run produces evidence payloads that include hashes/fingerprints. Evidence is content-addressed so run outputs can be verified independently from UI state.

## Policy engine

Settler applies policy checks during run execution (for routing, control gates, and outcomes). Policy behavior is explicit and reviewable through run metadata and evidence.

## Run storage

Runs are persisted as immutable records with timestamps, status, and policy references. This storage model supports traceability, audit review, and repeatable replay.

## Execution model

At a high level:

1. Ingest/normalize source records.
2. Execute deterministic matching/reconciliation logic.
3. Apply rule checks and routing decisions.
4. Write run results + evidence.
5. Replay and verify when needed.

## Related docs

- Top-level architecture: [`ARCHITECTURE.md`](../ARCHITECTURE.md)
- API routes: [`docs/api/README.md`](api/README.md)
- Operations: [`docs/ops/README.md`](ops/README.md)
