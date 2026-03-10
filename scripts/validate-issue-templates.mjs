#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ISSUE_TEMPLATE_DIR = path.join(process.cwd(), ".github", "ISSUE_TEMPLATE");

const REQUIRED_FILES = [
  "runtime_error_incident.yml",
  "support_issue.yml",
  "telemetry_regression.yml",
  "operator_control_plane_bug.yml",
];

const REQUIRED_RUNTIME_FIELDS = ["tenant_id", "route_module", "severity", "error_signature"];
const REQUIRED_SUPPORT_FIELDS = ["tenant_id", "category", "description", "triage_snapshot"];
const REQUIRED_SEVERITIES = ["sev0_critical", "sev1_high", "sev2_medium", "sev3_low"];

function assertIncludes(fileName, content, token) {
  if (!content.includes(token)) {
    throw new Error(`${fileName} missing required token: ${token}`);
  }
}

function validateFileExists(fileName) {
  const filePath = path.join(ISSUE_TEMPLATE_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing issue template file: ${fileName}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

function main() {
  for (const file of REQUIRED_FILES) {
    validateFileExists(file);
  }

  const runtimeTemplate = validateFileExists("runtime_error_incident.yml");
  const supportTemplate = validateFileExists("support_issue.yml");

  for (const field of REQUIRED_RUNTIME_FIELDS) {
    assertIncludes("runtime_error_incident.yml", runtimeTemplate, `id: ${field}`);
  }

  for (const severity of REQUIRED_SEVERITIES) {
    assertIncludes("runtime_error_incident.yml", runtimeTemplate, `- ${severity}`);
  }

  for (const field of REQUIRED_SUPPORT_FIELDS) {
    assertIncludes("support_issue.yml", supportTemplate, `id: ${field}`);
  }

  console.log("Issue template contracts validated.");
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
