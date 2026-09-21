#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const defaultRoot = fileURLToPath(new URL("..", import.meta.url));

export const unsupportedClaimPatterns = [
  { label: "simulated beta proof", pattern: /real results from beta customers/i },
  {
    label: "unsupported aggregate accuracy",
    pattern: /\b\d+(?:\.\d+)?%\s+(?:average\s+)?match accuracy\b/i,
  },
  { label: "unsupported freedom-to-operate conclusion", pattern: /freedom to operate confirmed/i },
  { label: "unsupported dependency-license conclusion", pattern: /all permissive licenses/i },
  { label: "unsupported current team-size claim", pattern: /current team size:\s*\d+/i },
  {
    label: "unsupported acquisition valuation",
    pattern: /valuation range:\s*\$[\d,.]+[mk]?\s*[-–]/i,
  },
  {
    label: "unsupported telemetry assertion",
    pattern: /current:\s*\[tracked in (?:mixpanel|stripe|datadog|marketing|internal dashboard)/i,
  },
  {
    label: "unsupported completed SOC 2 claim",
    pattern: /soc 2 (?:type ii )?(?:compliant|certified)/i,
  },
  { label: "unsupported GDPR claim", pattern: /\bgdpr compliant\b/i },
  { label: "unsupported HIPAA claim", pattern: /\bhipaa ready\b/i },
];

export function findUnsupportedClaims(text) {
  return unsupportedClaimPatterns
    .filter(({ pattern }) => pattern.test(text))
    .map(({ label }) => label);
}

function walkMarkdown(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === "archive") continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkMarkdown(path));
    else if ([".md", ".mdx"].includes(extname(entry.name).toLowerCase())) files.push(path);
  }
  return files;
}

export function auditAcquisitionReadiness(root = defaultRoot) {
  const requiredFiles = [
    "INVESTOR-RELATIONS-PRIVATE/README.md",
    "INVESTOR-RELATIONS-PRIVATE/ACQUISITION_READINESS.md",
    "INVESTOR-RELATIONS-PRIVATE/EVIDENCE_REGISTER.md",
    "INVESTOR-RELATIONS-PRIVATE/DILIGENCE_INDEX.md",
    "INVESTOR-RELATIONS-PRIVATE/CUSTOMER_PROOF.md",
    "INVESTOR-RELATIONS-PRIVATE/EXECUTION_PLAN.md",
    "INVESTOR-RELATIONS-PRIVATE/archive/2026-09-21-superseded/README.md",
    "docs/strategy/POSITIONING_TRUTH.md",
  ];
  const violations = [];

  for (const file of requiredFiles) {
    if (!existsSync(resolve(root, file))) violations.push(`${file}: required file is missing`);
  }

  const activeFiles = [
    ...walkMarkdown(resolve(root, "INVESTOR-RELATIONS-PRIVATE")),
    resolve(root, "INVESTOR_OVERVIEW.md"),
    resolve(root, "docs/STAKEHOLDER_READINESS.md"),
    resolve(root, "docs/strategy/POSITIONING_TRUTH.md"),
  ].filter(existsSync);

  for (const file of activeFiles) {
    const content = readFileSync(file, "utf8");
    for (const claim of findUnsupportedClaims(content)) {
      violations.push(`${relative(root, file)}: ${claim}`);
    }
  }

  const mandatoryBoundaries = [
    ["INVESTOR-RELATIONS-PRIVATE/ACQUISITION_READINESS.md", "Not an acquisition target today"],
    ["INVESTOR-RELATIONS-PRIVATE/EVIDENCE_REGISTER.md", "missing_external"],
    ["INVESTOR-RELATIONS-PRIVATE/CUSTOMER_PROOF.md", "Missing external evidence"],
    ["docs/strategy/POSITIONING_TRUTH.md", "Claims disallowed until evidenced"],
  ];

  for (const [file, boundary] of mandatoryBoundaries) {
    const path = resolve(root, file);
    if (existsSync(path) && !readFileSync(path, "utf8").includes(boundary)) {
      violations.push(`${file}: required boundary is missing: ${boundary}`);
    }
  }

  return { activeFileCount: activeFiles.length, violations };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = auditAcquisitionReadiness();
  if (result.violations.length > 0) {
    console.error("❌ Acquisition-readiness truth check failed");
    for (const violation of result.violations) console.error(` - ${violation}`);
    process.exit(1);
  }

  console.log(
    `✅ Acquisition-readiness truth check passed (${result.activeFileCount} active evidence surfaces)`
  );
}
