/**
 * Check the results of a previous reconciliation run.
 *
 * Usage:
 *   JOB_ID=job_abc123 npm run check-results
 */

import SettlerClient from "@settler/sdk";

const apiKey = process.env.SETTLER_API_KEY;
if (!apiKey) {
  console.error("Missing SETTLER_API_KEY");
  process.exit(1);
}

const jobId = process.env.JOB_ID;
if (!jobId) {
  console.error("Missing JOB_ID – set the JOB_ID env var to a reconciliation job ID.");
  process.exit(1);
}

const settler = new SettlerClient({
  apiKey,
  baseUrl: process.env.SETTLER_BASE_URL || "https://api.settler.dev",
});

async function main() {
  const report = await settler.reports.get(jobId!);
  console.log(JSON.stringify(report.data, null, 2));
}

main().catch((err) => {
  console.error("Failed to fetch results:", err.message ?? err);
  process.exit(1);
});
