#!/usr/bin/env tsx
import { readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const middlewarePath = path.join(
  repoRoot,
  "packages",
  "web",
  "src",
  "middleware",
  "security-headers.ts"
);

const content = readFileSync(middlewarePath, "utf8");

const checks = [
  { name: "csp_disallows_unsafe_eval", pass: !content.includes("'unsafe-eval'") },
  { name: "csp_disallows_unsafe_inline", pass: !content.includes("'unsafe-inline'") },
  { name: "has_hsts", pass: content.includes("Strict-Transport-Security") },
  { name: "has_x_content_type_options", pass: content.includes("X-Content-Type-Options") },
  { name: "has_x_frame_options", pass: content.includes("X-Frame-Options") },
  { name: "has_referrer_policy", pass: content.includes("Referrer-Policy") },
  { name: "has_permissions_policy", pass: content.includes("Permissions-Policy") },
];

const failing = checks.filter((check) => !check.pass);

console.log("SECURITY SMOKE REPORT");
console.log("---------------------");
for (const check of checks) {
  console.log(`${check.pass ? "✅" : "❌"} ${check.name}`);
}

if (failing.length > 0) {
  process.exit(1);
}
