#!/usr/bin/env tsx

import {
  loadReplayBundle,
  persistReplayReport,
  runReplayVerification,
} from "../lib/replay-verification";

async function main(): Promise<void> {
  const bundle = process.argv[2];
  if (!bundle) {
    console.error("Usage: pnpm replay:run <bundle>");
    process.exit(1);
  }

  const loaded = loadReplayBundle(bundle);
  const report = await runReplayVerification(loaded);
  const reportPath = persistReplayReport(report);

  console.log(`run_id=${report.run_id}`);
  console.log(`replay_status=${report.replay_status}`);
  console.log(`hash_match=${report.hash_match}`);
  console.log(`execution_time_ms=${report.execution_time_ms}`);
  console.log(`report_path=${reportPath}`);

  if (!report.hash_match) {
    console.log(`divergence=${JSON.stringify(report.divergence)}`);
    process.exit(2);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Replay runner failed: ${message}`);
  process.exit(1);
});
