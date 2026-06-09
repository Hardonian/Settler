declare const describe: (name: string, fn: () => void) => void;
declare const test: (name: string, fn: () => Promise<void> | void, timeout?: number) => void;
declare const expect: any;
declare const beforeEach: (fn: () => void) => void;
declare const afterEach: (fn: () => void) => void;

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  artifactIdentityHashWithFallback,
  checkKernelOperationReadiness,
  canonicalizeHashWithFallback,
  getKernelStartupHealth,
  getKernelTelemetrySnapshot,
  proofBundleHashWithFallback,
  readKernelFlags,
  resetKernelTelemetry,
  resolveKernelRunner,
  tsCanonicalizeHash,
} from "../lib/kernel-client";

const ORIGINAL_ENV = { ...process.env };
const tempDirs: string[] = [];

function restoreEnv(): void {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) {
      delete process.env[key];
    }
  }

  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function cleanupTempDirs(): void {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
}

function createKernelFixture(mode: "protocol_mismatch" | "malformed" | "timeout"): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kernel-test-"));
  tempDirs.push(dir);

  const script = path.join(dir, "kernel-fixture.js");
  const handshake =
    mode === "protocol_mismatch"
      ? {
          ok: true,
          operation: "handshake",
          protocol_version: "v9",
          kernel_version: "9.9.9",
          result: {
            operation: "handshake",
            protocol_version: "v9",
            kernel_version: "9.9.9",
            supported_operations: ["canonicalize_hash"],
          },
        }
      : {
          ok: true,
          operation: "handshake",
          protocol_version: "v1",
          kernel_version: "0.1.0",
          result: {
            operation: "handshake",
            protocol_version: "v1",
            kernel_version: "0.1.0",
            supported_operations: ["canonicalize_hash"],
          },
        };

  let operationBehavior = "process.stdout.write('unexpected-request');";
  if (mode === "malformed") {
    operationBehavior = "process.stdout.write('not-json');";
  } else if (mode === "timeout") {
    operationBehavior = "setTimeout(() => process.exit(0), 6000);";
  }

  fs.writeFileSync(
    script,
    `#!/usr/bin/env node
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  const isHandshake = input.includes('"operation":"handshake"');
  if (isHandshake) {
    process.stdout.write(${JSON.stringify(JSON.stringify(handshake))});
    return;
  }
  ${operationBehavior}
});
`,
    { mode: 0o755 }
  );

  if (process.platform !== "win32") {
    return script;
  }

  const wrapper = path.join(dir, "kernel-fixture.cmd");
  fs.writeFileSync(wrapper, `@echo off\r\n"${process.execPath}" "${script}"\r\n`, {
    mode: 0o755,
  });
  return wrapper;
}

beforeEach(() => {
  restoreEnv();
  cleanupTempDirs();
  resetKernelTelemetry();
});

