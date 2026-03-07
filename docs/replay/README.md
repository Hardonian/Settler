# Replay Verification

Settler replay verification re-executes a prior run from canonical evidence and compares expected vs observed hash outcomes.

## What to verify

1. Execution timeline can be reconstructed deterministically.
2. Proof hash chain is intact.
3. Expected and observed outputs match or produce an explicit drift report.

## Commands

```bash
pnpm settler:replay examples/demo-output/evidence.json
pnpm run verify:proof
```

## Evidence outputs

- `examples/demo-output/report.html`
- `security/security-verdict.json`
