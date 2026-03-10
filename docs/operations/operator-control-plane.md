# Operator Control Plane (Runtime Telemetry-Backed)

The operator console at `/console/operator` is backed by runtime data from:

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
