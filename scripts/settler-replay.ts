#!/usr/bin/env tsx
import path from "node:path";
import { replayRun } from "./moat/replay";

async function main() {
  const evidencePath = process.argv[2] ?? "examples/demo-output/evidence.json";
  const resolved = path.resolve(evidencePath);
  const replay = await replayRun(resolved);
  if (!replay.matches) {
    console.error(`Replay mismatch: expected=${replay.expected} actual=${replay.actual}`);
    process.exit(1);
  }
  console.log("Replay Verified: OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
