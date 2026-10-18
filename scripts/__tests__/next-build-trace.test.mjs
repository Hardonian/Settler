import assert from "node:assert/strict";
import test from "node:test";
import { summarizeNextTrace } from "../lib/next-build-trace.mjs";

test("summarizeNextTrace keeps the longest occurrence of each span", () => {
  const trace = [
    JSON.stringify([
      { name: "compile", duration: 1_000 },
      { name: "trace", duration: 4_000 },
    ]),
    JSON.stringify([
      { name: "compile", duration: 3_000 },
      { name: "emit", duration: 2_000 },
    ]),
  ].join("\n");

  assert.deepEqual(summarizeNextTrace(trace, 2), [
    { name: "trace", durationMs: 4 },
    { name: "compile", durationMs: 3 },
  ]);
});
