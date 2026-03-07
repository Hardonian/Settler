# Reconciliation Guide

Settler reconciliation surfaces are designed to make mismatch triage explainable and auditable.

## Core entities

- Execution
- Reconciliation
- ProofReceipt
- PolicyRule
- AuditEvent
- SystemHealth

## UI surfaces

- Public: `/reconciliation`
- Control plane: `/app/reconciliation` and `/app/reconciliation/[id]`

## Validation

```bash
pnpm run verify:contracts
pnpm run test
```
