# Rust Kernel Boundary (Phase 1: Canonicalization + Fingerprints)

Settler now supports an optional Rust subprocess kernel for deterministic canonicalization and fingerprint generation in reconciliation foundry exports.

## Boundary

Kept in TypeScript:
- CLI command orchestration and file IO
- feature-flag policy selection
- fallback behavior and user-visible responses

Moved to Rust kernel (subprocess):
- canonical JSON normalization (sorted object keys)
- deterministic input hash and normalized hash generation
- typed error envelopes for kernel failures

## Feature flags

- `SETTLER_KERNEL_ENABLED=1` enables kernel integration.
- `SETTLER_KERNEL_CANONICALIZE=1` enables canonicalization operation routing.
- `SETTLER_KERNEL_SHADOW_MODE=1` keeps TS result primary and runs Rust for divergence checks.

Default behavior remains TS-only when flags are unset.

## Failure / fallback guarantees

- Kernel timeout, malformed output, or non-zero exit degrades to TS canonicalization.
- CLI command still returns structured output without route-level hard failures.
- Shadow mode records divergence metadata without changing primary result.

## Local run

```bash
SETTLER_KERNEL_ENABLED=1 SETTLER_KERNEL_CANONICALIZE=1 pnpm --filter @settler/cli exec tsx src/index.ts foundry reconciliation-generate --seed 42 --profile smoke
```

For explicit kernel binary path (optional):

```bash
SETTLER_KERNEL_BIN=/path/to/settler-kernel-cli SETTLER_KERNEL_ENABLED=1 SETTLER_KERNEL_CANONICALIZE=1 ...
```

## Deferred to later extraction

- runtime reconciliation matching in Rust
- proof artifact bundling in Rust
- API-server call-site integration outside CLI foundry path
