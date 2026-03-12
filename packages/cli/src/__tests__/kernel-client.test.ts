declare const describe: (name: string, fn: () => void) => void;
declare const test: (name: string, fn: () => Promise<void> | void) => void;
declare const expect: any;

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  artifactIdentityHashWithFallback,
  checkKernelOperationReadiness,
  canonicalizeHashWithFallback,
  getKernelTelemetrySnapshot,
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
      SETTLER_KERNEL_EXECUTION_MODE: "shadow",
      SETTLER_KERNEL_PRIMARY_ALLOWLIST: "canonicalize_hash",
    } as NodeJS.ProcessEnv);

    expect(flags.enabled).toBe(true);
    expect(flags.canonicalize).toBe(false);
    expect(flags.shadowMode).toBe(true);
    expect(flags.executionMode).toBe("shadow");
    expect(flags.primaryAllowlist.has("canonicalize_hash")).toBe(true);
    expect(flags.disabledOperations.size).toBe(0);
  });

  test("supports operational safety env overrides", () => {
    const flags = readKernelFlags({
      SETTLER_DISABLE_KERNEL: "1",
      SETTLER_KERNEL_ENABLED: "1",
      SETTLER_KERNEL_CANONICALIZE: "1",
      SETTLER_KERNEL_SHADOW_ONLY: "1",
      SETTLER_DISABLE_OPERATION: "proof_bundle_hash,artifact_identity_hash",
    } as NodeJS.ProcessEnv);

    expect(flags.enabled).toBe(false);
    expect(flags.canonicalize).toBe(false);
    expect(flags.executionMode).toBe("disabled");
    expect(flags.shadowMode).toBe(true);
    expect(flags.disabledOperations.has("proof_bundle_hash")).toBe(true);
    expect(flags.disabledOperations.has("artifact_identity_hash")).toBe(true);
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
    process.env.SETTLER_KERNEL_EXECUTION_MODE = "disabled";
    resetKernelTelemetry();

    const result = await canonicalizeHashWithFallback({ b: 1, a: 2 });
    expect(result.mode).toBe("ts");
    expect(result.runnerMode).toBe("disabled");
    expect(result.metadata.fallbackReason).toBe("kernel_disabled");
    expect(result.result.normalizedHash).toMatch(/^[a-f0-9]{64}$/);
  });

  test("proof bundle fallback uses ts rule hash when primary not allowlisted", async () => {
    process.env.SETTLER_KERNEL_ENABLED = "1";
    process.env.SETTLER_KERNEL_CANONICALIZE = "1";
    process.env.SETTLER_KERNEL_EXECUTION_MODE = "primary";
    process.env.SETTLER_KERNEL_PRIMARY_ALLOWLIST = "canonicalize_hash";
    process.env.SETTLER_KERNEL_BIN = process.execPath;
    process.env.SETTLER_KERNEL_ALLOW_CARGO = "0";
    process.env.NODE_ENV = "production";
    process.env.CI = "true";
    resetKernelTelemetry();

    const result = await proofBundleHashWithFallback({ evidence: { b: 2, a: 1 } });
    expect(result.mode).toBe("ts");
    expect(result.runnerMode).toBe("fallback-ts");
    expect(result.metadata.fallbackReason).toBe("primary_not_allowed");
    const expected = createHash("sha256").update("proof_bundle_hash@v1").digest("hex");
    expect(result.result.ruleHash).toBe(expected);
    expect(result.result.ruleHash).not.toBe(tsCanonicalizeHash({ a: 1 }).ruleHash);

    const telemetry = getKernelTelemetrySnapshot();
    expect(telemetry.fallbackByReason.primary_not_allowed).toBe(1);
  });

  test("artifact identity hash is deterministic with ts fallback", async () => {
    process.env.SETTLER_KERNEL_ENABLED = "1";
    process.env.SETTLER_KERNEL_CANONICALIZE = "1";
    process.env.SETTLER_KERNEL_EXECUTION_MODE = "primary";
    process.env.SETTLER_KERNEL_PRIMARY_ALLOWLIST = "artifact_identity_hash";
    process.env.SETTLER_KERNEL_BIN = "/missing/bin";
    process.env.SETTLER_KERNEL_ALLOW_CARGO = "0";
    process.env.NODE_ENV = "production";
    process.env.CI = "true";

    const a = await artifactIdentityHashWithFallback({ b: 2, a: 1 });
    const b = await artifactIdentityHashWithFallback({ a: 1, b: 2 });
    expect(a.result.normalizedHash).toBe(b.result.normalizedHash);
    expect(a.metadata.fallbackReason).toBe("binary_unavailable");
  });

  test("operation disable flag forces explicit fallback reason", async () => {
    process.env.SETTLER_KERNEL_ENABLED = "1";
    process.env.SETTLER_KERNEL_CANONICALIZE = "1";
    process.env.SETTLER_KERNEL_EXECUTION_MODE = "primary";
    process.env.SETTLER_KERNEL_PRIMARY_ALLOWLIST = "proof_bundle_hash";
    process.env.SETTLER_DISABLE_OPERATION = "proof_bundle_hash";
    resetKernelTelemetry();

    const result = await proofBundleHashWithFallback({ a: 1, b: 2 });
    expect(result.mode).toBe("ts");
    expect(result.runnerMode).toBe("disabled");
    expect(result.metadata.fallbackReason).toBe("operation_disabled_env");

    const telemetry = getKernelTelemetrySnapshot();
    expect(telemetry.fallbackByReason.operation_disabled_env).toBe(1);
  });

  test("readiness check reports disabled state without throwing", async () => {
    process.env.SETTLER_DISABLE_KERNEL = "1";
    process.env.SETTLER_KERNEL_ENABLED = "1";
    process.env.SETTLER_KERNEL_CANONICALIZE = "1";

    const readiness = await checkKernelOperationReadiness("canonicalize_hash");
    expect(readiness.operationReady).toBe(false);
    expect(readiness.reason).toBe("kernel_disabled");
    expect(readiness.runnerMode).toBe("disabled");
  });
});
