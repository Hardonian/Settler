# Foundry Demo

## One command

```bash
pnpm --filter @settler/cli exec tsx src/index.ts foundry bootstrap
```

Expected outcome:

- JSON output containing dataset ids, run ids, and artifact directory.
- `artifacts/foundry/foundry_report.json` exists.

## Export example

```bash
pnpm --filter @settler/cli exec tsx src/index.ts foundry export --dataset core_vectors --format csv
```

Expected outcome:

- CSV rows with `item_id,label,kind`.
