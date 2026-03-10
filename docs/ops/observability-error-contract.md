# Observability Error Contract

Settler runtime and operator surfaces should emit consistent error metadata for grouping and support handoff.

## Error taxonomy

Shared constants live in:

- `packages/api/src/services/observability/error-taxonomy.ts`

Defined dimensions:

- `category`: authentication, authorization, validation, dependency, throttling, data_integrity, timeout, internal, configuration
- `severity`: `sev0_critical`, `sev1_high`, `sev2_medium`, `sev3_low`
- `retryable`: boolean

## Required correlation fields

Every structured error event should include:

- `tenant_id`
- `run_id` (if run-scoped)
- `route`
- `module`
- `error_signature`

## Signature guidance

Use stable signatures for grouping/fingerprinting:

`{ErrorName}|{Route}|{Module}`

Do not include volatile IDs, timestamps, or user-provided strings in signatures.

## Future Sentry/incident integration

Sentry (or equivalent) integration should map:

- fingerprint => `error_signature`
- tags => `tenant_id`, `run_id`, `route`, `module`, `category`, `severity`, `retryable`

This contract is additive and does not replace existing telemetry pipelines.
