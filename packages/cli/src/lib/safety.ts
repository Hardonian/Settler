import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

export const MAX_JSON_BYTES = 5 * 1024 * 1024;
export const MAX_VERIFICATION_JSON_BYTES = MAX_JSON_BYTES;
export const MAX_REGISTRY_BYTES = 512 * 1024;
export const MAX_RUN_FILES = 500;

const SAFE_PACKAGE_NAME = /^[a-z0-9._-]+$/i;

export type RegistryEntry = {
  name: string;
  version: string;
  license: string;
  compatibility: string;
  provenance?: string;
};

export function assertSafePackageName(name: string): void {
  if (!SAFE_PACKAGE_NAME.test(name)) {
    throw new Error(`invalid package name: ${name}`);
  }
}

export function isAllowedProvenance(url: string): boolean {
  return /^(https|git\+https):\/\/[a-z0-9.-]+\//i.test(url);
}

export function validateRegistryEntries(
  kind: "adapters" | "rules",
  payload: unknown
): RegistryEntry[] {
  if (!Array.isArray(payload)) {
    throw new Error(`${kind} registry must be an array`);
  }

  return payload.map((item) => {
    if (!item || typeof item !== "object") {
      throw new Error(`${kind} registry item must be an object`);
    }

    const candidate = item as Partial<RegistryEntry>;
    if (!candidate.name || !candidate.version || !candidate.license || !candidate.compatibility) {
      throw new Error(`${kind} registry item missing required fields`);
    }

    assertSafePackageName(candidate.name);
    if (candidate.provenance && !isAllowedProvenance(candidate.provenance)) {
      throw new Error(`invalid provenance URL for ${candidate.name}: ${candidate.provenance}`);
    }

    return {
      name: candidate.name,
      version: candidate.version,
      license: candidate.license,
      compatibility: candidate.compatibility,
      ...(candidate.provenance ? { provenance: candidate.provenance } : {}),
    };
  });
}

export function resolveWithinCwd(file: string): string {
  const resolved = path.resolve(process.cwd(), file);
  const rel = path.relative(process.cwd(), resolved);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error("path escapes repository root");
  }
  return resolved;
}

export async function readLimitedUtf8(file: string, maxBytes: number): Promise<string> {
  const resolved = resolveWithinCwd(file);
  const stat = await fsp.stat(resolved);
  if (stat.size > maxBytes) {
    throw new Error(`file exceeds max size (${maxBytes} bytes): ${resolved}`);
  }

  return fsp.readFile(resolved, "utf8");
}

export function readLimitedJsonSync(filePath: string, label: string, maxBytes: number): unknown {
  const resolved = resolveWithinCwd(filePath);
  const stat = fs.statSync(resolved);
  if (stat.size > maxBytes) {
    throw new Error(`${label} exceeds max size (${maxBytes} bytes)`);
  }

  const raw = fs.readFileSync(resolved, "utf8");
  return JSON.parse(raw);
}

export function requireUnsafeAcknowledgement(ack: boolean | undefined): void {
  if (!ack) {
    throw new Error("unsafe acknowledgement required: re-run with --allow-unsafe");
  }
}
