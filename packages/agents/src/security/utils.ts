import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import type { SecurityCheck, SecurityIssue, SecurityReport, CommandResult } from "./types";
import { SOURCE_FILE_EXTENSIONS, SKIPPED_DIRECTORIES, SKIPPED_FILE_SUFFIXES } from "./constants";

export function defaultCommandRunner(
  command: string,
  args: string[],
  options: { cwd: string; env: NodeJS.ProcessEnv; timeoutMs?: number }
): CommandResult {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env,
    encoding: "utf8",
    timeout: options.timeoutMs ?? 120_000,
  });

  return {
    command,
    args,
    status: result.status ?? (result.error ? 1 : 0),
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    error: result.error instanceof Error ? result.error.message : undefined,
  };
}

export function findRepoRoot(startDir: string): string {
  let current = resolve(startDir);

  while (true) {
    const hasAgents = existsSync(join(current, "packages", "agents"));
    const hasRootPackage = existsSync(join(current, "package.json"));
    const hasAgentsContract = existsSync(join(current, "AGENTS.md"));

    if (hasAgents && hasRootPackage && hasAgentsContract) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      return resolve(startDir);
    }
    current = parent;
  }
}

export function statusFromArtifact(status?: string): SecurityCheck["status"] {
  switch (status) {
    case "PASS":
      return "verified";
    case "PASS_WITH_DEGRADED_EVIDENCE":
    case "UNAVAILABLE":
      return "degraded";
    case "FAIL":
      return "failed";
    default:
      return "degraded";
  }
}

export function summarizeCounts(issues: SecurityIssue[]) {
  return {
    critical: issues.filter((issue) => issue.severity === "critical").length,
    high: issues.filter((issue) => issue.severity === "high").length,
    medium: issues.filter((issue) => issue.severity === "medium").length,
    low: issues.filter((issue) => issue.severity === "low").length,
  };
}

export function buildOverallSummary(
  verdict: SecurityReport["verdict"],
  counts: SecurityReport["summaryCounts"]
) {
  const countSummary = `${counts.critical} critical, ${counts.high} high, ${counts.medium} medium, ${counts.low} low`;

  switch (verdict) {
    case "verified_pass":
      return `Security verification passed with no blocking findings (${countSummary}).`;
    case "verified_degraded":
      return `Security verification completed with degraded evidence or notification coverage (${countSummary}).`;
    case "failed":
      return `Security verification found blocking findings or failed control checks (${countSummary}).`;
    case "not_applicable":
    default:
      return `Security verification had no applicable checks (${countSummary}).`;
  }
}

export function lineLooksExample(line: string): boolean {
  return /\b(example|sample|placeholder|dummy|mock|fake|test)\b/i.test(line);
}

export function shouldScanFile(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/");
  const segments = normalized.split("/");

  if (segments.some((segment) => SKIPPED_DIRECTORIES.has(segment))) {
    return false;
  }

  if (SKIPPED_FILE_SUFFIXES.some((suffix) => normalized.includes(suffix))) {
    return false;
  }

  if (normalized.endsWith(".md") || normalized.endsWith(".json") || normalized.endsWith(".lock")) {
    return false;
  }

  const extension = extname(normalized);
  if (!SOURCE_FILE_EXTENSIONS.has(extension)) {
    return false;
  }

  return true;
}

export function listFilesRecursively(rootDir: string, currentDir = rootDir): string[] {
  const files: string[] = [];
  const entries = readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(currentDir, entry.name);
    const relativePath = relative(rootDir, fullPath);

    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES.has(entry.name)) {
        continue;
      }
      files.push(...listFilesRecursively(rootDir, fullPath));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (!shouldScanFile(relativePath)) {
      continue;
    }

    const stats = statSync(fullPath);
    if (stats.size > 512_000) {
      continue;
    }

    files.push(fullPath);
  }

  return files;
}
