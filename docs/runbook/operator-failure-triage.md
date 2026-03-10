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
