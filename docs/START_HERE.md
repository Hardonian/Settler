# START_HERE

If you are new to Settler, follow this sequence.

## 1) See value first

```bash
pnpm install
cp .env.example .env
pnpm exec tsx scripts/run-migrations-remote.ts
pnpm --filter @settler/web dev
pnpm demo
pnpm settler:replay examples/demo-output/evidence.json
```

What this proves:

- You can execute a reconciliation run locally.
- You can inspect mismatches and evidence artifacts.
- You can replay the same run to verify deterministic behavior for that dataset + ruleset.

## 2) Run quality gates

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## 3) Run release verification

```bash
pnpm verify
pnpm verify:oss
pnpm verify:routes
pnpm verify:boundaries
```

## 4) Pick your path

- Product/operator: [docs/product/README.md](./product/README.md)
- Technical evaluator: [docs/ENGINE.md](./ENGINE.md)
- Contributor: [../CONTRIBUTING.md](../CONTRIBUTING.md)
- Security reviewer: [docs/security/README.md](./security/README.md)
- Metrics/KPI reviewer: [docs/metrics/EVENT_TAXONOMY.md](./metrics/EVENT_TAXONOMY.md)
