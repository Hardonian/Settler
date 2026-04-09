/**
 * Example: E-commerce Order Reconciliation
 * Reconcile Shopify orders with Stripe payments
 */

import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

async function main() {
  // Create reconciliation job
  const job = await settler.jobs.create({
    name: "Daily Order Reconciliation",
    source: {
      adapter: "shopify",
      config: {
        apiKey: process.env.SHOPIFY_API_KEY!,
        shopDomain: process.env.SHOPIFY_SHOP_DOMAIN!,
      },
    },
    target: {
      adapter: "stripe",
      config: {
        apiKey: process.env.STRIPE_SECRET_KEY!,
      },
    },
    rules: {
      matching: [
        { field: "order_id", type: "exact" },
        { field: "amount", type: "exact", tolerance: 0.01 },
        { field: "date", type: "range", days: 1 },
      ],
      conflictResolution: "last-wins",
    },
    schedule: "0 2 * * *", // Daily at 2 AM
  });

  console.log("Job created:", job.data.id);

  // Run reconciliation
  const execution = await settler.jobs.run(job.data.id);
  console.log("Execution started:", execution.data.id);

  // Wait for completion (in production, use webhooks)
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Get results
  const report = await settler.reports.get(job.data.id);
  console.log(`Matched: ${report.data.summary.matched}`);
  console.log(`Unmatched: ${report.data.summary.unmatched}`);
  console.log(`Accuracy: ${report.data.summary.accuracy}%`);

  // Handle exceptions
  if (report.data.summary.unmatched > 0) {
    const exceptions = await settler.exceptions.list({
      jobId: job.data.id,
      resolution_status: "open",
    });

    console.log(`Found ${exceptions.data.length} exceptions to review`);
  }
}

main().catch(console.error);
