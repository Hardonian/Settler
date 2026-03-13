# Operator Runbook: Failed Run + Error Spike Triage

## 1) Inspect failed run

Collect:

- `tenant_id`
- `run_id`
- route + module that initiated execution
- top error message and stack summary
- trace/correlation identifiers

## 2) Classify quickly

- category (validation/dependency/timeout/internal/etc.)
- severity (`sev0`..`sev3`)
- retryable (`true/false`)

Use `error_signature = {ErrorName}|{Route}|{Module}` to group similar failures.

## 3) Check for spike pattern

- Is this isolated to one tenant/run?
- Is frequency increasing?
- Are multiple routes/modules affected?

If spike is broad, open a `runtime_error_incident` issue using the structured template.

## 4) Support handoff

If user-impact is present, file or link `support_issue` with:

- same tenant/run correlation fields
- short customer-safe summary
- known workaround (if any)

## 5) Capability-gating behavior

If GitHub/Slack/Stripe/private connectors are unavailable:

- mark capability as `unavailable` or `unsupported_oss`
- do not claim automated routing or billing sync is active
- keep manual triage path explicit in issue notes

## 6) Connector durability and recovery triage

When triaging connector incidents, classify each `sync_runs` record by durability truth before declaring the run healthy.

- `persistence_status=durable_atomic`: all normalized writes completed atomically.
- `persistence_status=durable_non_atomic`: fallback writes succeeded; inspect `raw_events.event_type=sync_atomic_fallback` for incident evidence.
- `persistence_status=failed_partial` or `recovery_required=true`: partial write occurred; run is not trustable until recovery completes.

Suggested query (scoped by tenant and connector):

```sql
select id, status, persistence_status, recovery_required, started_at, finished_at
from sync_runs
where tenant_id = :tenant_id
  and connector_id = :connector_id
order by started_at desc
limit 50;
```

Recovery-required incidents should include corresponding `raw_events.event_type=sync_recovery_required` entries with stage completion metadata. Use these entries to determine whether to replay from source cursor or perform targeted cleanup/re-sync.
