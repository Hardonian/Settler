# Demo Walkthrough (Settler Operator Flow)

This walkthrough assumes `pnpm demo:settler` has completed successfully.

## 1) Bootstrap the demo

```bash
pnpm demo:settler
```

The command verifies the environment, attempts migrations, loads demo data, starts local services, runs a deterministic reconciliation simulation, and verifies replay.

## 2) Explore operator surfaces

- **Run Explorer**: `http://localhost:3000/app/runs`
- **Truth Explorer**: `http://localhost:3000/app/proofs`
- **Live Event Stream**: `http://localhost:3000/app/metrics`
- **Alerts**: `http://localhost:3000/app/alerts`
- **Replay Lab**: `http://localhost:3000/app/replay`

## 3) Validate replay determinism

```bash
pnpm replay:run
```

For direct replay file verification:

```bash
pnpm exec tsx scripts/settler-replay.ts examples/demo-output/evidence.json
```

## 4) Validate policy simulation

```bash
pnpm simulate:settler
```

## 5) Inspect generated artifacts

- `examples/demo-output/run.json`
- `examples/demo-output/results.json`
- `examples/demo-output/evidence.json`
- `examples/demo-output/operator-demo-artifacts.json`
