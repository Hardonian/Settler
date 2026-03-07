# Name

Settler

# Tagline

Deterministic reconciliation workflows with replayable proof.

# Launch summary

Settler is an open-source platform for running deterministic reconciliation workflows that produce verifiable evidence artifacts and support replay-based verification. It is designed for engineering teams that need reproducible outcomes, audit-friendly execution history, and policy-governed workflow operations.

# What engineers can test quickly

- Run the demo workflow: `pnpm demo`
- Verify replay from generated evidence: `pnpm settler:replay examples/demo-output/evidence.json`
- Inspect architecture and contributor docs in-repo

# Core technical points

- Deterministic execution path
- Evidence artifact generation (`run.json`, `results.json`, `evidence.json`)
- Replay verification with fingerprint matching
- Policy checks in execution loop
- Connector normalization with tenant-aware boundaries

# Links

- Repo: https://github.com/settler/settler
- Quick start: https://github.com/settler/settler/blob/main/docs/launch/QUICK_START.md
- Architecture: https://github.com/settler/settler/blob/main/ARCHITECTURE.md
