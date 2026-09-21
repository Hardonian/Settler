#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const defaultRoot = fileURLToPath(new URL("..", import.meta.url));

export const unsupportedSecurityClaimPatterns = [
  { label: "absolute cross-tenant claim", pattern: /no cross-tenant (?:data )?access\b/i },
  { label: "absolute cross-tenant claim", pattern: /no cross-tenant queries (?:are )?possible/i },
  {
    label: "absolute cross-tenant claim",
    pattern: /cross-tenant (?:data )?access is mechanically prevented/i,
  },
  { label: "absolute tenant-isolation claim", pattern: /complete tenant isolation/i },
  {
    label: "unsupported deployment-wide RLS claim",
    pattern: /all queries are (?:automatically )?filtered by [`*]?tenant_id/i,
  },
  { label: "unsupported GDPR conclusion", pattern: /\bgdpr compliant\b/i },
  { label: "unsupported CCPA conclusion", pattern: /\bccpa compliant\b/i },
  { label: "unsupported HIPAA conclusion", pattern: /\bhipaa ready\b/i },
  {
    label: "unsupported certification conclusion",
    pattern: /\b(?:soc 2|iso 27001|pci(?: dss)?)\b[^\n]{0,24}\b(?:certified|compliant)\b/i,
  },
  { label: "unsupported production-readiness conclusion", pattern: /\bproduction-ready\b/i },
  { label: "unsupported SLA claim", pattern: /\bsla-backed\b/i },
  { label: "unsupported availability commitment", pattern: /\b99\.9% uptime\b/i },
];

export function findUnsupportedSecurityClaims(text) {
  return unsupportedSecurityClaimPatterns
    .filter(({ pattern }) => pattern.test(text))
    .map(({ label }) => label);
}

function walkMarkdown(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkMarkdown(path));
    else if ([".md", ".mdx"].includes(extname(entry.name).toLowerCase())) files.push(path);
  }
  return files;
}

export function auditSecurityClaims(root = defaultRoot) {
  const requiredFiles = [
    "docs/DUE_DILIGENCE.md",
    "docs/TECHNICAL_DUE_DILIGENCE.md",
    "docs/SYSTEM_GUARANTEES.md",
    "docs/TENANT_ISOLATION_VERIFICATION.md",
    "docs/PROCUREMENT_FAQ.md",
    "docs/trust-packet.md",
    "docs/CANONICAL_PRODUCT_NARRATIVE.md",
  ];
  const selectedFiles = [
    ...requiredFiles,
    "docs/ACCESS_CONTROLS.md",
    "docs/CATEGORY_POSITIONING.md",
    "docs/COMPETITIVE_BOUNDARIES.md",
    "docs/compliance/COMPLIANCE_DOCUMENTATION.md",
    "docs/DATA_MODEL.md",
    "docs/EXECUTIVE_SUMMARY.md",
    "docs/positioning/CLAIM_VALIDATION.md",
    "docs/INVESTOR_NARRATIVE.md",
    "INVESTOR_OVERVIEW.md",
  ].map((file) => resolve(root, file));
  selectedFiles.push(...walkMarkdown(resolve(root, "docs/dd")));
  selectedFiles.push(...walkMarkdown(resolve(root, "docs/investor")));

  const violations = [];
  for (const file of requiredFiles) {
    if (!existsSync(resolve(root, file))) violations.push(`${file}: required file is missing`);
  }

  for (const file of [...new Set(selectedFiles)].filter(existsSync)) {
    const content = readFileSync(file, "utf8");
    for (const claim of findUnsupportedSecurityClaims(content)) {
      violations.push(`${relative(root, file)}: ${claim}`);
    }
  }

  const tenantBoundary = readFileSync(
    resolve(root, "docs/TENANT_ISOLATION_VERIFICATION.md"),
    "utf8"
  );
  if (!tenantBoundary.includes("live database evidence pending")) {
    violations.push(
      "docs/TENANT_ISOLATION_VERIFICATION.md: live database evidence boundary is missing"
    );
  }

  return { selectedFileCount: new Set(selectedFiles.filter(existsSync)).size, violations };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = auditSecurityClaims();
  if (result.violations.length > 0) {
    console.error("❌ Security-claim truth check failed");
    for (const violation of result.violations) console.error(` - ${violation}`);
    process.exit(1);
  }

  console.log(
    `✅ Security-claim truth check passed (${result.selectedFileCount} buyer-facing surfaces)`
  );
}
