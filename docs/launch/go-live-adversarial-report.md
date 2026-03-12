# Go-Live Adversarial Report

## Scope
Adversarial closeout pass across setup, kernel operations, enterprise enablement, verification-command honesty, and incident readiness.

## Strengths
- Rust kernel crates format/lint/test clean (`cargo fmt --check`, `cargo clippy --all-targets --all-features -- -D warnings`, `cargo test --all`).
- Web production build is materially runnable (`pnpm --filter @settler/web build` succeeds).
- Core doctor and setup docs exist and are now aligned to explicit first-run + kernel diagnostics flow.

## P0 Blockers (must fix before honest go-live)
1. **Typecheck fails in repo baseline** (`pnpm typecheck`): unresolved symbols in `packages/web/src/components/console/ConsoleLayout.tsx`.
2. **Production gate fails immediately** (`pnpm run check:production`) due to `repo-integrity` finding script entries that target missing files.
3. **Operator doctor fails in default first-run context** without env population and also surfaces the same typecheck failure path.

## P1 Serious Friction
- Kernel operational state is easy to misread without explicit diagnostics because default flags keep kernel disabled while runner can still resolve to cargo.
- Previous `check:production` framing oversold deployment confidence; it is a repo gate, not rollout proof.
- Kernel mode precedence and legacy shadow flags (`SETTLER_KERNEL_SHADOW_ONLY`, `SETTLER_KERNEL_SHADOW_MODE`) were under-documented.

## P2 Non-blocking polish
- Existing lint warnings across packages reduce signal/noise but do not currently block.
- Some test output is noisy from expected warnings (Supabase/tracing placeholders) and open-handle messages.

## Fixes implemented in this pass
- Added explicit kernel diagnostics command: `pnpm run kernel:health`.
- Reframed `check:production` copy and command usage to be honest about guarantees.
- Added optional doctor/kernel steps into production gate for better operator evidence.
- Tightened docs for kernel flag precedence, incident first actions, and enterprise enablement tiers.
- Fixed kernel metadata typing drift (`health` now present in operation-disabled fallback metadata paths).

## Verdict
**NOT HONESTLY GO-LIVE READY YET — BLOCKED BY SPECIFIC ITEMS**.

Primary blockers are repo-integrity + typecheck failures in default verification path; until those are resolved, a new serious operator cannot trust go-live claims.
