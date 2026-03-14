import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execSync } from "node:child_process";

test("CAS references match trace state hashes", () => {
  execSync("pnpm exec tsx packages/cli/src/index.ts prove --execution-id cas-test", {
    encoding: "utf8",
  });
  const pack = JSON.parse(fs.readFileSync("proofpacks/cas-test/proofpack.json", "utf8"));
  for (let i = 0; i < pack.trace.length; i += 1) {
    assert.equal(pack.CAS_references[i], `cas://${pack.trace[i].stateHash}`);
  }
});
