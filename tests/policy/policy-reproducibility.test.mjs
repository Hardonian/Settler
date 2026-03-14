import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execSync } from "node:child_process";

test("policy hash stable for identical execution id", () => {
  execSync("pnpm exec tsx packages/cli/src/index.ts prove --execution-id policy-test", {
    encoding: "utf8",
  });
  const a = JSON.parse(fs.readFileSync("proofpacks/policy-test/proofpack.json", "utf8"));
  execSync("pnpm exec tsx packages/cli/src/index.ts prove --execution-id policy-test", {
    encoding: "utf8",
  });
  const b = JSON.parse(fs.readFileSync("proofpacks/policy-test/proofpack.json", "utf8"));
  assert.equal(a.policy_hash, b.policy_hash);
});
