import { spawn } from "node:child_process";
import { createHash } from "node:crypto";

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
}

interface KernelEnvelope {
  ok: boolean;
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

export function readKernelFlags(env: NodeJS.ProcessEnv = process.env): KernelFlags {
  return {
    enabled: env.SETTLER_KERNEL_ENABLED === "1",
    canonicalize: env.SETTLER_KERNEL_CANONICALIZE === "1",
    shadowMode: env.SETTLER_KERNEL_SHADOW_MODE === "1",
  };
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

function kernelCommand(): { cmd: string; args: string[] } {
  if (process.env.SETTLER_KERNEL_BIN) {
    return { cmd: process.env.SETTLER_KERNEL_BIN, args: [] };
  }
  return {
    cmd: "cargo",
    args: ["run", "--quiet", "-p", "settler-kernel-cli"],
  };
}

export async function invokeKernelCanonicalizeHash(
  value: unknown,
  timeoutMs = 5000
): Promise<CanonicalizeHashResult> {
  const req = JSON.stringify({ operation: "canonicalize_hash", payload: value });
  const { cmd, args } = kernelCommand();

  return await new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["pipe", "pipe", "pipe"] });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("KERNEL_TIMEOUT"));
    }, timeoutMs);

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      let parsed: KernelEnvelope;
      try {
        parsed = JSON.parse(stdout.trim());
      } catch {
        reject(new Error(`KERNEL_MALFORMED_OUTPUT:${code ?? "unknown"}:${stderr.slice(0, 120)}`));
        return;
      }

      if (!parsed.ok || !parsed.result) {
        reject(new Error(parsed.error?.code ?? "KERNEL_FAILED"));
        return;
      }

      resolve({
        schemaVersion: parsed.result.schema_version,
        canonicalJson: parsed.result.canonical_json,
        inputHash: parsed.result.input_hash,
        normalizedHash: parsed.result.normalized_hash,
        ruleHash: parsed.result.rule_hash,
      });
    });

    child.stdin.write(req);
    child.stdin.end();
  });
}

export async function canonicalizeHashWithFallback(value: unknown): Promise<{
  result: CanonicalizeHashResult;
  mode: "ts" | "rust_primary" | "ts_with_shadow";
  divergence?: { normalizedHashMatch: boolean };
}> {
  const flags = readKernelFlags();
  const ts = tsCanonicalizeHash(value);

  if (!flags.enabled || !flags.canonicalize) {
    return { result: ts, mode: "ts" };
  }

  if (flags.shadowMode) {
    try {
      const rust = await invokeKernelCanonicalizeHash(value);
      return {
        result: ts,
        mode: "ts_with_shadow",
        divergence: { normalizedHashMatch: rust.normalizedHash === ts.normalizedHash },
      };
    } catch {
      return { result: ts, mode: "ts_with_shadow", divergence: { normalizedHashMatch: false } };
    }
  }

  try {
    const rust = await invokeKernelCanonicalizeHash(value);
    return { result: rust, mode: "rust_primary" };
  } catch {
    return { result: ts, mode: "ts" };
  }
}
