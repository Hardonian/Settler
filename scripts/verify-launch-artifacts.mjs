#!/usr/bin/env node
import { readFileSync, statSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

function parseArgs(argv) {
  const manifestArg = argv.find((value) => value.startsWith("--manifest="));
  return {
    manifest: manifestArg
      ? manifestArg.split("=")[1]
      : path.join("artifacts", "launch", "latest.json"),
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifestPath = path.join(repoRoot, args.manifest);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

  if (!manifest.success) {
    throw new Error(`Capture manifest indicates failure: ${args.manifest}`);
  }

  if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length === 0) {
    throw new Error(`Capture manifest has no artifacts: ${args.manifest}`);
  }

  const failures = [];
  for (const artifact of manifest.artifacts) {
    if (!artifact.path) {
      failures.push("artifact entry missing path");
      continue;
    }

    const absolutePath = path.join(repoRoot, artifact.path);
    try {
      const stats = statSync(absolutePath);
      if (!stats.isFile()) {
        failures.push(`${artifact.path}: not a file`);
      } else if (stats.size <= 0) {
        failures.push(`${artifact.path}: file is empty`);
      }
    } catch (error) {
      failures.push(`${artifact.path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (!manifest.origin) {
    failures.push(
      "manifest.origin missing (must indicate primary-playwright or fallback-launch-manifest)"
    );
  }

  if (manifest.mode === "fallback" && !manifest.primaryFailure) {
    failures.push("fallback mode must include primaryFailure diagnostics");
  }

  if (failures.length) {
    console.error("Launch artifact verification failed:");
    for (const failure of failures) {
      console.error(` - ${failure}`);
    }
    process.exit(1);
  }

  console.log(`Verified ${manifest.artifacts.length} launch artifacts via ${args.manifest}`);
  console.log(`Capture origin: ${manifest.origin}`);
  if (manifest.primaryFailure) {
    console.log(`Primary capture failure reason: ${manifest.primaryFailure}`);
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
