# System Safety Controls

Last updated: 2026-03-12

## Kernel safety controls

Settler kernel execution is guarded by explicit environment controls:

- `SETTLER_DISABLE_KERNEL=1`: force-disable kernel paths globally.
- `SETTLER_KERNEL_SHADOW_ONLY=1`: run compare/shadow mode without kernel-primary promotion.
- `SETTLER_KERNEL_EXECUTION_MODE={disabled|compare_only|shadow|primary}`: explicit mode selection.
- `SETTLER_KERNEL_PRIMARY_ALLOWLIST=...`: operation-level promotion allowlist.
- `SETTLER_DISABLE_OPERATION=canonicalize_hash,proof_bundle_hash,artifact_identity_hash`: operation-specific kill switches.

## Safety mechanisms

- **Fallback safety:** TS deterministic hashing remains available for all kernel operations.
- **Binary availability checks:** startup readiness validates runner presence and executability.
- **Protocol validation:** handshake and protocol version checks gate operation usage.
- **Operation readiness checks:** each operation is tested for support before primary promotion.
- **Degraded-state signaling:** fallback reasons are machine-visible in metadata.

## Observability signals

Kernel telemetry includes:

- execution latency (`durationMs`)
- fallback totals and reason breakdown (`fallbackTs`, `fallbackByReason`)
- divergence and mismatch counters (`divergence`, `divergenceByOperation`, `hashMismatch`)
- failure classes (`timeout`, `malformedOutput`, `versionMismatch`, `binaryUnavailable`)
- health-check totals/failures (`healthChecks`, `healthCheckFailures`)

## Operational guidance

- Use shadow/compare mode for rollout before primary mode.
- Keep primary allowlists narrow for initial deployment.
- Treat fallback spikes or divergence as launch blockers until root-caused.
- Document any temporary operation disable flag in runbook/change logs.
