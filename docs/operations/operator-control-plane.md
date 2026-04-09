# Operator Control Plane (Runtime Telemetry-Backed)

The operator console page at `/console/operator` is backed by real runtime data queried from:

- `reconciliation_runs`
- `reconciliation_matches`
- `operator_runtime_events`
- `request_metrics`
- `billing_accounts` + `subscriptions`
- `ops_support_tickets`

## What the control plane now includes

- **System health**: run volume/day, failure rate, match rate, manual review rate, run/API latency percentiles, API error rate.
- **Usage analytics**: active tenants (7d/30d), runs/records (30d), API-vs-UI request segmentation from `request_metrics.route`.
- **Financial observability**:
  - revenue proxy from active subscription metadata (`monthly_revenue_usd`) with plan fallback,
  - compute-cost proxy from run counts,
  - revenue-per-run and margin proxy output when revenue exists.
- **Error intelligence**: grouped signatures with top/new/regression slices and sample run/route/module context.
- **Anomaly alerting**: baseline-aware anomaly detection with persisted, deduplicated alert history (`operator_anomaly_alerts`).
- **GitHub auto-triage**: signature-deduped issue creation/update with cooldown tracking (`operator_error_issue_links`).
- **Support intake**: operator ticket creation enriched with linked run/error samples, optional signature links, and triage confidence metadata.

## Capability gating + graceful degradation

Capabilities are explicit in API output:

- GitHub triage: `GITHUB_TOKEN` + `GITHUB_REPO`
- Stripe revenue capability: `STRIPE_SECRET_KEY`
- Slack alerts capability: `SLACK_WEBHOOK_URL`

If external systems are unavailable, the route remains functional and returns machine-visible degraded/capability state rather than hard-failing.

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
