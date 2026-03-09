# QA Verification System

## Purpose

The QA system validates real behavior across API, CLI, execution, replay, proof verification, and tenant isolation.

## Verification Layers

1. **API verification**
   - contract and route checks
   - tenant boundary checks
   - policy enforcement checks
2. **CLI verification**
   - command execution correctness
   - deterministic output formatting
3. **Execution/replay verification**
   - execution status fidelity
   - replay consistency and divergence detection
4. **UI/UX verification**
   - smoke tests
   - accessibility and visual audits

## Key Commands

- `pnpm run test:ci:verify`
- `pnpm run verify:tenant`
- `pnpm run test:cross-tenant`
- `pnpm run qa:smoke`
- `pnpm run qa:ui-audit`
- `pnpm run qa:a11y`

## QA Dashboard Contract

A QA dashboard should publish:

- pass/fail trend
- coverage by subsystem
- failing suite ownership
- regression alerts
- tenant-isolation gate status

## Chaos and Resilience Verification

Use controlled fault injection to verify:

- dependency outages
- network latency degradation
- worker crashes
- queue saturation
- malformed input handling

Failures must be explicit, recoverable where possible, and observable in telemetry.

## Evidence Discipline

A verification claim is valid only when backed by:

- executable tests
- machine-readable results
- logs/artifacts tied to trace IDs
