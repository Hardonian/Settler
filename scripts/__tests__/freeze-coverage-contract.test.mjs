import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));

for (const scriptName of [
  "verify",
  "verify:ci:contracts",
  "verify:security",
  "security:evidence",
  "verify:security:fast",
]) {
  test(`${scriptName} retains freeze-coverage verification`, () => {
    assert.match(
      pkg.scripts[scriptName],
      /pnpm run verify:freeze-coverage/,
      `${scriptName} must verify protected mutation routes`
    );
  });
}

test("freeze coverage verifier supports every protected HTTP mutation method", () => {
  const source = readFileSync("scripts/verify-freeze-coverage.ts", "utf8");
  assert.match(source, /method: "post" \| "put" \| "patch" \| "delete"/);
});
