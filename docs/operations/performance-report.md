# Settler Performance Report

Date: 2026-03-09  
Branch: `feat/final-system-audit`

## Benchmark Method

Command executed:

- `pnpm run benchmark`

This harness runs in-process (Node.js) and reports compute-path characteristics for deterministic execution, concurrent scheduling, and replay verification.

## Results

## Sequential execution (1,000 runs)

- Total time: **147.63 ms**
- Avg latency: **0.1470 ms**
- P50: **0.0820 ms**
- P95: **0.2920 ms**
- P99: **0.8442 ms**
- Throughput: **6773.49 runs/sec**
- Memory used: **1.39 MB**

## Concurrent execution (100 parallel runs)

- Total time: **20.73 ms**
- Avg latency: **0.2032 ms**
- P50: **0.2569 ms**
- P95: **0.3431 ms**
- P99: **0.5215 ms**
- Throughput: **4824.97 runs/sec**
- Memory used: **0.94 MB**

## Replay speed (100 runs)

- Total time: **0.88 ms**
- Avg latency: **0.0083 ms**
- P95: **0.0128 ms**
- Throughput: **113103.11 replays/sec**
- Replay match rate: **100%**

## CAS telemetry

- Cache hits: **0**
- Cache misses: **1,200**
- Hit rate: **0.00%**

The benchmark output notes that this run is in-process without network/database I/O, so these values represent algorithmic and runtime overhead rather than end-to-end production latency.

## Operational Interpretation

- Deterministic replay verification path is very fast in local compute conditions.
- Concurrent throughput shows expected event-loop scheduling overhead but remains stable.
- No replay mismatches observed in benchmark replay sample.

## Constraints / Caveats

- No external service I/O in this benchmark run.
- CAS hit behavior in this run did not show expected reuse; treat as signal for follow-up instrumentation review if persistent in CI/prod-like profiles.

## Recommended Next Steps

1. Run `pnpm run benchmark:full` in CI and store artifact history for trend tracking.
2. Pair benchmark harness with DB-backed workload replay for true API latency percentiles.
3. Add budget thresholds for replay mismatch rate and p95 drift in release gates.
