# Foundry Runbook

## Bootstrap

```bash
pnpm --filter @settler/cli exec tsx src/index.ts foundry bootstrap
```

## Core vector flow

```bash
pnpm --filter @settler/cli exec tsx src/index.ts foundry vectors run --suite core --seeds 1,2,3
pnpm --filter @settler/cli exec tsx src/index.ts foundry vectors report --last 1
```

## Git miner

```bash
pnpm --filter @settler/cli exec tsx src/index.ts foundry mine --limit 50
```

## Metamorphic generation

```bash
pnpm --filter @settler/cli exec tsx src/index.ts foundry metamorphic generate --base-suite core --per 5 --seed 1
pnpm --filter @settler/cli exec tsx src/index.ts foundry report --last 1
```

## Fault suite (gated)

```bash
FOUNDRY_FAULTS=1 pnpm --filter @settler/cli exec tsx src/index.ts foundry faults run --dataset <dataset_id>
```

## Report artifacts

All outputs write to `artifacts/foundry/`.

- `foundry_report.json`
- `foundry_report.csv`
- `failing_items.json`
