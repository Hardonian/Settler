# Settler CLI Kernel Runner (Binary-First)

## Runner modes

The CLI kernel bridge resolves execution in this order:

1. `SETTLER_KERNEL_BIN` executable (`runnerMode: "binary"`)
2. Optional cargo fallback when explicitly allowed (`runnerMode: "cargo-run"`)
3. Safe TS fallback (`runnerMode: "fallback-ts"`)

Kernel feature flags remain:

- `SETTLER_KERNEL_ENABLED=1`
- `SETTLER_KERNEL_CANONICALIZE=1`
- `SETTLER_KERNEL_SHADOW_MODE=1` (shadow compare mode)

## Binary-first policy

Production-like environments should set:

- `SETTLER_KERNEL_BIN=/absolute/path/to/settler-kernel-cli`
- `NODE_ENV=production`
- `CI=true`

If the binary is missing, non-executable, times out, returns malformed output, or fails compatibility checks, the CLI degrades to TS hashing and remains route-safe.

## Cargo fallback (local/dev only)

Cargo fallback is intentionally explicit:

- `SETTLER_KERNEL_ALLOW_CARGO=1` **or**
- `SETTLER_KERNEL_DEV_FALLBACK=1`

Without one of these flags, production-like envs (`NODE_ENV=production` + `CI=true`) do not use `cargo run` automatically.

## Handshake and compatibility

Before kernel work, the TS wrapper performs a handshake (`operation: "handshake"`) and validates:

- `kernel_version` present
- `protocol_version` compatible (`v1`)
- operation envelope integrity

On mismatch, TS fallback is selected and telemetry counters are incremented.

## Telemetry signal

Foundry export logs now include:

- `kernel_mode` (`ts`, `rust_primary`, `ts_with_shadow`)
- `kernel_runner_mode` (`binary`, `cargo-run`, `disabled`, `fallback-ts`)
- per-path durations (`kernel_duration_ms`, `ts_duration_ms`)
- `kernel_telemetry` counters (attempted/success/fallback/timeout/malformed/version-mismatch/divergence/hash-mismatch)

## Local smoke

```bash
cargo build -p settler-kernel-cli
SETTLER_KERNEL_ENABLED=1 SETTLER_KERNEL_CANONICALIZE=1 SETTLER_KERNEL_BIN=$PWD/target/debug/settler-kernel-cli pnpm --filter @settler/cli exec tsx src/index.ts foundry reconciliation-generate --profile smoke --seed 42 --output test-data/exports/latest
```
