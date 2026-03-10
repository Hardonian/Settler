# Operator Control Plane (Runtime Telemetry-Backed)

The operator console page at `/console/operator` is backed by real runtime data queried from:

- `reconciliation_runs`
- `reconciliation_matches`
- `operator_runtime_events`
- `request_metrics`
- `ops_support_tickets`

## Surfaces

- **System health:** run volume/day, failure rate, match rate, manual review rate, run/API latency percentiles, API error rate.
- **Usage analytics:** active tenants (7d/30d), runs and records processed (30d).
- **Financial observability:** estimated compute-cost proxy from real run counts (`$0.0025/run`), explicit margin capability state.
- **Error intelligence:** grouped by runtime signature (`metadata.signature` fallback to `error_id`), plus top/new/regression lists.
- **Capability gating:** GitHub triage, Stripe revenue, and Slack alerting are exposed as available/unavailable from environment configuration.
- **Support intake:** operator ticket POST creates `ops_support_tickets` entries with run/tenant/error context.

## Graceful degradation

If telemetry queries fail, `/api/console/operator/control-plane` returns a degraded payload with explicit flags and empty data structures, not HTTP 500.

## Integration notes

- GitHub triage is currently dry-run when GitHub environment variables are absent.
- Revenue/margin fields are capability-driven; without Stripe config they remain unavailable and metrics stay usage-cost-only.
