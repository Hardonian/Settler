#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const artifactsDir = path.join(repoRoot, "artifacts/release");

function sha256(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

if (!existsSync(path.join(artifactsDir, "manifest.json")))
  fail("Missing artifacts/release/manifest.json");
if (!existsSync(path.join(artifactsDir, "checksums.sha256")))
  fail("Missing artifacts/release/checksums.sha256");

const manifest = JSON.parse(readFileSync(path.join(artifactsDir, "manifest.json"), "utf8"));
const checksumsText = readFileSync(path.join(artifactsDir, "checksums.sha256"), "utf8").trim();
if (!checksumsText) fail("checksums.sha256 is empty");

const lines = checksumsText.split("\n").filter(Boolean);
for (const line of lines) {
  const [expected, rel] = line.split(/\s+/).filter(Boolean);
  const artifactPath = path.join(artifactsDir, rel);
  if (!existsSync(artifactPath)) fail(`Missing artifact listed in checksum file: ${rel}`);
  const actual = sha256(artifactPath);
  if (actual !== expected) fail(`Checksum mismatch for ${rel}`);
}

if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length !== lines.length) {
  fail("Manifest artifact count does not match checksum file entries");
}

console.log(`✅ Verified ${lines.length} release artifact checksums.`);
