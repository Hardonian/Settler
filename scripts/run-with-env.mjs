#!/usr/bin/env node
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const sep = args.indexOf("--");
const control = sep === -1 ? args : args.slice(0, sep);
const command = sep === -1 ? [] : args.slice(sep + 1);
if (!command.length) {
  console.error(
    "Usage: node scripts/run-with-env.mjs [--set KEY=VALUE]* [--unset KEY]* -- <command>"
  );
  process.exit(1);
}

const env = { ...process.env };
for (let i = 0; i < control.length; i++) {
  if (control[i] === "--set") {
    const [k, ...rest] = (control[++i] || "").split("=");
    env[k] = rest.join("=");
  } else if (control[i] === "--unset") {
    delete env[control[++i]];
  }
}

const child = spawn(command[0], command.slice(1), {
  stdio: "inherit",
  env,
  shell: process.platform === "win32",
});
child.on("exit", (code) => process.exit(code ?? 1));
