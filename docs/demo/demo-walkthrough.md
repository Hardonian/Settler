# Demo Walkthrough

1. `pnpm run bootstrap`
2. `pnpm run demo`
3. Inspect `examples/demo-output/evidence.json` for proof envelope.
4. Inspect `examples/demo-output/run.json` for execution metadata.
5. Replay evidence: `pnpm exec tsx scripts/settler-replay.ts examples/demo-output/evidence.json`
6. Optional UI verification: `pnpm run verify:routes`
