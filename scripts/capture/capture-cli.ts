#!/usr/bin/env tsx
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("docs/assets/screenshots", { recursive: true });

const output = execSync("pnpm run demo", { encoding: "utf8" });
writeFileSync("docs/assets/screenshots/cli-demo-output.txt", output);
console.log("Wrote docs/assets/screenshots/cli-demo-output.txt");
