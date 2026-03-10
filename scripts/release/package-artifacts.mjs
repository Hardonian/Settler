#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { globSync } from "glob";

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, "artifacts", "release");
const npmDir = path.join(outDir, "npm");

const policy = JSON.parse(
  readFileSync(path.join(repoRoot, "release/packaging-policy.json"), "utf8")
);

function run(cmd, opts = {}) {
  execSync(cmd, { cwd: repoRoot, stdio: "inherit", ...opts });
}

function runCapture(cmd) {
  return execSync(cmd, {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  }).trim();
}

function sha256File(filePath) {
  const hash = createHash("sha256");
  hash.update(readFileSync(filePath));
  return hash.digest("hex");
}

function isOssPackage(name) {
  return policy.ossPackageScopes.some((scope) =>
    scope.endsWith("/") ? name.startsWith(scope) : name === scope
  );
}

function listWorkspacePackages() {
  const files = globSync("packages/*/package.json").sort();
  return files.map((file) => {
    const pkg = JSON.parse(readFileSync(path.join(repoRoot, file), "utf8"));
    return { file, dir: path.dirname(file), ...pkg };
  });
}

function evaluateOssBoundary(packages) {
  const map = new Map(packages.map((p) => [p.name, p]));
  const violations = [];
  const excludedPackages = [];

  for (const pkg of packages) {
    if (pkg.private || !isOssPackage(pkg.name)) continue;
    const dependencySets = [
      pkg.dependencies,
      pkg.peerDependencies,
      pkg.optionalDependencies,
    ].filter(Boolean);
    for (const deps of dependencySets) {
      for (const depName of Object.keys(deps)) {
        const internal = map.get(depName);
        if (internal?.private) {
          violations.push(`${pkg.name} depends on private workspace package ${depName}`);
        }
      }
    }

    if (
      violations.some((item) => item.startsWith(`${pkg.name} depends on private workspace package`))
    ) {
      excludedPackages.push(pkg.name);
    }
  }

  return { violations, excludedPackages };
}

function main() {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(npmDir, { recursive: true });

  const version = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8")).version;
  const commit = runCapture("git rev-parse HEAD");
  const lockfileHash = existsSync(path.join(repoRoot, "pnpm-lock.yaml"))
    ? sha256File(path.join(repoRoot, "pnpm-lock.yaml"))
    : null;

  const packages = listWorkspacePackages();
  const boundary = evaluateOssBoundary(packages);

  const published = packages.filter(
    (pkg) => !pkg.private && isOssPackage(pkg.name) && !boundary.excludedPackages.includes(pkg.name)
  );

  if (published.length === 0) {
    throw new Error("No OSS-safe package candidates were found for release artifact packaging.");
  }

  for (const pkg of published) {
    run(`pnpm --filter ${pkg.name} pack --pack-destination ${npmDir}`);
  }

  const tarballs = globSync("*.tgz", { cwd: npmDir }).sort();
  const checksums = tarballs.map((file) => {
    const abs = path.join(npmDir, file);
    return { file: `npm/${file}`, sha256: sha256File(abs), bytes: readFileSync(abs).byteLength };
  });

  writeFileSync(
    path.join(outDir, "checksums.sha256"),
    checksums.map((entry) => `${entry.sha256}  ${entry.file}`).join("\n") + "\n",
    "utf8"
  );

  writeFileSync(
    path.join(outDir, "manifest.json"),
    JSON.stringify(
      {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        version,
        commit,
        lockfileSha256: lockfileHash,
        policy: policy.enterpriseOverlay,
        boundaryViolations: boundary.violations,
        excludedPackages: boundary.excludedPackages,
        artifacts: checksums,
      },
      null,
      2
    ) + "\n",
    "utf8"
  );

  writeFileSync(
    path.join(outDir, "sbom-metadata.json"),
    JSON.stringify(
      {
        schema: "settler.release.sbom-metadata.v1",
        generatedAt: new Date().toISOString(),
        packageManager: runCapture("pnpm --version"),
        nodeVersion: process.version,
        lockfileSha256: lockfileHash,
        workspacePackages: packages.map((pkg) => ({
          name: pkg.name,
          version: pkg.version,
          private: Boolean(pkg.private),
        })),
      },
      null,
      2
    ) + "\n",
    "utf8"
  );

  console.log(`Created ${tarballs.length} distributable package(s) in artifacts/release/npm`);
}

main();
