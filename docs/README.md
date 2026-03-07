# Settler Documentation

Settler is an open-source reconciliation control plane for provable financial truth.

Use this docs hub to go from first run → mismatch explanation → replay verification → evidence export.

## Start here in 5 minutes

1. Run the local quickstart: [`docs/getting-started/README.md`](getting-started/README.md)
2. Execute the deterministic demo + replay:

```bash
pnpm demo
pnpm settler:replay examples/demo-output/evidence.json
```

3. Inspect generated artifacts in `examples/demo-output`.

## Canonical doc map

- **Getting started:** [`docs/getting-started/README.md`](getting-started/README.md)
- **Product:** [`docs/product/README.md`](product/README.md)
- **Architecture:** [`docs/architecture/README.md`](architecture/README.md)
- **API + SDK:** [`docs/api/README.md`](api/README.md)
- **Security + trust:** [`docs/security/README.md`](security/README.md)
- **Operations:** [`docs/ops/README.md`](ops/README.md)
- **OSS vs Enterprise boundary:** [`docs/oss-vs-enterprise.md`](oss-vs-enterprise.md)

## First paths by reader

- **Engineer:** start with [`docs/getting-started/README.md`](getting-started/README.md), then [`docs/api/README.md`](api/README.md).
- **Finance/Ops operator:** start with [`docs/product/README.md`](product/README.md), then [`docs/ops/README.md`](ops/README.md).
- **Security reviewer:** start with [`docs/security/README.md`](security/README.md).
- **Founder / evaluator:** start with [`docs/product/README.md`](product/README.md), then [`docs/oss-vs-enterprise.md`](oss-vs-enterprise.md).
