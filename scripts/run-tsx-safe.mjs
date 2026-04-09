#!/usr/bin/env node
import { mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const env = { ...process.env };

if (process.platform !== "win32") {
  const tempDir = env.SETTLER_TSX_TMPDIR || "/tmp/settler-tsx";
  mkdirSync(tempDir, { recursive: true });
  env.TMPDIR = tempDir;
  env.TMP = tempDir;
  env.TEMP = tempDir;
}

const tsxCli = require.resolve("tsx/cli");
const result = spawnSync(process.execPath, [tsxCli, ...process.argv.slice(2)], {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
