import test from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";

test("determinism score is perfect for same execution id", () => {
  const out = execSync(
    "pnpm exec tsx packages/cli/src/index.ts prove --execution-id determinism-test",
    { encoding: "utf8" }
  );
  assert.match(out, /PASS/);
  assert.match(out, /replay_equivalence=true/);
});
