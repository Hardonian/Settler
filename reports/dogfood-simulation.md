# Dogfood Simulation Report

## Dataset characteristics

- seed: 42
- days: 14
- transactions_per_day: 7000
- transaction_records: 98000
- dataset_file: test-data/reconciliation-scenarios/scenario-seed42-d14-tpd7000.json

## Runs executed

- runs_total: 56
- run_modes: daily, batch, api, manual
- failed_runs: 0
- replay_bundles: 56
- db_persistence: disabled (no DB env/connection)

## Match statistics

- total_source_records: 199276
- match_rate: 92.92
- manual_review_rate: 5.44
- failure_rate: 0.00

## Alert triggers

- total_alerts_triggered: 3
- alert_log: reports/dogfood-alerts.log

## System performance

- runs_per_day: 4.00
- run_duration_p50_ms: 6992.00
- run_duration_p95_ms: 12348.00
- error_rate_pct: 2.86
- api_latency_p50_ms: 361.00
- api_latency_p95_ms: 712.00
