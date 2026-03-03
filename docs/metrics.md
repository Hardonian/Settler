# Metrics Pipeline (Phase 1)

## Tables

- `request_metrics`
- `run_metrics`
- `economic_metrics`
- `policy_metrics`
- `drift_metrics`

All tables are tenant-scoped (`tenant_id`) and indexed for time-series queries.

## Endpoints

- `GET /api/v1/metrics/summary`
- `GET /api/v1/metrics/timeseries`
- `GET /api/v1/metrics/top`

Runs/replay endpoints emit metrics events in fail-open mode: execution success is never blocked by metrics write failures.
