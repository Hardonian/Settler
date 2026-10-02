# Settler Demo

For the verified credential-free settlement path, run:

```bash
pnpm run demo:quickstart
pnpm run demo:verify
```

See [the canonical quickstart](./getting-started/quickstart.md) for the supported scope, generated evidence, and verification boundary.

## Legacy foundry demonstration

Run the deterministic moat demo:

```bash
pnpm demo
```

Expected artifacts:

- `examples/demo-data/dataset.json`
- `examples/demo-output/run.json`
- `examples/demo-output/results.json`
- `examples/demo-output/evidence.json`
- `examples/demo-output/report.html`

Replay check:

```bash
pnpm settler:replay examples/demo-output/evidence.json
```
