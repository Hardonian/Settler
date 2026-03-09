# Traceability Spine

## Required identifiers

All platform surfaces are required to propagate:

- `trace_id`
- `execution_id`
- `tenant_id`

## Propagation rules

- CLI emits `X-Trace-Id` and `X-Execution-Id` (and `X-Tenant-Id` when known) on outbound API requests.
- API middleware resolves/creates these IDs early and returns them as response headers.
- Error responses include IDs in `application/problem+json` bodies.
- Structured logs include request, trace, execution, and tenant dimensions.

## Continuity objective

A single execution should be traceable across command invocation, API entry, service execution, persistence, and failure handling without identifier loss.
