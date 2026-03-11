# Chaos Test Report

Generated at: 2026-03-10T22:44:25.916Z

## Failure Scenarios

| Scenario              | Status    | Recovery Mode | Latency (ms) | Retries | Events | Artifacts |
| --------------------- | --------- | ------------- | -----------: | ------: | -----: | --------: |
| db_timeout            | recovered | retry         |          280 |       1 |      4 |         3 |
| redis_failure         | recovered | retry         |          135 |       1 |      4 |         3 |
| api_latency_spike     | recovered | retry         |          910 |       2 |      4 |         3 |
| partial_run_crash     | recovered | resume        |          450 |       0 |      4 |         4 |
| alert_provider_outage | recovered | retry         |          170 |       2 |      6 |         3 |
| replay_divergence     | recovered | replay        |          215 |       0 |      5 |         4 |
| worker_crash          | recovered | retry         |          360 |       1 |      4 |         3 |

## Recovery Success Rate

- Scenarios executed: 7
- Recovered: 7
- Failed: 0
- Recovery success rate: 100%

## Latency Impact

- Average latency: 360 ms
- p95 latency: 910 ms

## Alert Failover

- slack: failed (503 Service Unavailable)
- telegram: failed (429 Too Many Requests)
- pagerduty: delivered (Delivered by failover provider)

## Safety Assertions

- Reconciliation failures degrade safely and emit machine-visible events.
- Artifacts are checkpointed before and after recovery operations.
- Mid-run failures support resume/retry/replay without silent data loss.
- Alert delivery failures trigger retry queue and secondary provider failover.
