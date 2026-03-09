declare const describe: (name: string, fn: () => void) => void;
declare const beforeAll: (fn: () => Promise<void> | void) => void;
declare const afterAll: (fn: () => Promise<void> | void) => void;
declare const it: (name: string, fn: () => Promise<void> | void) => void;
declare const expect: any;

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

describe("execution ledger", () => {
  const fixtureDir = path.join(os.tmpdir(), `settler-ledger-test-${Date.now()}`);

  beforeAll(async () => {
    process.env.SETTLER_LEDGER_DIR = fixtureDir;
    await fs.mkdir(fixtureDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(fixtureDir, { recursive: true, force: true });
    delete process.env.SETTLER_LEDGER_DIR;
  });

  it("appends hash-chained entries and verifies them", async () => {
    const ledger = await import("../lib/execution-ledger");

    await ledger.appendLedgerEntry({
      execution_id: "exec-1",
      tenant_id: "tenant-a",
      trace_id: "trace-1",
      timestamp: "2026-03-01T00:00:00.000Z",
      policy_version: "v1",
      input_hash: "in-1",
      output_hash: "out-1",
      status: "success",
      duration: 100,
      initiator: "CLI",
      tool_calls: ["normalize"],
    });

    const second = await ledger.appendLedgerEntry({
      execution_id: "exec-2",
      tenant_id: "tenant-a",
      trace_id: "trace-2",
      timestamp: "2026-03-01T00:00:01.000Z",
      policy_version: "v2",
      input_hash: "in-2",
      output_hash: "out-2",
      status: "success",
      duration: 140,
      initiator: "API",
      tool_calls: ["normalize", "match"],
    });

    expect(second.previous_execution_hash).not.toBe("GENESIS");

    const verification = await ledger.verifyLedgerEntry("exec-2");
    expect(verification?.hashMatches).toBe(true);
    expect(verification?.receiptIntegrity).toBe(true);
    expect(verification?.replayCompatible).toBe(true);

    const first = await ledger.getLedgerEntry("exec-1");
    const diff = ledger.diffLedgerEntries(first!, second);
    expect(diff.policy_version).toBeDefined();
    expect(diff.duration).toBeDefined();
  });
});
