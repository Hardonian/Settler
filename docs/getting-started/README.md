# Getting Started

## One quickstart path (canonical)

1. Install dependencies and configure environment.
2. Run migrations.
3. Run web app.
4. Execute demo and replay evidence.

```bash
pnpm install
cp .env.example .env
pnpm exec tsx scripts/run-migrations-remote.ts
pnpm --filter @settler/web dev
pnpm demo
pnpm settler:replay examples/demo-output/evidence.json
```

## Inputs and outputs

- **Inputs:** transaction feeds, documents, connector payloads, reconciliation rules, policy configuration.
- **Outputs:** run results (matched and mismatched records), exception queue items, evidence packs (`run.json`, `results.json`, `evidence.json`, `report.html`).

## Where to go next

- Developer API + SDK: [`docs/api/README.md`](../api/README.md)
- Product and operator workflow: [`docs/product/README.md`](../product/README.md)
- Security/reliability trust path: [`docs/security/README.md`](../security/README.md)
