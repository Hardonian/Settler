/**
 * Settler Workflow Starter — webhook-driven reconciliation pipeline
 *
 * This script:
 *   1. Registers a webhook endpoint for reconciliation events
 *   2. Creates and executes a reconciliation job
 *   3. Exports the results as CSV
 *
 * The companion webhook-server.ts receives events in real time.
 *
 * Run:
 *   cp .env.example .env   # fill in your API key
 *   npm install
 *   npm start
 */

import SettlerClient from "@settler/sdk";

const apiKey = process.env.SETTLER_API_KEY;
if (!apiKey) {
  console.error("Missing SETTLER_API_KEY – copy .env.example to .env and set your key.");
  process.exit(1);
}

const settler = new SettlerClient({
  apiKey,
  baseUrl: process.env.SETTLER_BASE_URL || "https://api.settler.dev",
  enableLogging: true,
});

async function main() {
  // ── 1. Register webhook (idempotent) ──────────────────────────────
  console.log("\n▸ Registering webhook…");
  const webhook = await settler.webhooks.create({
    url: `http://localhost:${process.env.WEBHOOK_PORT || 8080}/settler/webhook`,
    events: ["reconciliation.completed", "reconciliation.failed", "exception.created"],
  });
  console.log(`  Webhook registered: ${webhook.data.id}`);
  console.log(`  Secret: ${webhook.data.secret}`);
  console.log("  (Start the webhook server in a second terminal: npm run webhook-server)\n");

  // ── 2. Create and run a reconciliation job ────────────────────────
  console.log("▸ Creating reconciliation job…");
  const job = await settler.jobs.create({
    name: `Workflow Starter – ${new Date().toISOString().slice(0, 10)}`,
    source: {
      adapter: "stripe",
      config: { apiKey: process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder" },
    },
    target: {
      adapter: "internal_ledger",
      config: {},
    },
    rules: {
      matching: [
        { field: "transaction_id", type: "exact" },
        { field: "amount", type: "exact", tolerance: 0.01 },
      ],
    },
  });
  console.log(`  Job created: ${job.data.id}`);

  console.log("\n▸ Executing reconciliation…");
  const execution = await settler.jobs.run(job.data.id);
  console.log(`  Execution: ${execution.data.id}`);
  console.log("  The webhook server will receive events as the run progresses.\n");

  // ── 3. Export results ─────────────────────────────────────────────
  console.log("▸ Requesting CSV export…");
  const exportResult = await settler.exports.create({
    jobId: job.data.id,
    format: "csv",
    includeEvidence: true,
  });
  console.log(`  Export queued: ${exportResult.data.id}`);
  console.log(`  Download will be available at: ${exportResult.data.downloadUrl ?? "(pending)"}`);

  console.log("\n✓ Pipeline complete. Check the webhook server terminal for real-time events.");
}

main().catch((err) => {
  console.error("Pipeline failed:", err.message ?? err);
  process.exit(1);
});
