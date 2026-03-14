import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execSync } from "node:child_process";

test("latest proofpack remains verifiable after interrupted write simulation", () => {
  execSync("pnpm exec tsx packages/cli/src/index.ts prove --execution-id crash-test", {
    encoding: "utf8",
  });
  fs.writeFileSync("proofpacks/crash-test/proofpack.json", '{"incomplete":true', "utf8");
  const out = execSync(
    "pnpm exec tsx packages/cli/src/index.ts verify proofpacks/latest/proofpack.json",
    { encoding: "utf8" }
  );
  assert.match(out, /VALID/);
});
