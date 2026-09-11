#!/usr/bin/env node
import { createRequire } from "node:module";
import { existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const cwd = process.cwd();
const require = createRequire(import.meta.url);

function removeIfPresent(path) {
  try {
    if (existsSync(path)) {
      rmSync(path, { force: true, recursive: true });
    }
  } catch (err) {
    // Ignore concurrent deletion errors
  }
}

// Cross-filesystem copies can leave incremental state that suppresses fresh declaration emit.
for (const entry of readdirSync(cwd)) {
  if (entry.endsWith(".tsbuildinfo")) {
    removeIfPresent(join(cwd, entry));
  }
}

const distDir = join(cwd, "dist");
if (existsSync(distDir)) {
  for (const entry of readdirSync(distDir)) {
    if (entry.endsWith(".tsbuildinfo")) {
      removeIfPresent(join(distDir, entry));
    }
  }
}

const tscBin = require.resolve("typescript/bin/tsc");
const tscArgs = ["--ignoreDeprecations", "6.0", ...process.argv.slice(2)];
const result = spawnSync(process.execPath, [tscBin, ...tscArgs], {
  cwd,
  env: process.env,
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
