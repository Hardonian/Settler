# Settler Workflow Starter

Quickstart template for building workflow orchestration with Settler.dev.

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

## Example: Simple Workflow

```javascript
const { SettlerClient } = require('@settler/sdk');

const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY,
});

async function runWorkflow() {
  // Create workflow
  const workflow = await client.workflows.create({
    name: 'Monthly Reconciliation Workflow',
    steps: [
      {
        id: 'ingest',
        type: 'ingestion',
        config: { adapter: 'stripe' },
        onSuccess: 'transform',
      },
      {
        id: 'transform',
        type: 'transform',
        config: { recipeId: 'recipe_123' },
        onSuccess: 'recon',
      },
      {
        id: 'recon',
        type: 'recon',
        config: { jobId: 'job_123' },
        onSuccess: 'audit',
      },
      {
        id: 'audit',
        type: 'audit',
        config: { format: 'pdf' },
      },
    ],
  });

  // Execute workflow
  const run = await client.workflows.execute(workflow.id);
  console.log('Workflow completed:', run.status);
}
```

## Example: Scheduled Workflow

```javascript
async function scheduledWorkflow() {
  const workflow = await client.workflows.create({
    name: 'Daily Reconciliation',
    steps: [
      // ... workflow steps
    ],
    triggers: [
      {
        type: 'schedule',
        config: {
          cron: '0 0 * * *', // Daily at midnight
        },
      },
    ],
  });

  console.log('Workflow scheduled:', workflow.id);
}
```

## Next Steps

- [Workflow Documentation](https://docs.settler.io/workflows)
- [API Reference](https://docs.settler.io/api-reference)
- [Examples](https://github.com/settler/examples)
