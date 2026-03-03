#!/usr/bin/env node
import { readFileSync } from "node:fs";

const file = "packages/web/src/lib/api/v1/recon/core.ts";
const content = readFileSync(file, "utf8");
const checks = [
  "x-request-id",
  "strict-transport-security",
  "SETTLER_RATE_LIMITED",
  "SETTLER_AUTH_REQUIRED",
];
for (const token of checks) {
  if (!content.includes(token)) {
    console.error(`Missing security enforcement token: ${token}`);
    process.exit(1);
  }
}
console.log("✅ Security middleware checks passed.");
