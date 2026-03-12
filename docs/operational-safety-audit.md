# Operational Safety Audit

Last updated: 2026-03-12  
Scope: Settler CLI kernel bridge (`packages/cli/src/lib/kernel-client.ts`) and reconciliation proof hashing paths.

## Executive summary

The kernel bridge is now explicitly rollback-safe and machine-observable under failure conditions:

- Fallback to deterministic TS hashing is retained for all kernel operations.
- New operational kill switches are implemented:
  - `SETTLER_DISABLE_KERNEL=1`
  - `SETTLER_KERNEL_SHADOW_ONLY=1`
  - `SETTLER_DISABLE_OPERATION=<comma-separated operation list>`
- Readiness checks are available via `checkKernelOperationReadiness()` for:
  - kernel binary availability
  - handshake success
  - per-operation readiness
- Telemetry emits latency, fallback reasons/rates, divergence counters, and failure classes.

## Phase 1 — Failure path analysis

### Kernel failures

Covered paths include:

- binary missing / not executable (`BINARY_MISSING`, `BINARY_NOT_EXECUTABLE`)
- spawn/timeout failures (`SPAWN_FAILED`, `TIMEOUT`)
- malformed output (`MALFORMED_JSON`)
- protocol/version/schema failures (`VERSION_MISMATCH`, `UNEXPECTED_SCHEMA`)
- unsupported operation (`UNKNOWN_OPERATION`)

All failure classes degrade to TS hashing with explicit `fallbackReason` metadata, preserving route safety.

### CLI failures

CLI operations consuming kernel hashing use fallback wrappers (`canonicalizeHashWithFallback`, `proofBundleHashWithFallback`, `artifactIdentityHashWithFallback`) and return deterministic outputs even when kernel paths fail.

### API errors and network issues

Kernel execution is local-process stdio based and does not rely on network paths for hashing. Network/API failures are therefore not part of the kernel critical path for reconciliation hash generation in CLI flows.

### Data corruption / malformed kernel payloads

Malformed or incompatible envelopes are rejected; wrapper returns TS fallback with machine-visible fallback reason and telemetry increments (`malformedOutput`, `versionMismatch`).

## Phase 2 — Fallback verification

Fallback verified for:

- kernel operations: all three operations continue via TS implementations.
- hashing: deterministic SHA-256 outputs from TS fallback paths.
- canonicalization: stable key-order canonicalization in TS.
- verification: replay verification hashes use fallback wrappers and remain deterministic.

## Phase 3 — Health checks

The bridge now supports readiness verification using `checkKernelOperationReadiness(operation)`:

- `kernelBinaryAvailable`
- `handshakeSuccess`
- `operationReady`
- `runnerMode`
- explicit `reason` when not ready

This enables deterministic preflight checks before enabling primary mode.

## Phase 4 — Rollback config

Implemented safety flags:

- `SETTLER_DISABLE_KERNEL=1`  
  Forces disabled execution mode and disables kernel usage globally.
- `SETTLER_KERNEL_SHADOW_ONLY=1`  
  Forces `shadow` execution mode for compare-only rollout safety.
- `SETTLER_DISABLE_OPERATION=canonicalize_hash,proof_bundle_hash,...`  
  Disables specific operations with explicit `operation_disabled_env` fallback reason.

## Phase 5 — Observability

Telemetry currently captures:

- latency: kernel and TS durations (`durationMs`)
- fallback rates: totals + reason map (`fallbackTs`, `fallbackByReason`)
- kernel divergence: `divergence`, `divergenceByOperation`, `hashMismatch`
- operation failures: timeout, malformed output, version mismatch, binary unavailable

## Residual risk

- `SETTLER_KERNEL_SHADOW_ONLY=1` with `SETTLER_DISABLE_KERNEL=1` is resolved to fully disabled mode by design (safety-first precedence).
- Readiness checks are currently library-level; if required, add a dedicated CLI command for operator UX (non-blocking enhancement).

## Evidence

- Unit tests in `packages/cli/src/__tests__/kernel-client.test.ts` cover new env-flag behavior, explicit operation disable fallback reason, and readiness check disabled-state behavior.
