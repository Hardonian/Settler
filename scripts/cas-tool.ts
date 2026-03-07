#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import { sha256 } from "../evidence/hash";

interface CasManifestEntry {
  hash: string;
  file: string;
  size: number;
  last_verified_at?: string;
}

interface CasManifest {
  entries: CasManifestEntry[];
}

const casRoot = path.resolve(process.argv[3] ?? ".settler/cas");
const manifestPath = path.join(casRoot, "manifest.json");

async function loadManifest(): Promise<CasManifest> {
  try {
    const raw = await fs.readFile(manifestPath, "utf8");
    return JSON.parse(raw) as CasManifest;
  } catch {
    return { entries: [] };
  }
}

async function saveManifest(manifest: CasManifest): Promise<void> {
  await fs.mkdir(casRoot, { recursive: true });
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
}

async function verifyCas(): Promise<void> {
  const manifest = await loadManifest();
  const failures: string[] = [];

  for (const entry of manifest.entries) {
    const artifactPath = path.join(casRoot, entry.file);
    try {
      const content = await fs.readFile(artifactPath);
      const hash = sha256(content.toString("utf8"));
      if (hash !== entry.hash) {
        failures.push(`${entry.file}: expected=${entry.hash} actual=${hash}`);
      }
    } catch (error) {
      failures.push(`${entry.file}: missing (${error instanceof Error ? error.message : error})`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`CAS verify failed:\n${failures.join("\n")}`);
  }

  const now = new Date().toISOString();
  manifest.entries = manifest.entries.map((entry) => ({ ...entry, last_verified_at: now }));
  await saveManifest(manifest);
  console.log(`✅ CAS verification passed (${manifest.entries.length} entries)`);
}

async function gcCas(): Promise<void> {
  const manifest = await loadManifest();
  const expected = new Set(manifest.entries.map((entry) => entry.file));
  await fs.mkdir(casRoot, { recursive: true });
  const files = await fs.readdir(casRoot);

  let removed = 0;
  for (const file of files) {
    if (file === "manifest.json") continue;
    if (!expected.has(file)) {
      await fs.rm(path.join(casRoot, file), { force: true });
      removed += 1;
    }
  }

  console.log(`✅ CAS gc complete (removed=${removed})`);
}

async function repairCas(): Promise<void> {
  const manifest = await loadManifest();
  let repaired = 0;

  for (const entry of manifest.entries) {
    const artifactPath = path.join(casRoot, entry.file);
    try {
      const content = await fs.readFile(artifactPath, "utf8");
      const hash = sha256(content);
      if (hash !== entry.hash) {
        const repairedName = `${entry.hash}.repaired`;
        await fs.writeFile(path.join(casRoot, repairedName), content, "utf8");
        entry.file = repairedName;
        repaired += 1;
      }
    } catch {
      // remove missing entries from manifest to keep CAS reference-safe
      manifest.entries = manifest.entries.filter((candidate) => candidate !== entry);
      repaired += 1;
    }
  }

  await saveManifest(manifest);
  console.log(`✅ CAS repair complete (updated=${repaired})`);
}

async function main() {
  const command = process.argv[2] ?? "verify";

  if (command === "verify") return verifyCas();
  if (command === "gc") return gcCas();
  if (command === "repair") return repairCas();

  throw new Error(`Unknown command: ${command}. Use verify|gc|repair`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
