# Incident Response Quickstart (2:00 AM Mode)

## First action decision tree

1. **Suspect kernel path?**
   - Set `SETTLER_DISABLE_KERNEL=1` and redeploy.
   - Run `pnpm run kernel:health` to classify binary/handshake/protocol state.

2. **Suspect env/config drift?**
   - Run `pnpm run doctor -- --first-run`.
   - Validate keys against `docs/setup/env-matrix.md`.

3. **Suspect release quality regression?**
   - Run `pnpm run check:production`.
   - If it fails in `repo-integrity` or `typecheck`, stop rollout and revert.

## Rollback controls
- Global kernel kill switch: `SETTLER_DISABLE_KERNEL=1`
- Shadow mode: `SETTLER_KERNEL_EXECUTION_MODE=shadow`
- Scoped kernel rollback: `SETTLER_DISABLE_OPERATION=<op>`

## Classification hints
- `binary_unavailable`: kernel binary missing/not executable.
- `protocol_mismatch`: kernel handshake/version incompatibility.
- `timeout`: runner could not answer in window.
- `kernel_disabled`: expected fallback state from flags.
