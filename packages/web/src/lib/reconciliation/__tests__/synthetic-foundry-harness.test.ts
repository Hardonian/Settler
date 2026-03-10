import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";

describe("synthetic foundry runtime contract harness", () => {
  it("asserts runtime-emitted reconciliation semantics", () => {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), "recon-harness-"));
    execSync(
      `pnpm --filter @settler/cli exec tsx src/index.ts foundry reconciliation-generate --seed 42 --profile smoke --output ${out}`,
      { stdio: "pipe" }
    );

    const golden = JSON.parse(fs.readFileSync(path.join(out, "golden.json"), "utf8"));
    const runtimeMatches = golden.runtime_matches as Array<any>;
    const grouped = runtimeMatches.filter((m) => m.classification === "GROUPED_MATCH");
    const manual = runtimeMatches.filter((m) => m.classification === "MANUAL_REVIEW");
    const disputes = runtimeMatches.filter((m) => m.is_dispute_related);

    expect(runtimeMatches.length).toBeGreaterThan(0);
    expect(grouped.some((m) => (m.group_member_transaction_ids?.length ?? 0) > 1)).toBe(true);
    expect(manual.every((m) => m.manual_review_rationale_codes.length > 0)).toBe(true);
    expect(disputes.every((m) => m.classification === "DISPUTE_RELATED")).toBe(true);
  });
});
