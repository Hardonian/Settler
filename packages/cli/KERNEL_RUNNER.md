# Settler CLI Kernel Runner (Binary-First)

## Runner modes

The CLI kernel bridge resolves execution in this order:

1. `SETTLER_KERNEL_BIN` executable (`runnerMode: "binary"`)
2. Optional cargo fallback when explicitly allowed (`runnerMode: "cargo-run"`)
3. Safe TS fallback (`runnerMode: "fallback-ts"`)

Kernel feature flags:

- `SETTLER_KERNEL_ENABLED=1`
- `SETTLER_KERNEL_CANONICALIZE=1`
- `SETTLER_KERNEL_EXECUTION_MODE=disabled|compare_only|shadow|primary`
- `SETTLER_KERNEL_PRIMARY_ALLOWLIST=canonicalize_hash,proof_bundle_hash,artifact_identity_hash`
- `SETTLER_DISABLE_KERNEL=1` (hard global rollback; forces disabled mode)
- `SETTLER_KERNEL_SHADOW_ONLY=1` (forces shadow mode for safe compare rollout)
- `SETTLER_DISABLE_OPERATION=canonicalize_hash,proof_bundle_hash,artifact_identity_hash` (operation-scoped rollback)

`SETTLER_KERNEL_SHADOW_MODE=1` is still honored for backward compatibility and maps to `shadow` when explicit execution mode is absent.

## Binary-first policy

Production-like environments should set:

- `SETTLER_KERNEL_BIN=/absolute/path/to/settler-kernel-cli`
- `NODE_ENV=production`
- `CI=true`

Use the helper to resolve binary location predictably:

```bash
node scripts/kernel/resolve-kernel-bin.mjs
```

If the binary is missing, non-executable, times out, returns malformed output, fails compatibility checks, or does not support an operation, the CLI degrades to TS hashing and remains route-safe.

## Promotion/readiness guardrails

Primary mode is never broad by default:

- operation must be in `SETTLER_KERNEL_PRIMARY_ALLOWLIST`
- handshake must succeed (`operation: "handshake"`)
- operation must be listed in `supported_operations`
- wrapper always retains TS fallback path

This allows targeted promotion (one operation at a time) with immediate rollback by:

- `SETTLER_KERNEL_EXECUTION_MODE=disabled` (global TS-only)
- `SETTLER_KERNEL_EXECUTION_MODE=shadow` (TS primary + compare)
- removing operation from `SETTLER_KERNEL_PRIMARY_ALLOWLIST`

## Handshake and compatibility

Before kernel work, the TS wrapper performs handshake validation:

- `kernel_version` present
- `protocol_version` compatible (`v1`)
- operation support list includes requested operation
- operation envelope/schema integrity

On mismatch, TS fallback is selected and telemetry counters are incremented with machine-visible fallback reason.

## Readiness checks

`checkKernelOperationReadiness(operation)` reports:

- `kernelBinaryAvailable`
- `handshakeSuccess`
- `operationReady`
- `runnerMode`
- `reason` when not ready

Use readiness preflight before enabling `primary` mode in production-like environments.

## Telemetry signal

Foundry export logs include:

- `kernel_mode` (`ts`, `rust_primary`, `ts_with_shadow`)
- `kernel_runner_mode` (`binary`, `cargo-run`, `disabled`, `fallback-ts`)
- `kernel_execution` metadata (`operation`, `executionMode`, `usedPrimary`, `shadowCompared`, `fallbackReason`)
- per-path durations (`kernel_duration_ms`, `ts_duration_ms`)
- `kernel_telemetry` counters:
  - attempts/success/primary/shadow-compare/compare-only
  - fallback totals and fallback-by-reason
  - timeout, malformed output, version mismatch, binary unavailable
  - divergence totals and divergence-by-operation

## CI binary packaging

`Kernel Binary CI` workflow builds `settler-kernel-cli` (release), validates handshake support matrix, and uploads binary artifact with auditable metadata (version + sha256).

## Local smoke

```bash
cargo build -p settler-kernel-cli
SETTLER_KERNEL_ENABLED=1 \
SETTLER_KERNEL_CANONICALIZE=1 \
SETTLER_KERNEL_EXECUTION_MODE=shadow \
SETTLER_KERNEL_PRIMARY_ALLOWLIST=canonicalize_hash \
SETTLER_KERNEL_BIN=$PWD/target/debug/settler-kernel-cli \
pnpm --filter @settler/cli exec tsx src/index.ts foundry reconciliation-generate --profile smoke --seed 42 --output test-data/exports/latest
```
