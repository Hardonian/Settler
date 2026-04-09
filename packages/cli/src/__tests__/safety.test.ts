declare const describe: (name: string, fn: () => void) => void;
declare const test: (name: string, fn: () => Promise<void> | void) => void;
declare const expect: any;

import fs from "node:fs/promises";
import path from "node:path";

import { readLimitedUtf8, requireUnsafeAcknowledgement, resolveWithinCwd } from "../lib/safety";

describe("cli safety helpers", () => {
  test("rejects oversized JSON inputs", async () => {
    const tempDir = await fs.mkdtemp(path.join(process.cwd(), ".tmp-settler-cli-safety-"));
    const file = path.join(tempDir, "oversized.json");
    await fs.writeFile(file, "x".repeat(2048), "utf8");

    await expect(readLimitedUtf8(file, 1024)).rejects.toThrow("file exceeds max size");
  });

  test("rejects traversal paths outside cwd", () => {
    expect(() => resolveWithinCwd("../outside.json")).toThrow("path escapes repository root");
  });

  test("enforces --allow-unsafe acknowledgement", () => {
    expect(() => requireUnsafeAcknowledgement(false)).toThrow(
      "unsafe acknowledgement required: re-run with --allow-unsafe"
    );
    expect(() => requireUnsafeAcknowledgement(true)).not.toThrow();
  });
});
