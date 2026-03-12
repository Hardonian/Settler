import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { accessSync, constants, existsSync } from "node:fs";

const KERNEL_STDIO_CAPTURE_LIMIT = 4096;
const KERNEL_PROTOCOL_VERSION = "v1";
const KERNEL_MIN_VERSION_PREFIX = "0.";

type KernelOperation = "canonicalize_hash" | "proof_bundle_hash" | "artifact_identity_hash";

export type KernelExecutionMode = "disabled" | "compare_only" | "shadow" | "primary";

export interface CanonicalizeHashResult {
  schemaVersion: string;
  canonicalJson: string;
  inputHash: string;
  normalizedHash: string;
  ruleHash: string;
}

export interface KernelFlags {
  enabled: boolean;
  canonicalize: boolean;
  shadowMode: boolean;
  executionMode: KernelExecutionMode;
  primaryAllowlist: Set<KernelOperation>;
  disabledOperations: Set<KernelOperation>;
}

export type KernelRunnerMode = "binary" | "cargo-run" | "disabled" | "fallback-ts";

export type KernelErrorKind =
  | "BINARY_MISSING"
  | "BINARY_NOT_EXECUTABLE"
  | "SPAWN_FAILED"
  | "TIMEOUT"
  | "MALFORMED_JSON"
  | "NON_ZERO_EXIT"
  | "VERSION_MISMATCH"
  | "UNKNOWN_OPERATION"
  | "UNEXPECTED_SCHEMA"
  | "INVALID_ENVELOPE";

