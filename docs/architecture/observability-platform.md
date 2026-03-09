# Observability Platform

The platform control-plane telemetry is exposed through `/api/v1/tenant/platform-control-plane/overview` and `/api/v1/tenant/platform-control-plane/analytics/export`.

## Telemetry contract

Each execution record includes:

- `trace_id`
- `execution_id`
- `tenant_id`
- `timestamp`
- `component`
- status and failure classification
- queue/compute/storage/network/logging consumption

Source of truth is tenant-scoped `executions` + `jobs` data, loaded with `queryWithTenant` to enforce tenant isolation.

## Dashboards produced from telemetry

- system health (success ratio)
- execution throughput (per minute)
- replay statistics
- policy violations
- failure trend clusters
- infrastructure utilization (`avg`, `p95` latency and queue delay)

## Design constraints

- No simulated metrics: all numbers are generated from execution rows.
- Graceful degradation: empty telemetry returns zeroed dashboard output, never hard-500 for user-facing routes.
