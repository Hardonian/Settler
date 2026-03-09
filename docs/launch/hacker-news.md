# Hacker News Launch Post

## Title

Show HN: Settler — deterministic reconciliation with replay-verified evidence

## Technical explanation

Settler combines API + web + CLI execution surfaces with deterministic replay tooling (`scripts/settler-replay.ts`) and verification gates (`repo-integrity`, `verify`).

## Why this exists

Operational teams need evidence-backed reconciliation, not opaque best-effort jobs.

## Demo instructions

Run `pnpm run bootstrap`, then `pnpm run demo`, then replay with `pnpm exec tsx scripts/settler-replay.ts examples/demo-output/evidence.json`.
