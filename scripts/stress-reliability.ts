#!/usr/bin/env tsx
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { FileEventBackbone } from "../runner/eventBackbone";

async function main() {
  const baseDir = path.join(os.tmpdir(), `settler-stress-${Date.now()}`);
  const backbone = new FileEventBackbone({ baseDir, maxReplayBatch: 1024 });
  const runCount = 10_000;

  for (let i = 0; i < runCount; i++) {
    const runId = `stress-${i}`;
    await backbone.append({
      tenantId: `tenant-${i % 50}`,
      runId,
      type: "workflow.triggered",
      payload: { index: i },
    });
    await backbone.append({
      tenantId: `tenant-${i % 50}`,
      runId,
      type: "execution.completed",
      payload: { index: i, ok: true },
      idempotencyKey: `completed-${runId}`,
    });
  }

  const firstLease = await backbone.lease("stress-consumer", 20_000);
  assert.equal(firstLease.length, runCount * 2, "consumer must receive all events");
  await backbone.ack("stress-consumer", firstLease.at(-1)?.sequence ?? 0);

  const secondLease = await backbone.lease("stress-consumer", 5);
  assert.equal(secondLease.length, 0, "acked consumer should not receive duplicates");

  // Partial WAL write simulation
  const walPath = path.join(baseDir, "events.ndjson");
  await fs.appendFile(walPath, '{"incomplete":true', "utf8");
  const recoveredLease = await backbone.lease("recovery-consumer", 5);
  assert.equal(recoveredLease.length, 5, "reader must tolerate malformed tail write");

  const sampleReplay = await backbone.replay("stress-1234");
  assert.equal(sampleReplay.length, 2, "replay should return full run event chain");

  const health = await backbone.health();
  assert.equal(health.eventCount, runCount * 2, "event count should exclude malformed row");

  console.log("✅ stress reliability passed");
  console.log(`   runs: ${runCount}`);
  console.log(`   events: ${health.eventCount}`);
  console.log(`   consumers: ${health.consumerCount}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
