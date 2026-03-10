#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { globSync } from "glob";

const repoRoot = process.cwd();
const semverPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?$/;

function readJson(rel) {
  return JSON.parse(readFileSync(path.join(repoRoot, rel), "utf8"));
}

function writeJson(rel, data) {
  writeFileSync(path.join(repoRoot, rel), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function assertSemver(version) {
  if (!semverPattern.test(version)) {
    throw new Error(`Invalid semantic version: ${version}`);
  }
}

function allWorkspacePackages() {
  return globSync("packages/*/package.json").sort();
}

function syncVersions(targetVersion) {
  assertSemver(targetVersion);

  const touched = [];
  const rootPkg = readJson("package.json");
  if (rootPkg.version !== targetVersion) {
    rootPkg.version = targetVersion;
    writeJson("package.json", rootPkg);
    touched.push("package.json");
  }

  for (const pkgPath of allWorkspacePackages()) {
    const pkg = readJson(pkgPath);
    if (pkg.version !== targetVersion) {
      pkg.version = targetVersion;
      writeJson(pkgPath, pkg);
      touched.push(pkgPath);
    }
  }

  console.log(JSON.stringify({ version: targetVersion, touched }, null, 2));
}

const [command, arg] = process.argv.slice(2);

if (!command || command === "help") {
  console.log("Usage: node scripts/release/version-manager.mjs <sync|bump> <version>");
  process.exit(0);
}

if (command === "sync" || command === "bump") {
  if (!arg) {
    throw new Error(`Missing version for '${command}'`);
  }
  syncVersions(arg);
} else {
  throw new Error(`Unknown command: ${command}`);
}
