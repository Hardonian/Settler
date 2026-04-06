/**
 * Settler Recon Starter — end-to-end reconciliation example
 *
 * This script:
 *   1. Creates a reconciliation job (Stripe → bank ledger)
 *   2. Executes the job
 *   3. Prints match/unmatch summary
 *   4. Lists any exceptions that need manual review
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
  // ── 1. Create a reconciliation job ────────────────────────────────
  console.log("\n▸ Creating reconciliation job…");
  const job = await settler.jobs.create({
    name: `Starter Kit Recon – ${new Date().toISOString().slice(0, 10)}`,
    source: {
      adapter: "stripe",
      config: {
        // In production, these come from your Stripe dashboard
        apiKey: process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder",
      },
    },
    target: {
      adapter: "internal_ledger",
      config: {},
    },
    rules: {
      matching: [
        { field: "transaction_id", type: "exact" },
        { field: "amount", type: "exact", tolerance: 0.01 },
        { field: "date", type: "range", days: 2 },
      ],
    },
  });
  console.log(`  Job created: ${job.data.id}`);

  // ── 2. Execute the job ────────────────────────────────────────────
  console.log("\n▸ Executing reconciliation…");
  const execution = await settler.jobs.run(job.data.id);
  console.log(`  Execution started: ${execution.data.id}`);

  // Wait for completion (in production, use webhooks instead of polling)
  console.log("  Waiting for results…");
  await sleep(3000);

  // ── 3. Fetch the report ───────────────────────────────────────────
  console.log("\n▸ Fetching report…");
  const report = await settler.reports.get(job.data.id);
  const { summary } = report.data;

  console.log("\n┌─────────────────────────────────────┐");
  console.log("│  Reconciliation Summary              │");
  console.log("├─────────────────────────────────────┤");
  console.log(`│  Matched:    ${String(summary.matched).padStart(8)}             │`);
  console.log(`│  Unmatched:  ${String(summary.unmatched).padStart(8)}             │`);
  console.log(`│  Accuracy:   ${String(summary.accuracy + "%").padStart(8)}             │`);
  console.log("└─────────────────────────────────────┘");

  // ── 4. List open exceptions ───────────────────────────────────────
  if (summary.unmatched > 0) {
    console.log("\n▸ Open exceptions:");
    const exceptions = await settler.reports.list({
      jobId: job.data.id,
      status: "open",
    });
    for (const ex of exceptions.data) {
      console.log(`  • ${ex.id}  ${ex.type}  ${ex.status}`);
    }
  }

  console.log("\n✓ Done. View full results in the Settler console.");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((err) => {
  console.error("Reconciliation failed:", err.message ?? err);
  process.exit(1);
});
