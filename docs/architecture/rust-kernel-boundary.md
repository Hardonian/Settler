# Rust Kernel Boundary (Operationalization Baseline)

Settler supports an optional Rust subprocess kernel for deterministic canonicalization and fingerprint generation in reconciliation foundry exports and replay verification.

## Boundary

Kept in TypeScript (control plane and safety boundary):

- CLI command orchestration and file IO
- feature/config policy selection
- fallback behavior and user-visible responses
- route safety, tenancy/auth/persistence boundaries

Moved to Rust kernel (deterministic compute boundary):

- canonical JSON normalization (sorted object keys)
- deterministic input hash and normalized hash generation
- deterministic proof bundle hash primitive
- deterministic artifact identity hash primitive
- typed error envelopes for kernel failures

## Kernel-backed operation map

- `canonicalize_hash`
  - eligible for controlled primary (`SETTLER_KERNEL_PRIMARY_ALLOWLIST`)
  - supports shadow / compare-only modes
- `proof_bundle_hash`
  - eligible for controlled primary
  - TS fallback retained
- `artifact_identity_hash`
  - eligible for controlled primary
  - used to strengthen replay/proof artifact identity determinism

Not extracted in this phase:

- runtime reconciliation matching
- orchestration, storage, tenancy, billing, auth

## Execution and promotion flags

- `SETTLER_KERNEL_ENABLED=1`
- `SETTLER_KERNEL_CANONICALIZE=1`
- `SETTLER_KERNEL_EXECUTION_MODE=disabled|compare_only|shadow|primary`
- `SETTLER_KERNEL_PRIMARY_ALLOWLIST=canonicalize_hash,proof_bundle_hash,artifact_identity_hash`

Back-compat:

- `SETTLER_KERNEL_SHADOW_MODE=1` maps to shadow when `SETTLER_KERNEL_EXECUTION_MODE` is unset.

## Guardrails and rollback

Primary execution for an operation is allowed only when:

1. kernel enabled + operation flag enabled
2. handshake valid and protocol compatible (`v1`)
3. operation listed in kernel `supported_operations`
4. operation explicitly allowlisted for primary mode
5. TS fallback path remains available

Fast rollback options:

- global TS-only: `SETTLER_KERNEL_EXECUTION_MODE=disabled`
- global TS primary + compare: `SETTLER_KERNEL_EXECUTION_MODE=shadow`
- operation rollback: remove op from `SETTLER_KERNEL_PRIMARY_ALLOWLIST`
- environment rollback: remove/fix `SETTLER_KERNEL_BIN`

## CI binary packaging and delivery discipline

`Kernel Binary CI` workflow now:

- runs rust fmt/clippy/tests
- builds `settler-kernel-cli` release binary
- handshake-smoke validates protocol + operation support matrix
- uploads versioned binary artifact (`settler-kernel-cli-linux-amd64-<kernel_version>`)
- emits SHA256 + version metadata in workflow summary

Runtime binary resolution helper:

```bash
node scripts/kernel/resolve-kernel-bin.mjs
```

## Failure / fallback guarantees

- binary missing/non-executable, spawn issues, timeout, malformed output, protocol mismatch, unsupported operation => TS fallback
- CLI output remains structured and route-safe
- no hard-500 behavior introduced from kernel failures
- fallback reason is machine-visible in execution metadata + telemetry counters

## Observability

Kernel telemetry includes:

- attempt/success/primary/shadow-compare/compare-only counts
- fallback counts + fallback-by-reason
- divergence counts + divergence-by-operation
- timeout, malformed output, version mismatch, binary unavailable

Foundry output includes per-execution metadata:

- operation
- execution mode
- primary vs TS decision
- shadow compare status
- fallback reason (if any)

## Local run

```bash
SETTLER_KERNEL_ENABLED=1 \
SETTLER_KERNEL_CANONICALIZE=1 \
SETTLER_KERNEL_EXECUTION_MODE=shadow \
SETTLER_KERNEL_PRIMARY_ALLOWLIST=canonicalize_hash \
SETTLER_KERNEL_BIN=$PWD/target/debug/settler-kernel-cli \
pnpm --filter @settler/cli exec tsx src/index.ts foundry reconciliation-generate --seed 42 --profile smoke
```
