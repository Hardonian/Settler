# Settler Demo (TTFV)

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
