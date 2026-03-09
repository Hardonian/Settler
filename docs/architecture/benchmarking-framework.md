# Benchmarking Framework

Benchmarking is performed with `scripts/benchmark-harness.ts` and should be executed with reproducible scenario definitions.

## Required benchmark dimensions

- execution latency
- throughput
- failure recovery time
- proof verification time
- replay latency

## Scale profiles

- 1k executions
- 10k executions
- 100k executions

Benchmark outputs should be compared between versions and linked to control-plane telemetry export datasets for auditability.
