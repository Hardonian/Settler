# Settler Recon Starter

Quickstart template for building reconciliation workflows with Settler.dev.

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your API key:**
   ```bash
   export SETTLER_API_KEY=sk_your_api_key
   ```

3. **Run the example:**
   ```bash
   npm start
   ```

## Example: Basic Reconciliation

```javascript
const { SettlerClient } = require('@settler/sdk');

const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY,
});

async function reconcile() {
  // Create reconciliation job
  const job = await client.recon.jobs.create({
    name: 'Monthly Reconciliation',
    sourceAdapter: 'stripe',
    targetAdapter: 'internal_ledger',
    reconStrategy: 'deterministic',
  });

  // Execute reconciliation
  const result = await client.recon.jobs.execute(job.id);

  // View results
  console.log('Matched:', result.matchedCount);
  console.log('Unmatched:', result.unmatchedSourceCount);
}
```

## Example: With Drift Detection

```javascript
async function reconcileWithDrift() {
  const job = await client.recon.jobs.create({
    name: 'Reconciliation with Drift Detection',
    sourceAdapter: 'stripe',
    targetAdapter: 'internal_ledger',
    reconStrategy: 'deterministic',
  });

  const result = await client.recon.jobs.execute(job.id);

  // Check for drift
  const drifts = await client.drift.list({
    reconJobId: job.id,
  });

  if (drifts.length > 0) {
    console.log('Drift detected:', drifts);
    // Auto-repair if enabled
    for (const drift of drifts) {
      await client.drift.autoRepair(drift.id);
    }
  }
}
```

## Next Steps

- [Documentation](https://docs.settler.io)
- [API Reference](https://docs.settler.io/api-reference)
- [Examples](https://github.com/settler/examples)
