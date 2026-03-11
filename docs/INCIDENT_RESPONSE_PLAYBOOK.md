# Incident Response Playbook

## Scope
This playbook defines operator actions for runtime incidents surfaced in `/operator/incidents`.

## Detection Sources
- Runtime metrics from operator control plane (`run throughput`, `API latency`, `reconciliation duration`, `manual review rate`, `error rate`).
- Automated anomaly detection for:
  - `match_rate_drop`
  - `run_failure`
  - `latency_spike`
  - `error_spike`
- Incident records in `system_incidents`.

## Severity Model
- **warning**: investigate within business hours.
- **critical**: investigate immediately, open incident channel, and assign owner.

## Triage Steps
1. Open `/operator/incidents` and filter `status=open`.
2. Sort by severity then recency.
3. For each incident:
   - Validate evidence values vs baseline.
   - Link affected `run_id` (or most representative run) using **Link**.
   - Click **Acknowledge** once owner is assigned.
4. If customer impact exists, open support ticket with tenant and run linkage.

## Response by Incident Type
### match_rate_drop
- Validate upstream schema changes and adapter mapping drift.
- Inspect unmatched categories and manual review growth.
- Mitigate via mapping fix or rollback recent matching rules.

### run_failure
- Inspect failed runs and top error signatures.
- Verify queue health, dependency outages, and tenant-specific regressions.
- Retry failed runs once root cause mitigation is applied.

### latency_spike
- Check API p95 and DB saturation indicators.
- Correlate to deploy window and high-traffic tenants.
- Apply throttling/caching or rollback high-latency release.

### error_spike
- Inspect dominant 5xx signatures and impacted routes.
- Confirm blast radius by tenant.
- Ship hotfix and monitor regression for 24h.

## Closure Criteria
Close incident only when:
- metric returns near baseline,
- no new critical alerts for the same type in observation window,
- linked run or validation evidence is documented.

## Auditability
All incident lifecycle actions must be machine-visible:
- incident creation timestamp,
- acknowledgement metadata,
- run linkage metadata,
- evidence payload and summary.
