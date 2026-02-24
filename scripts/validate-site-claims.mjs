#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { globSync } from "glob";

const mode = process.env.SITE_MODE === "enterprise" ? "enterprise" : "oss";
const root = process.cwd();
const rules = JSON.parse(fs.readFileSync(path.join(root, "config/site-claims-rules.json"), "utf8"));
const files = globSync("packages/web/src/app/**/*.{ts,tsx,md,mdx}", { nodir: true }).filter(
  (file) =>
    !file.includes("/app/api/") &&
    !file.includes("/app/console/") &&
    !file.includes("/app/admin/") &&
    !file.includes("/app/app/")
);
const violations = [];

const isAllowlisted = (file) =>
  (rules.allowlists.internalTerms || []).some((prefix) => file.startsWith(prefix));

for (const file of files) {
  const content = fs.readFileSync(path.join(root, file), "utf8");
  const lines = content.split("\n");

  (rules.forbiddenTermsByMode[mode] || []).forEach((term) => {
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes(term.toLowerCase()) && !file.includes("/legal/")) {
        violations.push(`${file}:${idx + 1} forbidden term for ${mode}: "${term}"`);
      }
    });
  });

  if (mode === "enterprise" && file.includes("/enterprise/")) {
    ["coming soon", "planned", "unreleased"].forEach((claim) => {
      lines.forEach((line, idx) => {
        if (
          line.toLowerCase().includes(claim) &&
          !rules.requiredLabelsForEnterpriseClaims.some((label) => line.includes(label))
        ) {
          violations.push(
            `${file}:${idx + 1} enterprise unshipped claim "${claim}" requires one of [${rules.requiredLabelsForEnterpriseClaims.join(", ")}]`
          );
        }
      });
    });
  }

  if (!isAllowlisted(file)) {
    (rules.internalTerms || []).forEach((term) => {
      lines.forEach((line, idx) => {
        if (line.includes(term)) {
          violations.push(
            `${file}:${idx + 1} internal term leaked to marketing surface: "${term}"`
          );
        }
      });
    });
  }
}

if (violations.length) {
  console.error("❌ Site claims validation failed");
  violations.forEach((v) => console.error(` - ${v}`));
  process.exit(1);
}

console.log(`✅ Site claims validation passed for mode=${mode}`);
