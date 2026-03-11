# Demo Mode - Try Settler in 60 Seconds

Demo mode provides a self-contained, deterministic demonstration of Settler's core reconciliation workflow without requiring external API keys or live integrations.

## Quick Start

For the canonical full-system demo path, run `pnpm run demo:settler` (pipeline wrapper).

```bash
# 1. Generate demo data
pnpm run demo:seed

# 2. Start the API server
pnpm run dev

# 3. Try the demo endpoints
curl http://localhost:3000/api/v1/playground/demo-dataset
curl -X POST http://localhost:3000/api/v1/playground/demo-run
```

## Demo Mode Features

| Feature             | Status | Description                             |
| ------------------- | ------ | --------------------------------------- |
| Deterministic Data  | ✅     | Same seed = same data every time        |
| No External APIs    | ✅     | Uses stubbed adapters, no network calls |
| No Secrets Required | ✅     | Runs in CI without credentials          |
| Realistic Workflow  | ✅     | Complete reconciliation pipeline        |

## Demo Data

The demo includes realistic financial data:

- **20 Stripe charges** with varying amounts ($10-$110)
- **5 Payouts** matching bank deposits
- **1 Unmatched bank fee** for anomaly detection demo
- **Expected matches** for validation

### Data Schema

```typescript
interface DemoTransaction {
  id: string;
  externalId: string;
  amount: number;
  currency: string;
  date: Date;
  description: string;
  type: "charge" | "payout" | "refund" | "fee" | "transfer";
  source: "stripe" | "bank";
  status: string;
}
```

## API Endpoints

### GET /api/v1/playground/demo-dataset

Returns the demo dataset for inspection:

```json
{
  "source": {
    "name": "Stripe (Demo)",
    "count": 20,
    "data": [...]
  },
  "target": {
    "name": "Bank (Demo)",
    "count": 6,
    "data": [...]
  },
  "expectedMatches": [...]
}
```

### POST /api/v1/playground/demo-run

Runs reconciliation on demo data:

```json
{
  "runId": "run_1704067200000",
  "timestamp": "2025-01-01T00:00:00Z",
  "summary": {
    "totalSource": 20,
    "totalTarget": 6,
    "matched": 5,
    "unmatchedSource": 15,
    "unmatchedTarget": 1,
    "matchRate": "83.3%"
  },
  "matches": [...],
  "unmatchedSource": [...],
  "unmatchedTarget": [...]
}
```

## Customizing Demo Data

### Custom Seed

```bash
DEMO_SEED=12345 pnpm run demo:seed
```

Different seeds produce different transaction amounts and dates while maintaining the same structure.

### Reset Demo Data

```bash
pnpm run demo:seed:reset
```

This clears existing demo data and regenerates from scratch.

## Demo Mode in CI

The demo mode E2E test runs in CI without secrets:

```yaml
# .github/workflows/e2e.yml
demo-mode:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: pnpm install --frozen-lockfile
    - run: pnpm run demo:seed
    - run: pnpm run test:e2e -- --grep="Demo Mode"
```

### CI Environment Variables

```bash
DEMO_MODE=true           # Enable demo mode
DEMO_SEED=42            # Deterministic seed
E2E_API_KEY=demo-key    # Demo API key
```

## Architecture

```
scripts/seed-demo.ts          # Generates demo data
packages/adapters/src/demo.ts # Stub adapters
packages/api/src/routes/playground.ts # Demo endpoints
tests/e2e/demo-mode.spec.ts  # E2E verification
```

### Seed Script

The `seed-demo.ts` script:

1. Generates deterministic UUIDs using a seeded RNG
2. Creates Stripe charges and payouts
3. Generates matching bank deposits
4. Records expected matches for validation
5. Writes JSON files to `demo/data/`

### Adapter Layer

The demo adapters (`demo.ts`) implement the same `Adapter` interface as real adapters:

```typescript
class DemoStripeAdapter implements Adapter {
  name = "demo-stripe";
  version = "1.0.0";

  async fetch(options: FetchOptions): Promise<NormalizedData[]> {
    // Returns data from demo/data/demo_stripe_transactions.json
  }
}
```

## Verification Checklist

After running demo mode, verify:

- [ ] Demo dataset loads successfully
- [ ] Reconciliation run completes without errors
- [ ] Match rate is realistic (>70%)
- [ ] Unmatched records include the bank fee anomaly
- [ ] Results are deterministic (same seed = same results)

## Troubleshooting

### Demo data not found

```
Error: Demo data not found. Run 'pnpm run demo:seed' first.
```

**Fix:** Run `pnpm run demo:seed` before starting the server.

### Port already in use

The demo endpoints require the API server to be running:

```bash
pnpm --filter @settler/api run dev
```

### Seed script fails

Ensure dependencies are installed:

```bash
pnpm install --frozen-lockfile
```

## Next Steps

1. **Add Real Integrations**: Configure Stripe/Shopify credentials
2. **Try Custom Data**: Upload your own CSV for reconciliation
3. **Explore Console**: Visit `/console` for the admin UI
4. **Run Full E2E**: Execute `pnpm run test:e2e` for comprehensive tests

## See Also

- [API Reference](API_REFERENCE.md)
- [Adapter Architecture](adapters.md)
- [Reconciliation Workflow](WORKFLOWS.md)
