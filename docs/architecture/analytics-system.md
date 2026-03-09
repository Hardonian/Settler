# Analytics System Architecture

## Objectives

The analytics system provides operational truth for executions, failures, tenant activity, and platform load using first-party telemetry tables.

## Data Sources

Settler analytics is backed by structured telemetry tables:

- `run_metrics`: run status, latency, replay verification, policy linkage.
- `request_metrics`: API route throughput, latency, status, rate-limit markers.
- `economic_metrics`: compute and CAS I/O usage.
- `drift_metrics`: replay verification and divergence signals.
- `policy_metrics`: deny/budget-overrun activity.
- `audit_logs`: user and admin action history.

## Query Layer

`packages/web/src/lib/metrics/repository.ts` is the canonical metrics query layer for:

- Summary snapshots (`getMetricsSummary`)
- Time-series (`getMetricsTimeseries`)
- Top-N analyses (`getTopMetrics`)

This layer enforces tenant predicates on every query.

## Metric Event Contract

Control-plane metric snapshots and derived events should include:

- `trace_id`
- `execution_id` (when tied to a run)
- `tenant_id`
- `timestamp`
- `duration`
- `component`
- `event_type`

## Time-Series Semantics

Supported windows:

- `24h`
- `7d`
- `30d`

Supported buckets:

- `hour`
- `day`

Supported dimensions:

- status
- route
- policy

## Tenant Safety

- Tenant ID is mandatory for non-admin analytics APIs.
- No shared cache key may omit tenant dimension.
- Exports and reports use tenant-constrained queries only.

## Degraded Operation

When telemetry cannot be resolved, APIs return explicit degraded responses instead of server crashes. Degraded responses must be machine-visible.
