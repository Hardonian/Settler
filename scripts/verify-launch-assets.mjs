#!/usr/bin/env node
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const manifestPath = path.join(repoRoot, "launch", "assets-manifest.json");

async function fileHash(absolutePath) {
  const content = await fs.readFile(absolutePath);
  return createHash("sha256").update(content).digest("hex");
}

async function main() {
  const manifestRaw = await fs.readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestRaw);

  if (!Array.isArray(manifest.assets) || manifest.assets.length === 0) {
    throw new Error("launch/assets-manifest.json must contain a non-empty assets array");
  }

  const failures = [];

  for (const asset of manifest.assets) {
    const relativePath = asset.path;
    const absolutePath = path.join(repoRoot, relativePath);

    try {
      const stats = await fs.stat(absolutePath);
      if (!stats.isFile()) {
        failures.push(`${relativePath}: not a file`);
        continue;
      }
      if (stats.size <= 0) {
        failures.push(`${relativePath}: file is empty`);
      }

      const hash = await fileHash(absolutePath);
      if (asset.sha256 !== hash) {
        failures.push(`${relativePath}: sha256 mismatch (expected ${asset.sha256}, got ${hash})`);
      }
    } catch (error) {
      failures.push(`${relativePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (failures.length > 0) {
    console.error("Launch asset verification failed:");
    for (const failure of failures) {
      console.error(` - ${failure}`);
    }
    process.exit(1);
  }

  console.log(`Verified ${manifest.assets.length} launch assets from launch/assets-manifest.json`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