interface KernelEnvelope {
  ok: boolean;
  operation?: string;
  protocol_version?: string;
  kernel_version?: string;
  result?: {
    schema_version: string;
    canonical_json: string;
    input_hash: string;
    normalized_hash: string;
    rule_hash: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

interface KernelHandshakeResult {
  operation: "handshake";
  protocol_version: string;
  kernel_version: string;
  supported_operations: string[];
}

interface ResolvedKernelRunner {
  mode: Extract<KernelRunnerMode, "binary" | "cargo-run">;
  cmd: string;
  args: string[];
}

interface KernelTelemetrySnapshot {
  attempted: number;
  success: number;
  primaryMode: number;
  shadowCompare: number;
  compareOnly: number;
  fallbackTs: number;
  fallbackByReason: Record<string, number>;
  timeout: number;
  malformedOutput: number;
  versionMismatch: number;
  binaryUnavailable: number;
  divergence: number;
  divergenceByOperation: Record<string, number>;
  hashMismatch: number;
  healthChecks: number;
  healthCheckFailures: number;
}

export interface KernelExecutionMetadata {
  operation: KernelOperation;
  executionMode: KernelExecutionMode;
  usedPrimary: boolean;
  shadowCompared: boolean;
  fallbackReason?: string;
  health: "healthy" | "degraded";
}

function buildKernelExecutionMetadata(input: {
  operation: KernelOperation;
  executionMode: KernelExecutionMode;
  usedPrimary: boolean;
  shadowCompared: boolean;
  fallbackReason?: string;
}): KernelExecutionMetadata {
  return {
    ...input,
    health: input.fallbackReason ? "degraded" : "healthy",
  };
}

export interface KernelStartupHealth {
  healthy: boolean;
  runnerMode: KernelRunnerMode;
  durationMs: number;
  reason?: string;
  protocolVersion?: string;
  kernelVersion?: string;
  supportedOperations?: string[];
}

class KernelInvocationError extends Error {
  constructor(
    readonly kind: KernelErrorKind,
    readonly details?: { code?: string; stderr?: string; exitCode?: number | null }
  ) {
    super(`KERNEL_${kind}`);
  }
}

const telemetry: KernelTelemetrySnapshot = {
  attempted: 0,
  success: 0,
  primaryMode: 0,
  shadowCompare: 0,
  compareOnly: 0,
  fallbackTs: 0,
  fallbackByReason: {},
  timeout: 0,
  malformedOutput: 0,
  versionMismatch: 0,
  binaryUnavailable: 0,
  divergence: 0,
  divergenceByOperation: {},
  hashMismatch: 0,
  healthChecks: 0,
  healthCheckFailures: 0,
};

const handshakeCache = new Map<string, KernelHandshakeResult>();

function runnerCacheKey(runner: ResolvedKernelRunner): string {
  return `${runner.mode}:${runner.cmd}:${runner.args.join("\u{1f}")}`;
}

function boundedAppend(current: string, chunk: Buffer | string): string {
  const next = `${current}${chunk.toString()}`;
  if (next.length <= KERNEL_STDIO_CAPTURE_LIMIT) return next;
  return next.slice(next.length - KERNEL_STDIO_CAPTURE_LIMIT);
}

function redactStderr(stderr: string): string {
  return stderr
    .replace(/(token|secret|password|apikey|api_key)=([^\s]+)/gi, "$1=[REDACTED]")
    .replace(/[A-Za-z0-9_\-]{28,}/g, "[REDACTED]")
    .slice(0, KERNEL_STDIO_CAPTURE_LIMIT);
}

function shouldAllowCargoFallback(env: NodeJS.ProcessEnv): boolean {
  if (env.SETTLER_KERNEL_ALLOW_CARGO === "1") return true;
  if (env.SETTLER_KERNEL_DEV_FALLBACK === "1") return true;
  return env.NODE_ENV !== "production" && env.CI !== "true";
}

function parseExecutionMode(env: NodeJS.ProcessEnv): KernelExecutionMode {
  if (env.SETTLER_DISABLE_KERNEL === "1") return "disabled";
  if (env.SETTLER_KERNEL_SHADOW_ONLY === "1") return "shadow";
  const explicit = env.SETTLER_KERNEL_EXECUTION_MODE?.trim().toLowerCase();
  if (
    explicit === "disabled" ||
    explicit === "compare_only" ||
    explicit === "shadow" ||
    explicit === "primary"
  ) {
    return explicit;
  }
  if (env.SETTLER_KERNEL_SHADOW_MODE === "1") return "shadow";
  return "primary";
}

function parsePrimaryAllowlist(env: NodeJS.ProcessEnv): Set<KernelOperation> {
  const configured =
    env.SETTLER_KERNEL_PRIMARY_ALLOWLIST?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? [];
  const out = new Set<KernelOperation>();
  for (const candidate of configured) {
    if (
      candidate === "canonicalize_hash" ||
      candidate === "proof_bundle_hash" ||
      candidate === "artifact_identity_hash"
    ) {
      out.add(candidate);
    }
  }
  return out;
}

function parseDisabledOperations(env: NodeJS.ProcessEnv): Set<KernelOperation> {
  const configured =
    env.SETTLER_DISABLE_OPERATION?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? [];
  const out = new Set<KernelOperation>();
  for (const candidate of configured) {
    if (
      candidate === "canonicalize_hash" ||
      candidate === "proof_bundle_hash" ||
      candidate === "artifact_identity_hash"
    ) {
      out.add(candidate);
    }
  }
  return out;
}

function recordFallback(reason: string): void {
  telemetry.fallbackTs += 1;
  telemetry.fallbackByReason[reason] = (telemetry.fallbackByReason[reason] ?? 0) + 1;
}

function classifyErrorReason(error: unknown, defaultReason: string): string {
  if (error instanceof KernelInvocationError) {
    switch (error.kind) {
      case "BINARY_MISSING":
      case "BINARY_NOT_EXECUTABLE":
        return "binary_unavailable";
      case "VERSION_MISMATCH":
        return "protocol_mismatch";
      case "UNKNOWN_OPERATION":
        return "unsupported_operation";
      case "TIMEOUT":
        return "timeout";
      default:
        return defaultReason;
    }
  }
  return defaultReason;
}

function recordDivergence(operation: KernelOperation): void {
  telemetry.divergence += 1;
  telemetry.divergenceByOperation[operation] =
    (telemetry.divergenceByOperation[operation] ?? 0) + 1;
}

function shouldUsePrimary(flags: KernelFlags, operation: KernelOperation): boolean {
  if (flags.disabledOperations.has(operation)) return false;
  return flags.executionMode === "primary" && flags.primaryAllowlist.has(operation);
}

function operationExplicitlyDisabled(flags: KernelFlags, operation: KernelOperation): boolean {
  return flags.disabledOperations.has(operation);
}

export function readKernelFlags(env: NodeJS.ProcessEnv = process.env): KernelFlags {
  const executionMode = parseExecutionMode(env);
  const enabled = env.SETTLER_DISABLE_KERNEL === "1" ? false : env.SETTLER_KERNEL_ENABLED === "1";
  const canonicalize =
    env.SETTLER_DISABLE_KERNEL === "1" ? false : env.SETTLER_KERNEL_CANONICALIZE === "1";
  return {
    enabled,
    canonicalize,
    shadowMode:
      env.SETTLER_KERNEL_SHADOW_MODE === "1" ||
      env.SETTLER_KERNEL_SHADOW_ONLY === "1" ||
      executionMode === "shadow",
    executionMode,
    primaryAllowlist: parsePrimaryAllowlist(env),
    disabledOperations: parseDisabledOperations(env),
  };
}

export async function checkKernelOperationReadiness(
  operation: KernelOperation,
  timeoutMs = 1500
): Promise<{
  operation: KernelOperation;
  kernelBinaryAvailable: boolean;
  handshakeSuccess: boolean;
  operationReady: boolean;
  runnerMode: KernelRunnerMode;
  reason?: string;
}> {
  const flags = readKernelFlags();
  if (!flags.enabled || !flags.canonicalize || flags.executionMode === "disabled") {
    return {
      operation,
      kernelBinaryAvailable: false,
      handshakeSuccess: false,
      operationReady: false,
      runnerMode: "disabled",
      reason: "kernel_disabled",
    };
  }
  if (operationExplicitlyDisabled(flags, operation)) {
    return {
      operation,
      kernelBinaryAvailable: false,
      handshakeSuccess: false,
      operationReady: false,
      runnerMode: "disabled",
      reason: "operation_disabled_env",
    };
  }

  const resolved = resolveKernelRunner();
  if (!resolved.runner) {
    return {
      operation,
      kernelBinaryAvailable: false,
      handshakeSuccess: false,
      operationReady: false,
      runnerMode: resolved.mode,
      reason: resolved.reason ?? "no_runner_available",
    };
  }

  try {
    await ensureHandshake(resolved.runner, timeoutMs);
    ensureOperationSupport(resolved.runner, operation);
    return {
      operation,
      kernelBinaryAvailable: true,
      handshakeSuccess: true,
      operationReady: true,
      runnerMode: resolved.runner.mode,
    };
  } catch (error) {
    return {
      operation,
      kernelBinaryAvailable: true,
      handshakeSuccess: false,
      operationReady: false,
      runnerMode: resolved.runner.mode,
      reason: classifyErrorReason(error, "readiness_failed"),
    };
  }
}

export function resolveKernelRunner(env: NodeJS.ProcessEnv = process.env): {
  runner: ResolvedKernelRunner | null;
  mode: KernelRunnerMode;
  reason?: string;
} {
  const configuredBin = env.SETTLER_KERNEL_BIN?.trim();
  if (configuredBin) {
    if (!existsSync(configuredBin)) {
      return { runner: null, mode: "fallback-ts", reason: "binary_missing" };
    }
    try {
      accessSync(configuredBin, constants.X_OK);
      return { runner: { mode: "binary", cmd: configuredBin, args: [] }, mode: "binary" };
    } catch {
      return { runner: null, mode: "fallback-ts", reason: "binary_not_executable" };
    }
  }

  if (shouldAllowCargoFallback(env)) {
    return {
      runner: {
        mode: "cargo-run",
        cmd: "cargo",
        args: ["run", "--quiet", "-p", "settler-kernel-cli"],
      },
      mode: "cargo-run",
    };
  }

  return { runner: null, mode: "fallback-ts", reason: "no_runner_available" };
}

function tsCanonicalize(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map(tsCanonicalize);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = tsCanonicalize((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

export function tsCanonicalizeHash(value: unknown): CanonicalizeHashResult {
  const inputJson = JSON.stringify(value);
  const canonicalJson = JSON.stringify(tsCanonicalize(value));
  return {
    schemaVersion: "v1",
    canonicalJson,
    inputHash: createHash("sha256").update(inputJson).digest("hex"),
    normalizedHash: createHash("sha256").update(canonicalJson).digest("hex"),
    ruleHash: createHash("sha256").update("canonicalize_hash@v1").digest("hex"),
  };
}

function tsProofBundleHash(value: unknown): CanonicalizeHashResult {
  const base = tsCanonicalizeHash(value);
  return {
    ...base,
    ruleHash: createHash("sha256").update("proof_bundle_hash@v1").digest("hex"),
  };
}

function tsArtifactIdentityHash(value: unknown): CanonicalizeHashResult {
  const base = tsCanonicalizeHash(value);
  return {
    ...base,
    ruleHash: createHash("sha256").update("artifact_identity_hash@v1").digest("hex"),
  };
}

async function spawnKernelRequest(
  runner: ResolvedKernelRunner,
  body: string,
  timeoutMs: number
): Promise<{ envelope: KernelEnvelope; durationMs: number }> {
  return await new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const child = spawn(runner.cmd, runner.args, { stdio: ["pipe", "pipe", "pipe"] });
    const timer = setTimeout(() => {
      telemetry.timeout += 1;
      child.kill("SIGKILL");
      reject(new KernelInvocationError("TIMEOUT"));
    }, timeoutMs);

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout = boundedAppend(stdout, chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr = boundedAppend(stderr, chunk);
    });

    child.on("error", () => {
      clearTimeout(timer);
      reject(new KernelInvocationError("SPAWN_FAILED"));
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      const safeStderr = redactStderr(stderr);
      let parsed: KernelEnvelope;
      try {
        parsed = JSON.parse(stdout.trim());
      } catch {
        telemetry.malformedOutput += 1;
        reject(new KernelInvocationError("MALFORMED_JSON", { stderr: safeStderr, exitCode: code }));
        return;
      }

      if (code !== 0 && !parsed.ok) {
        reject(
          new KernelInvocationError("NON_ZERO_EXIT", {
            code: parsed.error?.code,
            stderr: safeStderr,
            exitCode: code,
          })
        );
        return;
      }

      resolve({ envelope: parsed, durationMs: Date.now() - startedAt });
    });

    child.stdin.write(body);
    child.stdin.end();
  });
}

function validateKernelEnvelope(
  envelope: KernelEnvelope,
  expectedOperation: string
): NonNullable<KernelEnvelope["result"]> {
  if (!envelope.ok || !envelope.result) {
    if (envelope.error?.code === "KERNEL_UNKNOWN_OPERATION") {
      throw new KernelInvocationError("UNKNOWN_OPERATION", { code: envelope.error.code });
    }
    throw new KernelInvocationError("INVALID_ENVELOPE", { code: envelope.error?.code });
  }

  if (envelope.operation !== expectedOperation) {
    throw new KernelInvocationError("UNEXPECTED_SCHEMA");
  }

  if (!envelope.kernel_version || !envelope.protocol_version) {
    telemetry.versionMismatch += 1;
    throw new KernelInvocationError("VERSION_MISMATCH");
  }

  if (!envelope.protocol_version.startsWith(KERNEL_PROTOCOL_VERSION)) {
    telemetry.versionMismatch += 1;
    throw new KernelInvocationError("VERSION_MISMATCH");
  }

  if (!envelope.kernel_version.startsWith(KERNEL_MIN_VERSION_PREFIX)) {
    telemetry.versionMismatch += 1;
    throw new KernelInvocationError("VERSION_MISMATCH");
  }

  if (envelope.result.schema_version !== "v1") {
    throw new KernelInvocationError("UNEXPECTED_SCHEMA");
  }

  return envelope.result;
}

async function ensureHandshake(runner: ResolvedKernelRunner, timeoutMs: number): Promise<void> {
  const cacheKey = runnerCacheKey(runner);
  if (handshakeCache.has(cacheKey)) return;

  const req = JSON.stringify({ operation: "handshake", payload: {} });
  const { envelope } = await spawnKernelRequest(runner, req, timeoutMs);
  if (!envelope.ok || !envelope.kernel_version || !envelope.protocol_version) {
    throw new KernelInvocationError("VERSION_MISMATCH");
  }
  if (envelope.operation !== "handshake" || !envelope.result) {
    throw new KernelInvocationError("UNEXPECTED_SCHEMA");
  }

  const result = envelope.result as unknown as KernelHandshakeResult;
  if (!result.kernel_version || !result.protocol_version || result.operation !== "handshake") {
    throw new KernelInvocationError("UNEXPECTED_SCHEMA");
  }
  if (result.protocol_version !== KERNEL_PROTOCOL_VERSION) {
    throw new KernelInvocationError("VERSION_MISMATCH");
  }

  handshakeCache.set(cacheKey, result);
}

export async function getKernelStartupHealth(timeoutMs = 1500): Promise<KernelStartupHealth> {
  const startedAt = Date.now();
  telemetry.healthChecks += 1;

  const resolved = resolveKernelRunner();
  if (!resolved.runner) {
    telemetry.healthCheckFailures += 1;
    return {
      healthy: false,
      runnerMode: resolved.mode,
      reason: resolved.reason ?? "no_runner_available",
      durationMs: Date.now() - startedAt,
    };
  }

  try {
    await ensureHandshake(resolved.runner, timeoutMs);
    const handshake = handshakeCache.get(runnerCacheKey(resolved.runner));
    return {
      healthy: Boolean(handshake),
      runnerMode: resolved.runner.mode,
      durationMs: Date.now() - startedAt,
      protocolVersion: handshake?.protocol_version,
      kernelVersion: handshake?.kernel_version,
      supportedOperations: handshake?.supported_operations,
    };
  } catch (error) {
    telemetry.healthCheckFailures += 1;
    return {
      healthy: false,
      runnerMode: resolved.runner.mode,
      durationMs: Date.now() - startedAt,
      reason: classifyErrorReason(error, "handshake_failed"),
    };
  }
}

function ensureOperationSupport(runner: ResolvedKernelRunner, operation: KernelOperation): void {
  const handshake = handshakeCache.get(runnerCacheKey(runner));
  if (!handshake) {
    throw new KernelInvocationError("VERSION_MISMATCH");
  }
  if (!handshake.supported_operations.includes(operation)) {
    throw new KernelInvocationError("UNKNOWN_OPERATION", { code: "KERNEL_UNKNOWN_OPERATION" });
  }
}

async function invokeKernelOperation(
  operation: KernelOperation,
  value: unknown,
  timeoutMs = 5000
): Promise<{
  result: CanonicalizeHashResult;
  runnerMode: Extract<KernelRunnerMode, "binary" | "cargo-run">;
  durationMs: number;
}> {
  const resolved = resolveKernelRunner();
  if (!resolved.runner) {
    telemetry.binaryUnavailable += 1;
    if (resolved.reason === "binary_missing") {
      throw new KernelInvocationError("BINARY_MISSING");
    }
    if (resolved.reason === "binary_not_executable") {
      throw new KernelInvocationError("BINARY_NOT_EXECUTABLE");
    }
    throw new KernelInvocationError("SPAWN_FAILED");
  }

  await ensureHandshake(resolved.runner, Math.min(1500, timeoutMs));
  ensureOperationSupport(resolved.runner, operation);

  const req = JSON.stringify({ operation, payload: value });
  const { envelope, durationMs } = await spawnKernelRequest(resolved.runner, req, timeoutMs);
  const validated = validateKernelEnvelope(envelope, operation);

  return {
    result: {
      schemaVersion: validated.schema_version,
      canonicalJson: validated.canonical_json,
      inputHash: validated.input_hash,
      normalizedHash: validated.normalized_hash,
      ruleHash: validated.rule_hash,
    },
    runnerMode: resolved.runner.mode,
    durationMs,
  };
}

export async function invokeKernelCanonicalizeHash(
  value: unknown,
  timeoutMs = 5000
): Promise<{
  result: CanonicalizeHashResult;
  runnerMode: Extract<KernelRunnerMode, "binary" | "cargo-run">;
  durationMs: number;
}> {
  return invokeKernelOperation("canonicalize_hash", value, timeoutMs);
}

export async function invokeKernelProofBundleHash(
  value: unknown,
  timeoutMs = 5000
): Promise<{
  result: CanonicalizeHashResult;
  runnerMode: Extract<KernelRunnerMode, "binary" | "cargo-run">;
  durationMs: number;
}> {
  return invokeKernelOperation("proof_bundle_hash", value, timeoutMs);
}

export async function invokeKernelArtifactIdentityHash(
  value: unknown,
  timeoutMs = 5000
): Promise<{
  result: CanonicalizeHashResult;
  runnerMode: Extract<KernelRunnerMode, "binary" | "cargo-run">;
  durationMs: number;
}> {
  return invokeKernelOperation("artifact_identity_hash", value, timeoutMs);
}

export async function canonicalizeHashWithFallback(value: unknown): Promise<{
  result: CanonicalizeHashResult;
  mode: "ts" | "rust_primary" | "ts_with_shadow";
  runnerMode: KernelRunnerMode;
  divergence?: { normalizedHashMatch: boolean };
  durationMs: { kernel?: number; ts: number };
  metadata: KernelExecutionMetadata;
}> {
  const flags = readKernelFlags();
  const tsStartedAt = Date.now();
  const ts = tsCanonicalizeHash(value);
  const tsDuration = Date.now() - tsStartedAt;

  if (!flags.enabled || !flags.canonicalize || flags.executionMode === "disabled") {
    return {
      result: ts,
      mode: "ts",
      runnerMode: "disabled",
      durationMs: { ts: tsDuration },
      metadata: buildKernelExecutionMetadata({
        operation: "canonicalize_hash",
        executionMode: "disabled",
        usedPrimary: false,
        shadowCompared: false,
        fallbackReason: "kernel_disabled",
      }),
    };
  }

  if (operationExplicitlyDisabled(flags, "canonicalize_hash")) {
    recordFallback("operation_disabled_env");
    return {
      result: ts,
      mode: "ts",
      runnerMode: "disabled",
      durationMs: { ts: tsDuration },
      metadata: buildKernelExecutionMetadata({
        operation: "canonicalize_hash",
        executionMode: flags.executionMode,
        usedPrimary: false,
        shadowCompared: false,
        fallbackReason: "operation_disabled_env",
      }),
    };
  }

  telemetry.attempted += 1;

  const compare = flags.executionMode === "shadow" || flags.executionMode === "compare_only";
  if (compare) {
    if (flags.executionMode === "compare_only") {
      telemetry.compareOnly += 1;
    } else {
      telemetry.shadowCompare += 1;
    }
    try {
      const rust = await invokeKernelCanonicalizeHash(value);
      const match = rust.result.normalizedHash === ts.normalizedHash;
      if (!match) {
        recordDivergence("canonicalize_hash");
        telemetry.hashMismatch += 1;
      }
      telemetry.success += 1;
      return {
        result: ts,
        mode: "ts_with_shadow",
        runnerMode: rust.runnerMode,
        divergence: { normalizedHashMatch: match },
        durationMs: { kernel: rust.durationMs, ts: tsDuration },
        metadata: buildKernelExecutionMetadata({
          operation: "canonicalize_hash",
          executionMode: flags.executionMode,
          usedPrimary: false,
          shadowCompared: true,
        }),
      };
    } catch (error) {
      const reason = classifyErrorReason(error, "shadow_kernel_failed");
      recordFallback(reason);
      recordDivergence("canonicalize_hash");
      return {
        result: ts,
        mode: "ts_with_shadow",
        runnerMode: "fallback-ts",
        divergence: { normalizedHashMatch: false },
        durationMs: { ts: tsDuration },
        metadata: buildKernelExecutionMetadata({
          operation: "canonicalize_hash",
          executionMode: flags.executionMode,
          usedPrimary: false,
          shadowCompared: true,
          fallbackReason: reason,
        }),
      };
    }
  }

  if (!shouldUsePrimary(flags, "canonicalize_hash")) {
    recordFallback("primary_not_allowed");
    return {
      result: ts,
      mode: "ts",
      runnerMode: "fallback-ts",
      durationMs: { ts: tsDuration },
      metadata: buildKernelExecutionMetadata({
        operation: "canonicalize_hash",
        executionMode: flags.executionMode,
        usedPrimary: false,
        shadowCompared: false,
        fallbackReason: "primary_not_allowed",
      }),
    };
  }

  try {
    const rust = await invokeKernelCanonicalizeHash(value);
    telemetry.success += 1;
    telemetry.primaryMode += 1;
    return {
      result: rust.result,
      mode: "rust_primary",
      runnerMode: rust.runnerMode,
      durationMs: { kernel: rust.durationMs, ts: tsDuration },
      metadata: buildKernelExecutionMetadata({
        operation: "canonicalize_hash",
        executionMode: flags.executionMode,
        usedPrimary: true,
        shadowCompared: false,
      }),
    };
  } catch (error) {
    const reason = classifyErrorReason(error, "primary_kernel_failed");
    recordFallback(reason);
    return {
      result: ts,
      mode: "ts",
      runnerMode: "fallback-ts",
      durationMs: { ts: tsDuration },
      metadata: buildKernelExecutionMetadata({
        operation: "canonicalize_hash",
        executionMode: flags.executionMode,
        usedPrimary: false,
        shadowCompared: false,
        fallbackReason: reason,
      }),
    };
  }
}

export async function proofBundleHashWithFallback(value: unknown): Promise<{
  result: CanonicalizeHashResult;
  mode: "ts" | "rust_primary";
  runnerMode: KernelRunnerMode;
  durationMs: { kernel?: number; ts: number };
  metadata: KernelExecutionMetadata;
}> {
  const flags = readKernelFlags();
  const tsStartedAt = Date.now();
  const ts = tsProofBundleHash(value);
  const tsDuration = Date.now() - tsStartedAt;

  if (!flags.enabled || !flags.canonicalize || flags.executionMode === "disabled") {
    return {
      result: ts,
      mode: "ts",
      runnerMode: "disabled",
      durationMs: { ts: tsDuration },
      metadata: buildKernelExecutionMetadata({
        operation: "proof_bundle_hash",
        executionMode: "disabled",
        usedPrimary: false,
        shadowCompared: false,
        fallbackReason: "kernel_disabled",
      }),
    };
  }

  if (operationExplicitlyDisabled(flags, "proof_bundle_hash")) {
    recordFallback("operation_disabled_env");
    return {
      result: ts,
      mode: "ts",
      runnerMode: "disabled",
      durationMs: { ts: tsDuration },
      metadata: buildKernelExecutionMetadata({
        operation: "proof_bundle_hash",
        executionMode: flags.executionMode,
        usedPrimary: false,
        shadowCompared: false,
        fallbackReason: "operation_disabled_env",
      }),
    };
  }

  if (!shouldUsePrimary(flags, "proof_bundle_hash")) {
    recordFallback("primary_not_allowed");
    return {
      result: ts,
      mode: "ts",
      runnerMode: "fallback-ts",
      durationMs: { ts: tsDuration },
      metadata: buildKernelExecutionMetadata({
        operation: "proof_bundle_hash",
        executionMode: flags.executionMode,
        usedPrimary: false,
        shadowCompared: false,
        fallbackReason: "primary_not_allowed",
      }),
    };
  }

  telemetry.attempted += 1;
  try {
    const rust = await invokeKernelProofBundleHash(value);
    telemetry.success += 1;
    telemetry.primaryMode += 1;
    return {
      result: rust.result,
      mode: "rust_primary",
      runnerMode: rust.runnerMode,
      durationMs: { kernel: rust.durationMs, ts: tsDuration },
      metadata: buildKernelExecutionMetadata({
        operation: "proof_bundle_hash",
        executionMode: flags.executionMode,
        usedPrimary: true,
        shadowCompared: false,
      }),
    };
  } catch (error) {
    const reason = classifyErrorReason(error, "primary_kernel_failed");
    recordFallback(reason);
    return {
      result: ts,
      mode: "ts",
      runnerMode: "fallback-ts",
      durationMs: { ts: tsDuration },
      metadata: buildKernelExecutionMetadata({
        operation: "proof_bundle_hash",
        executionMode: flags.executionMode,
        usedPrimary: false,
        shadowCompared: false,
        fallbackReason: reason,
      }),
    };
  }
}

export async function artifactIdentityHashWithFallback(value: unknown): Promise<{
  result: CanonicalizeHashResult;
  mode: "ts" | "rust_primary";
  runnerMode: KernelRunnerMode;
  durationMs: { kernel?: number; ts: number };
  metadata: KernelExecutionMetadata;
}> {
  const flags = readKernelFlags();
  const tsStartedAt = Date.now();
  const ts = tsArtifactIdentityHash(value);
  const tsDuration = Date.now() - tsStartedAt;

  if (!flags.enabled || !flags.canonicalize || flags.executionMode === "disabled") {
    return {
      result: ts,
      mode: "ts",
      runnerMode: "disabled",
      durationMs: { ts: tsDuration },
      metadata: buildKernelExecutionMetadata({
        operation: "artifact_identity_hash",
        executionMode: "disabled",
        usedPrimary: false,
        shadowCompared: false,
        fallbackReason: "kernel_disabled",
      }),
    };
  }

  if (operationExplicitlyDisabled(flags, "artifact_identity_hash")) {
    recordFallback("operation_disabled_env");
    return {
      result: ts,
      mode: "ts",
      runnerMode: "disabled",
      durationMs: { ts: tsDuration },
      metadata: buildKernelExecutionMetadata({
        operation: "artifact_identity_hash",
        executionMode: flags.executionMode,
        usedPrimary: false,
        shadowCompared: false,
        fallbackReason: "operation_disabled_env",
      }),
    };
  }

  if (!shouldUsePrimary(flags, "artifact_identity_hash")) {
    recordFallback("primary_not_allowed");
    return {
      result: ts,
      mode: "ts",
      runnerMode: "fallback-ts",
      durationMs: { ts: tsDuration },
      metadata: buildKernelExecutionMetadata({
        operation: "artifact_identity_hash",
        executionMode: flags.executionMode,
        usedPrimary: false,
        shadowCompared: false,
        fallbackReason: "primary_not_allowed",
      }),
    };
  }

  telemetry.attempted += 1;
  try {
    const rust = await invokeKernelArtifactIdentityHash(value);
    telemetry.success += 1;
    telemetry.primaryMode += 1;
    return {
      result: rust.result,
      mode: "rust_primary",
      runnerMode: rust.runnerMode,
      durationMs: { kernel: rust.durationMs, ts: tsDuration },
      metadata: buildKernelExecutionMetadata({
        operation: "artifact_identity_hash",
        executionMode: flags.executionMode,
        usedPrimary: true,
        shadowCompared: false,
      }),
    };
  } catch (error) {
    const reason = classifyErrorReason(error, "primary_kernel_failed");
    recordFallback(reason);
    return {
      result: ts,
      mode: "ts",
      runnerMode: "fallback-ts",
      durationMs: { ts: tsDuration },
      metadata: buildKernelExecutionMetadata({
        operation: "artifact_identity_hash",
        executionMode: flags.executionMode,
        usedPrimary: false,
        shadowCompared: false,
        fallbackReason: reason,
      }),
    };
  }
}

export function getKernelTelemetrySnapshot(): KernelTelemetrySnapshot {
  return { ...telemetry };
}

export function resetKernelTelemetry(): void {
  telemetry.attempted = 0;
  telemetry.success = 0;
  telemetry.primaryMode = 0;
  telemetry.shadowCompare = 0;
  telemetry.compareOnly = 0;
  telemetry.fallbackTs = 0;
  telemetry.fallbackByReason = {};
  telemetry.timeout = 0;
  telemetry.malformedOutput = 0;
  telemetry.versionMismatch = 0;
  telemetry.binaryUnavailable = 0;
  telemetry.divergence = 0;
  telemetry.divergenceByOperation = {};
  telemetry.hashMismatch = 0;
  telemetry.healthChecks = 0;
  telemetry.healthCheckFailures = 0;
  handshakeCache.clear();
}
