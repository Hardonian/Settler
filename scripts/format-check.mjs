#!/usr/bin/env node
import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const prettierBin = path.join(repoRoot, "node_modules", "prettier", "bin", "prettier.cjs");
const supportedExtension = /\.(?:ts|tsx|js|jsx|mjs|cjs|json|md)$/i;
const checkAll = process.argv.includes("--all");

function git(args) {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args.join(" ")} failed`);
  }
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

const candidates = new Set(
  checkAll
    ? git(["ls-files"])
    : [
        ...git(["show", "--format=", "--name-only", "HEAD"]),
        ...git(["diff", "--name-only", "--diff-filter=ACMR", "HEAD"]),
      ]
);

const files = [...candidates]
  .filter((file) => supportedExtension.test(file))
  .filter((file) => existsSync(path.join(repoRoot, file)))
  .sort();

if (files.length === 0) {
  console.log("Formatting check skipped: no changed supported files.");
  process.exit(0);
}

console.log(`Checking formatting for ${files.length} changed file(s)...`);
for (let index = 0; index < files.length; index += 50) {
  const batch = files.slice(index, index + 50);
  const result = spawnSync(process.execPath, [prettierBin, "--check", ...batch], {
    cwd: repoRoot,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("Formatting check passed.");
