/**
 * Basic usage examples for @settler/sdk
 * 
 * Run with: npx ts-node examples/basic-usage.ts
 */

import { SettlerClient, collectPaginated } from '../src';

async function main() {
  // Initialize the client
  const client = new SettlerClient({
    apiKey: process.env.SETTLER_API_KEY || 'sk_test_your_api_key',
    enableLogging: true, // Enable request/response logging
  });

  try {
    // Example 1: List available adapters
    console.log('\n=== Listing Adapters ===');
    const adapters = await client.adapters.list();
    console.log(`Found ${adapters.count} adapters:`);
    adapters.data.forEach((adapter) => {
      console.log(`  - ${adapter.name} (${adapter.id})`);
    });

    // Example 2: Create a reconciliation job
    console.log('\n=== Creating Job ===');
    const job = await client.jobs.create({
      name: 'Shopify-Stripe Reconciliation',
      source: {
        adapter: 'shopify',
        config: {
          apiKey: process.env.SHOPIFY_API_KEY || 'shopify_key',
          shopDomain: 'your-shop.myshopify.com',
        },
      },
      target: {
        adapter: 'stripe',
        config: {
          apiKey: process.env.STRIPE_SECRET_KEY || 'stripe_key',
        },
      },
      rules: {
        matching: [
          { field: 'order_id', type: 'exact' },
          { field: 'amount', type: 'exact', tolerance: 0.01 },
          { field: 'date', type: 'range', days: 1 },
        ],
        conflictResolution: 'last-wins',
      },
    });
    console.log(`Job created: ${job.data.id}`);

    // Example 3: Get a job
    console.log('\n=== Getting Job ===');
    const jobDetails = await client.jobs.get(job.data.id);
    console.log(`Job: ${jobDetails.data.name} (${jobDetails.data.status})`);

    // Example 4: Run a job manually
    console.log('\n=== Running Job ===');
    const execution = await client.jobs.run(job.data.id);
    console.log(`Execution started: ${execution.data.id}`);

    // Example 5: Get a report
    console.log('\n=== Getting Report ===');
    const report = await client.reports.get(job.data.id, {
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    });
    console.log('Report Summary:');
    console.log(`  Matched: ${report.data.summary.matched}`);
    console.log(`  Unmatched: ${report.data.summary.unmatched}`);
    console.log(`  Errors: ${report.data.summary.errors}`);
    console.log(`  Accuracy: ${report.data.summary.accuracy}%`);

    // Example 6: Pagination with async iteration
    console.log('\n=== Paginated Listing ===');
    let count = 0;
    for await (const jobItem of client.jobs.listPaginated()) {
      console.log(`  - ${jobItem.name}`);
      count++;
      if (count >= 5) break; // Limit for example
    }

    // Example 7: Collect all paginated results
    console.log('\n=== Collecting All Jobs ===');
    const allJobs = await collectPaginated(client.jobs.listPaginated());
    console.log(`Total jobs: ${allJobs.length}`);

    // Example 8: Webhook management
    console.log('\n=== Creating Webhook ===');
    const webhook = await client.webhooks.create({
      url: 'https://your-app.com/webhooks/settler',
      events: ['reconciliation.matched', 'reconciliation.mismatch'],
    });
    console.log(`Webhook created: ${webhook.data.id}`);

    // Cleanup
    console.log('\n=== Cleanup ===');
    await client.webhooks.delete(webhook.data.id);
    await client.jobs.delete(job.data.id);
    console.log('Cleanup complete');
  } catch (error) {
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main };
