import test from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";

test("verify returns VALID for latest proofpack", () => {
  execSync("pnpm exec tsx packages/cli/src/index.ts prove --execution-id verify-test", {
    encoding: "utf8",
  });
  const out = execSync(
    "pnpm exec tsx packages/cli/src/index.ts verify proofpacks/latest/proofpack.json",
    { encoding: "utf8" }
  );
  assert.match(out, /VALID/);
});