afterEach(() => {
  restoreEnv();
  cleanupTempDirs();
  resetKernelTelemetry();
});

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

  test("execution mode falls back to shadow via legacy flag", () => {
    const flags = readKernelFlags({
      SETTLER_KERNEL_ENABLED: "1",
      SETTLER_KERNEL_CANONICALIZE: "1",
      SETTLER_KERNEL_SHADOW_MODE: "1",
    } as NodeJS.ProcessEnv);

    expect(flags.executionMode).toBe("shadow");
  });

  test("explicit execution mode takes precedence over legacy shadow flag", () => {
    const flags = readKernelFlags({
      SETTLER_KERNEL_ENABLED: "1",
      SETTLER_KERNEL_CANONICALIZE: "1",
      SETTLER_KERNEL_SHADOW_MODE: "1",
      SETTLER_KERNEL_EXECUTION_MODE: "primary",
    } as NodeJS.ProcessEnv);

    expect(flags.executionMode).toBe("primary");
  });

  test("startup health reports degraded when binary is missing", async () => {
    process.env.SETTLER_KERNEL_BIN = "/missing/kernel-bin";
    process.env.SETTLER_KERNEL_ALLOW_CARGO = "0";
    process.env.NODE_ENV = "production";
    process.env.CI = "true";

    const health = await getKernelStartupHealth();
    expect(health.healthy).toBe(false);
    expect(health.runnerMode).toBe("fallback-ts");
    expect(health.reason).toBe("binary_missing");
  });

  test("resolves binary runner when executable path is provided", () => {
    const resolved = resolveKernelRunner({
      SETTLER_KERNEL_BIN: process.execPath,
      NODE_ENV: "production",
      CI: "true",
      PATHEXT: process.env.PATHEXT,
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
    tempDirs.push(dir);
    const bin = path.join(dir, "kernel.bin");
    fs.writeFileSync(bin, "#!/bin/sh\necho nope\n", { mode: 0o644 });

    const resolved = resolveKernelRunner({
      SETTLER_KERNEL_BIN: bin,
      NODE_ENV: "production",
      CI: "true",
      PATHEXT: process.env.PATHEXT,
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

    const result = await canonicalizeHashWithFallback({ b: 1, a: 2 });
    expect(result.mode).toBe("ts");
    expect(result.runnerMode).toBe("disabled");
    expect(result.metadata.fallbackReason).toBe("kernel_disabled");
    expect(result.metadata.health).toBe("degraded");
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

    const result = await proofBundleHashWithFallback({ evidence: { b: 2, a: 1 } });
    expect(result.mode).toBe("ts");
    expect(result.runnerMode).toBe("fallback-ts");
    expect(result.metadata.fallbackReason).toBe("primary_not_allowed");
    expect(result.metadata.health).toBe("degraded");
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
    expect(a.metadata.health).toBe("degraded");
  });

  test("falls back with protocol_mismatch when handshake protocol is incompatible", async () => {
    process.env.SETTLER_KERNEL_ENABLED = "1";
    process.env.SETTLER_KERNEL_CANONICALIZE = "1";
    process.env.SETTLER_KERNEL_EXECUTION_MODE = "primary";
    process.env.SETTLER_KERNEL_PRIMARY_ALLOWLIST = "canonicalize_hash";
    process.env.SETTLER_KERNEL_BIN = createKernelFixture("protocol_mismatch");
    process.env.SETTLER_KERNEL_ALLOW_CARGO = "0";
    process.env.NODE_ENV = "production";
    process.env.CI = "true";

    const result = await canonicalizeHashWithFallback({ a: 1 });
    expect(result.mode).toBe("ts");
    expect(result.metadata.fallbackReason).toBe("protocol_mismatch");
    expect(result.metadata.health).toBe("degraded");
  });

  test("falls back on malformed kernel output", async () => {
    process.env.SETTLER_KERNEL_ENABLED = "1";
    process.env.SETTLER_KERNEL_CANONICALIZE = "1";
    process.env.SETTLER_KERNEL_EXECUTION_MODE = "primary";
    process.env.SETTLER_KERNEL_PRIMARY_ALLOWLIST = "canonicalize_hash";
    process.env.SETTLER_KERNEL_BIN = createKernelFixture("malformed");
    process.env.SETTLER_KERNEL_ALLOW_CARGO = "0";
    process.env.NODE_ENV = "production";
    process.env.CI = "true";

    const result = await canonicalizeHashWithFallback({ a: 1 });
    expect(result.mode).toBe("ts");
    expect(result.metadata.fallbackReason).toBe("primary_kernel_failed");
    const telemetry = getKernelTelemetrySnapshot();
    expect(telemetry.malformedOutput).toBeGreaterThan(0);
  });

  test("falls back with timeout reason when kernel invocation exceeds timeout", async () => {
    process.env.SETTLER_KERNEL_ENABLED = "1";
    process.env.SETTLER_KERNEL_CANONICALIZE = "1";
    process.env.SETTLER_KERNEL_EXECUTION_MODE = "primary";
    process.env.SETTLER_KERNEL_PRIMARY_ALLOWLIST = "canonicalize_hash";
    process.env.SETTLER_KERNEL_BIN = createKernelFixture("timeout");
    process.env.SETTLER_KERNEL_ALLOW_CARGO = "0";
    process.env.NODE_ENV = "production";
    process.env.CI = "true";

    const result = await canonicalizeHashWithFallback({ a: 1 });
    expect(result.mode).toBe("ts");
    expect(result.metadata.fallbackReason).toBe("timeout");
    const telemetry = getKernelTelemetrySnapshot();
    expect(telemetry.timeout).toBeGreaterThan(0);
  });

  test("operation disable flag forces explicit fallback reason", async () => {
    process.env.SETTLER_KERNEL_ENABLED = "1";
    process.env.SETTLER_KERNEL_CANONICALIZE = "1";
    process.env.SETTLER_KERNEL_EXECUTION_MODE = "primary";
    process.env.SETTLER_KERNEL_PRIMARY_ALLOWLIST = "proof_bundle_hash";
    process.env.SETTLER_DISABLE_OPERATION = "proof_bundle_hash";

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
