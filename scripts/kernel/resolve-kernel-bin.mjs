#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const candidates = [
  process.env.SETTLER_KERNEL_BIN,
  path.join(cwd, "target", "release", "settler-kernel-cli"),
  path.join(cwd, "target", "debug", "settler-kernel-cli"),
].filter(Boolean);

const found = candidates.find((candidate) => fs.existsSync(candidate));

if (!found) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        code: "KERNEL_BINARY_NOT_FOUND",
        checked: candidates,
      },
      null,
      2
    )
  );
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      path: found,
      source: process.env.SETTLER_KERNEL_BIN ? "SETTLER_KERNEL_BIN" : "default_target_path",
    },
    null,
    2
  )
);
