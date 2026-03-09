# Observability Foundation

## Structured log envelope

Minimum fields for operational events:

- `timestamp`
- `event_type`
- `trace_id`
- `execution_id`
- `tenant_id`
- `duration_ms` (where applicable)

## Platform checkpoints

- API request middleware emits tracing context and response correlation headers.
- Error middleware returns machine-visible problem+json responses.
- Health surfaces: `/health`, `/health/live`, `/health/ready`, `/metrics`.
- Worker handlers log tenant-scoped events and failures.

## Operational verification

Run API + CLI checks to verify:

- trace headers are set and returned,
- failed requests include problem+json + trace metadata,
- logs include trace and execution dimensions.
