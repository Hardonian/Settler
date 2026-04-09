/**
 * External Integration Example
 *
 * This demonstrates how external developers can integrate with Settler
 * without reading internal code. All functionality is accessed through
 * the public API and SDK.
 *
 * Prerequisites:
 * 1. Set SETTLER_API_KEY environment variable
 * 2. Set SETTLER_WEBHOOK_SECRET if using webhooks
 */

import { SettlerClient } from "@settler/sdk";

// Initialize client with API key
const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY || "rk_your_api_key_here",
  enableLogging: true,
});

/**
 * Example: Create a reconciliation job
 */
async function createReconciliationJob() {
  console.log("Creating reconciliation job...");

  const job = await client.jobs.create({
    name: "Stripe-Shopify Reconciliation",
    source: {
      adapter: "stripe",
      config: {
        apiKey: process.env.STRIPE_SECRET_KEY,
      },
    },
    target: {
      adapter: "shopify",
      config: {
        apiKey: process.env.SHOPIFY_API_KEY,
        shopDomain: process.env.SHOPIFY_SHOP_DOMAIN,
      },
    },
    rules: {
      matching: [
        { field: "order_id", type: "exact" },
        { field: "amount", type: "exact", tolerance: 0.01 },
      ],
    },
  });

  console.log("Job created:", job.data.id);
  return job.data.id;
}

/**
 * Example: Run a job and wait for completion
 */
async function runJobAndWait(jobId) {
  console.log(`Running job ${jobId}...`);

  const execution = await client.jobs.run(jobId);
  console.log("Execution started:", execution.data.id);

  // Poll for completion (in production, use webhooks instead)
  let status = "running";
  while (status === "running") {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

    const job = await client.jobs.get(jobId);
    status = job.data.status;

    console.log(`Job status: ${status}`);
  }

  return status;
}

/**
 * Example: Get reconciliation report
 */
async function getReport(jobId) {
  console.log(`Getting report for job ${jobId}...`);

  const report = await client.reports.get(jobId, {
    startDate: "2024-01-01",
    endDate: "2024-12-31",
  });

  console.log("Report Summary:");
  console.log(`  Matched: ${report.data.summary.matched}`);
  console.log(`  Unmatched Source: ${report.data.summary.unmatchedSource}`);
  console.log(`  Unmatched Target: ${report.data.summary.unmatchedTarget}`);
  console.log(`  Accuracy: ${report.data.summary.accuracy}%`);

  return report.data;
}

/**
 * Example: Set up webhook subscription
 */
async function setupWebhook() {
  console.log("Setting up webhook subscription...");

  const webhook = await client.webhooks.create({
    url: process.env.WEBHOOK_URL || "https://your-app.com/webhooks/settler",
    events: ["reconciliation.completed", "reconciliation.failed", "ingestion.completed"],
  });

  console.log("Webhook created:", webhook.data.id);
  console.log("Webhook secret:", webhook.data.secret);
  console.log("\n⚠️  Store the secret securely - you'll need it to verify webhook signatures");

  return webhook.data;
}

/**
 * Example: List available webhook events
 */
async function listWebhookEvents() {
  console.log("Fetching available webhook events...");

  // Note: This would require adding a method to the SDK
  // For now, see docs/WEBHOOKS.md for event types
  const events = [
    "ingestion.completed",
    "reconciliation.completed",
    "reconciliation.failed",
    "job.run.completed",
  ];

  console.log("Available events:");
  events.forEach((event) => console.log(`  - ${event}`));

  return events;
}

/**
 * Example: Manage API keys
 */
async function manageApiKeys() {
  console.log("Managing API keys...");

  // Create new API key
  const apiKey = await client.console.createApiKey({
    name: "Production API Key",
    scopes: ["jobs:read", "jobs:write", "reports:read"],
    rateLimit: 5000,
  });

  console.log("API key created:", apiKey.data.id);
  console.log("API key:", apiKey.data.key);
  console.log("\n⚠️  Store the key securely - it won't be shown again");

  // List API keys (masked)
  const keys = await client.console.listApiKeys();
  console.log(`\nTotal API keys: ${keys.data.length}`);
  keys.data.forEach((key) => {
    console.log(`  - ${key.name}: ${key.keyPrefix} (${key.revoked ? "revoked" : "active"})`);
  });

  return apiKey.data;
}

/**
 * Main example flow
 */
async function main() {
  try {
    console.log("=== Settler External Integration Example ===\n");

    // 1. List available events
    await listWebhookEvents();
    console.log("");

    // 2. Create reconciliation job
    const jobId = await createReconciliationJob();
    console.log("");

    // 3. Run job
    const status = await runJobAndWait(jobId);
    console.log("");

    // 4. Get report
    if (status === "completed") {
      await getReport(jobId);
      console.log("");
    }

    // 5. Set up webhook (optional)
    if (process.env.SETUP_WEBHOOK === "true") {
      await setupWebhook();
      console.log("");
    }

    // 6. Manage API keys (optional)
    if (process.env.MANAGE_API_KEYS === "true") {
      await manageApiKeys();
      console.log("");
    }

    console.log("=== Example Complete ===");
  } catch (error) {
    console.error("Error:", error);
    if (error.message) {
      console.error("Message:", error.message);
    }
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
