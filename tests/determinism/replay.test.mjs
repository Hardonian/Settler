import test from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";

test("replay command reconstructs execution", () => {
  execSync("pnpm exec tsx packages/cli/src/index.ts prove --execution-id replay-test", {
    encoding: "utf8",
  });
  const out = execSync("pnpm exec tsx packages/cli/src/index.ts replay replay-test --explain", {
    encoding: "utf8",
  });
  assert.match(out, /Replay deterministic/);
});
