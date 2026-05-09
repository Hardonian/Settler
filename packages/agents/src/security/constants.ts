import type { SecurityIssue } from "./types";

export const SOURCE_FILE_EXTENSIONS = new Set([
  ".cjs",
  ".cts",
  ".env",
  ".js",
  ".jsx",
  ".mjs",
  ".mts",
  ".sh",
  ".sql",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);

export const SKIPPED_DIRECTORIES = new Set([
  ".git",
  ".next",
  "archive",
  "build",
  "coverage",
  "dist",
  "docs",
  "node_modules",
  "qa-artifacts",
  "test",
  "tests",
  "__tests__",
]);

export const SKIPPED_FILE_SUFFIXES = [".example", ".sample", ".template", ".test", ".spec"];

export const SECRET_PATTERNS: Array<{
  pattern: RegExp;
  reason: string;
  severity: SecurityIssue["severity"];
}> = [
  {
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    reason: "private_key_material",
    severity: "critical",
  },
  {
    pattern: /sk_live_[A-Za-z0-9]{16,}/,
    reason: "stripe_live_key",
    severity: "critical",
  },
  {
    pattern: /gh[pousr]_[A-Za-z0-9_]{20,}/,
    reason: "github_token",
    severity: "high",
  },
  {
    pattern: /AKIA[0-9A-Z]{16}/,
    reason: "aws_access_key",
    severity: "high",
  },
  {
    pattern: /xox[baprs]-[A-Za-z0-9-]{10,}/,
    reason: "slack_token",
    severity: "high",
  },
  {
    pattern: /\b(api[_-]?key|secret|password|token)\b\s*[:=]\s*['"][^'"\n]{8,}['"]/i,
    reason: "inline_secret_assignment",
    severity: "medium",
  },
];
