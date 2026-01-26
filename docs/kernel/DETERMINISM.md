# Deterministic Kernel Behavior

Settler’s Rust reconciliation kernel is the truth layer for deterministic reconciliation math. It surfaces discrepancies by applying stable ordering, explicit rounding modes, and explicit timezone handling to normalized records.

## Deterministic guarantees

- Stable ordering: all records and variances are sorted with deterministic sort keys.
- Explicit rounding: rounding modes are required by the ruleset and applied consistently.
- Explicit timezones: the ruleset includes a timezone value to ensure that any date normalization is aligned.

## Output hashing

The kernel computes summary hashes over canonical JSON payloads. These hashes are recorded in the evidence manifest so the verifier can confirm that outputs match the original inputs.

## Scope

The kernel does not fix data or imply correctness guarantees. It surfaces discrepancies between normalized input sets to support audits and investigation workflows.
