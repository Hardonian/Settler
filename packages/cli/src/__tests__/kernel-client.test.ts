declare const describe: (name: string, fn: () => void) => void;
declare const test: (name: string, fn: () => Promise<void> | void) => void;
declare const expect: any;

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  canonicalizeHashWithFallback,
  proofBundleHashWithFallback,
  readKernelFlags,
  resetKernelTelemetry,
  resolveKernelRunner,
  tsCanonicalizeHash,
} from "../lib/kernel-client";

describe("kernel client", () => {
  test("reads feature flags conservatively", () => {
    const flags = readKernelFlags({
      SETTLER_KERNEL_ENABLED: "1",
      SETTLER_KERNEL_CANONICALIZE: "0",
      SETTLER_KERNEL_SHADOW_MODE: "1",
    } as NodeJS.ProcessEnv);

    expect(flags.enabled).toBe(true);
    expect(flags.canonicalize).toBe(false);
    expect(flags.shadowMode).toBe(true);
  });

  test("resolves binary runner when executable path is provided", () => {
    const resolved = resolveKernelRunner({
      SETTLER_KERNEL_BIN: process.execPath,
      NODE_ENV: "production",
      CI: "true",
    });
    expect(resolved.mode).toBe("binary");
    expect(resolved.runner?.cmd).toBe(process.execPath);
  });

  test("degrades to fallback-ts when configured binary is missing", () => {
    const resolved = resolveKernelRunner({
      SETTLER_KERNEL_BIN: "/definitely/missing/settler-kernel",
      NODE_ENV: "production",
      CI: "true",
    });
    expect(resolved.mode).toBe("fallback-ts");
    expect(resolved.reason).toBe("binary_missing");
  });

  test("degrades to fallback-ts when configured binary is not executable", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kernel-test-"));
    const bin = path.join(dir, "kernel.bin");
    fs.writeFileSync(bin, "#!/bin/sh\necho nope\n", { mode: 0o644 });

    const resolved = resolveKernelRunner({
      SETTLER_KERNEL_BIN: bin,
      NODE_ENV: "production",
      CI: "true",
    });

    expect(resolved.mode).toBe("fallback-ts");
    expect(resolved.reason).toBe("binary_not_executable");
  });

  test("ts canonicalization is stable across key order", () => {
    const a = tsCanonicalizeHash({ z: 1, a: { m: 2, b: 3 } });
    const b = tsCanonicalizeHash({ a: { b: 3, m: 2 }, z: 1 });

    expect(a.normalizedHash).toBe(b.normalizedHash);
  });

  test("falls back to ts when kernel disabled", async () => {
    process.env.SETTLER_KERNEL_ENABLED = "0";
    process.env.SETTLER_KERNEL_CANONICALIZE = "0";
    process.env.SETTLER_KERNEL_SHADOW_MODE = "0";
    resetKernelTelemetry();

    const result = await canonicalizeHashWithFallback({ b: 1, a: 2 });
    expect(result.mode).toBe("ts");
    expect(result.runnerMode).toBe("disabled");
    expect(result.result.normalizedHash).toMatch(/^[a-f0-9]{64}$/);
  });

  test("proof bundle fallback uses ts rule hash when runner unavailable", async () => {
    process.env.SETTLER_KERNEL_ENABLED = "1";
    process.env.SETTLER_KERNEL_CANONICALIZE = "1";
    process.env.SETTLER_KERNEL_BIN = "/definitely/missing/settler-kernel";
    process.env.SETTLER_KERNEL_ALLOW_CARGO = "0";
    process.env.NODE_ENV = "production";
    process.env.CI = "true";

    const result = await proofBundleHashWithFallback({ evidence: { b: 2, a: 1 } });
    expect(result.mode).toBe("ts");
    expect(result.runnerMode).toBe("fallback-ts");
    const expected = createHash("sha256").update("proof_bundle_hash@v1").digest("hex");
    expect(result.result.ruleHash).toBe(expected);
    expect(result.result.ruleHash).not.toBe(tsCanonicalizeHash({ a: 1 }).ruleHash);
  });
});
