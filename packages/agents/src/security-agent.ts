/**
 * Security Agent - repo-native security verification runner.
 *
 * Supported behavior:
 * - dependency evidence orchestration via repo security scripts
 * - inline secret heuristics over non-allowlisted source files
 * - tenant/RLS verification orchestration via repo security scripts
 *
 * Explicit boundaries:
 * - does not claim SOC 2 / ISO / pen-test proof
 * - does not fabricate green status when evidence capture degrades
 */

import {
  SOURCE_FILE_EXTENSIONS,
  SKIPPED_DIRECTORIES,
  SKIPPED_FILE_SUFFIXES,
  SECRET_PATTERNS,
} from "./security/constants";
import {
  defaultCommandRunner,
  findRepoRoot,
  statusFromArtifact,
  summarizeCounts,
  buildOverallSummary,
  lineLooksExample,
  shouldScanFile,
  listFilesRecursively,
} from "./security/utils";
export type {
  SecurityScanType,
  SecurityConfig,
  SecurityIssue,
  SecurityCheck,
  SecurityReport,
} from "./security/types";
import type {
  SecurityScanType,
  SecurityConfig,
  SecurityIssue,
  SecurityCheck,
  SecurityReport,
  CommandResult,
  CommandRunner,
  SecurityAgentDependencies,
  DependencyEvidenceArtifact,
  RlsEvidenceArtifact,
  CrossTenantArtifact,
  CheckExecution,
} from "./security/types";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
const log = console;
import {
  deriveVerdict,
  exitCodeForVerdict,
  printAgentReport,
  type AgentCheck,
  type AgentReport,
} from "./agent-contract";

export class SecurityAgent {
  private readonly config: Required<Pick<SecurityConfig, "repoRoot">> & SecurityConfig;
  private readonly fetchImpl: typeof fetch;
  private readonly runCommand: CommandRunner;

  constructor(config: SecurityConfig = {}, dependencies: SecurityAgentDependencies = {}) {
    const repoRoot = config.repoRoot ? resolve(config.repoRoot) : findRepoRoot(process.cwd());

    this.config = {
      ...config,
      repoRoot,
    };
    this.fetchImpl = dependencies.fetchImpl ?? fetch;
    this.runCommand = dependencies.runCommand ?? defaultCommandRunner;
  }

  async scan(type: SecurityScanType): Promise<SecurityReport> {
    log.info(`Starting ${type} security scan`, { repoRoot: this.config.repoRoot });

    const checks: SecurityCheck[] = [];
    const issues: SecurityIssue[] = [];

    if (type === "all" || type === "vulnerabilities") {
      const result = this.runDependencyEvidenceCheck();
      checks.push(result.check);
      issues.push(...result.issues);
    }

    if (type === "all" || type === "secrets") {
      const result = this.runSecretScan();
      checks.push(result.check);
      issues.push(...result.issues);
    }

    if (type === "all" || type === "rls") {
      const result = this.runRlsCheck();
      checks.push(result.check);
      issues.push(...result.issues);
    }

    if (type === "all" || type === "compliance") {
      const result = this.runComplianceBoundaryCheck();
      checks.push(result.check);
      issues.push(...result.issues);
    }

    const baseVerdict = deriveVerdict(checks);
    const summaryCounts = summarizeCounts(issues);
    const notification = await this.maybeSendNotification(summaryCounts, issues);
    checks.push(notification);

    const verdict = deriveVerdict(checks);
    const report: SecurityReport = {
      agent: "security-agent",
      verdict,
      summary: buildOverallSummary(verdict, summaryCounts),
      timestamp: new Date().toISOString(),
      scanType: type,
      scanTime: new Date().toISOString(),
      repoRoot: this.config.repoRoot,
      issues,
      summaryCounts,
      checks,
      claimBoundary:
        "This agent aggregates repo-native dependency, tenant, and secret-evidence checks. It does not prove third-party penetration testing, infrastructure posture outside this repository, or compliance certification.",
      metadata: {
        baseVerdictBeforeNotification: baseVerdict,
      },
    };

    this.writeReportIfRequested(report);
    log.info(`Security scan complete`, { verdict: report.verdict, issues: issues.length });

    return report;
  }

  private runDependencyEvidenceCheck(): CheckExecution {
    const env = {
      ...process.env,
      SECURITY_AUDIT_MODE:
        this.config.securityAuditMode ?? process.env.SECURITY_AUDIT_MODE ?? "warn",
      SECURITY_DEPENDENCY_EVIDENCE_MODE:
        this.config.dependencyEvidenceMode ??
        process.env.SECURITY_DEPENDENCY_EVIDENCE_MODE ??
        "standard",
      GITHUB_TOKEN: this.config.githubToken ?? process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN,
      GH_TOKEN: this.config.githubToken ?? process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN,
      GITHUB_REPOSITORY:
        this.config.githubRepository ?? process.env.GITHUB_REPOSITORY ?? process.env.GH_REPO,
      DEPENDABOT_ALERTS_EXPORT_PATH:
        this.config.dependabotAlertsExportPath ?? process.env.DEPENDABOT_ALERTS_EXPORT_PATH,
    };

    const auditRun = this.runNodeScript(["scripts/audit-deps.mjs"], env, 120_000);
    const evidenceRun = this.runNodeScript(
      ["scripts/security/dependency-evidence.mjs"],
      env,
      120_000
    );
    const artifact = this.readJsonArtifact<DependencyEvidenceArtifact>(
      "artifacts/security/dependency-evidence-latest.json"
    );

    if (!artifact) {
      return {
        check: {
          name: "vulnerabilities",
          status: "failed",
          reason: "dependency_evidence_artifact_missing",
          summary: "Dependency evidence artifact was not produced.",
          verificationPath: [
            "node scripts/audit-deps.mjs",
            "node scripts/security/dependency-evidence.mjs",
          ],
          details: {
            auditStatus: auditRun.status,
            evidenceStatus: evidenceRun.status,
          },
        },
        issues: [
          {
            type: "vulnerability",
            severity: "high",
            message:
              "Dependency evidence artifact missing after vulnerability verification commands.",
            source: "dependency-evidence",
          },
        ],
      };
    }

    const checkStatus = statusFromArtifact(artifact.status);
    const summary =
      artifact.reason ||
      "Dependency audit and advisory evidence completed without a machine-readable summary.";
    const summaryCounts = artifact.localAudit?.summary ?? {};
    const issues: SecurityIssue[] = [];

    if ((summaryCounts.critical ?? 0) > 0) {
      issues.push({
        type: "vulnerability",
        severity: "critical",
        message: `${summaryCounts.critical} critical dependency vulnerabilities reported by local audit evidence.`,
        source: "dependency-evidence",
      });
    }

    if ((summaryCounts.high ?? 0) > 0) {
      issues.push({
        type: "vulnerability",
        severity: "high",
        message: `${summaryCounts.high} high dependency vulnerabilities reported by local audit evidence.`,
        source: "dependency-evidence",
      });
    }

    if (issues.length === 0 && checkStatus === "failed") {
      issues.push({
        type: "vulnerability",
        severity: "high",
        message: summary,
        source: "dependency-evidence",
      });
    }

    return {
      check: {
        name: "vulnerabilities",
        status: checkStatus,
        summary,
        reason: artifact.evidenceState?.toLowerCase(),
        verificationPath: [
          "node scripts/audit-deps.mjs",
          "node scripts/security/dependency-evidence.mjs",
        ],
        details: {
          auditStatus: auditRun.status,
          evidenceStatus: evidenceRun.status,
          artifactStatus: artifact.status,
          evidenceCompleteness: artifact.evidenceCompleteness,
          advisoryStatus: artifact.advisoryCompleteness?.status,
          environmentConstraints: artifact.environmentConstraints,
          nextOperatorAction: artifact.nextOperatorAction,
        },
      },
      issues,
    };
  }

  private runSecretScan(): CheckExecution {
    const issues: SecurityIssue[] = [];
    const scannedFiles = listFilesRecursively(this.config.repoRoot);

    for (const filePath of scannedFiles) {
      const relativePath = relative(this.config.repoRoot, filePath);
      const content = readFileSync(filePath, "utf8");
      const lines = content.split(/\r?\n/);

      lines.forEach((line, index) => {
        if (lineLooksExample(line)) {
          return;
        }

        for (const secretPattern of SECRET_PATTERNS) {
          if (!secretPattern.pattern.test(line)) {
            continue;
          }

          issues.push({
            type: "secret",
            severity: secretPattern.severity,
            message: `Potential ${secretPattern.reason} detected in source.`,
            file: relativePath.replace(/\\/g, "/"),
            line: index + 1,
            source: "inline-secret-scan",
          });
          break;
        }
      });
    }

    return {
      check: {
        name: "secrets",
        status: issues.length > 0 ? "failed" : "verified",
        reason: issues.length > 0 ? "inline_secret_detected" : undefined,
        summary:
          issues.length > 0
            ? `${issues.length} potential inline secret leaks detected in scanned source files.`
            : `No inline secret patterns detected across ${scannedFiles.length} scanned source files.`,
        details: {
          scannedFiles: scannedFiles.length,
          repoRoot: this.config.repoRoot,
        },
      },
      issues,
    };
  }

  private runRlsCheck(): CheckExecution {
    const env = {
      ...process.env,
      SECURITY_RLS_EVIDENCE_MODE:
        this.config.rlsEvidenceMode ?? process.env.SECURITY_RLS_EVIDENCE_MODE ?? "static-only",
    };

    const routeRegistry = this.runPnpm(["run", "security:routes"], env, 120_000);
    const tenantCoverage = this.runPnpm(["run", "verify:tenant"], env, 120_000);
    const crossTenant = this.runPnpm(["run", "test:cross-tenant"], env, 180_000);
    const rlsBoundary = this.runNodeScript(
      ["scripts/security/verify-rls-boundary.mjs"],
      env,
      120_000
    );
    const rlsEvidence = this.runNodeScript(["scripts/security/rls-evidence.mjs"], env, 120_000);

    const artifact = this.readJsonArtifact<RlsEvidenceArtifact>(
      "artifacts/security/rls-evidence-latest.json"
    );
    const crossTenantArtifact = this.readJsonArtifact<CrossTenantArtifact>(
      "artifacts/security/cross-tenant-results-latest.json"
    );

    if (!artifact) {
      return {
        check: {
          name: "rls",
          status: "failed",
          reason: "rls_evidence_artifact_missing",
          summary: "RLS evidence artifact was not produced.",
          verificationPath: [
            "pnpm run security:routes",
            "pnpm run verify:tenant",
            "pnpm run test:cross-tenant",
            "node scripts/security/verify-rls-boundary.mjs",
            "node scripts/security/rls-evidence.mjs",
          ],
          details: {
            routeRegistryStatus: routeRegistry.status,
            tenantCoverageStatus: tenantCoverage.status,
            crossTenantStatus: crossTenant.status,
            rlsBoundaryStatus: rlsBoundary.status,
            rlsEvidenceStatus: rlsEvidence.status,
          },
        },
        issues: [
          {
            type: "rls",
            severity: "high",
            message: "RLS evidence artifact missing after tenant and cross-tenant verification.",
            source: "rls-evidence",
          },
        ],
      };
    }

    const commandFailed =
      routeRegistry.status !== 0 ||
      tenantCoverage.status !== 0 ||
      crossTenant.status !== 0 ||
      rlsBoundary.status !== 0 ||
      rlsEvidence.status !== 0;

    const issues: SecurityIssue[] = [];
    let status = statusFromArtifact(artifact.status);

    if (commandFailed || crossTenantArtifact?.status === "failed") {
      status = "failed";
      issues.push({
        type: "rls",
        severity: "high",
        message:
          artifact.reason ||
          "Tenant isolation or RLS verification command failed. Review tenant coverage and cross-tenant suites.",
        source: "rls-evidence",
      });
    } else if (status === "degraded") {
      issues.push({
        type: "rls",
        severity: "medium",
        message:
          artifact.reason || "RLS evidence is degraded; runtime proof was not fully captured.",
        source: "rls-evidence",
      });
    }

    return {
      check: {
        name: "rls",
        status,
        summary:
          artifact.reason ||
          "Tenant isolation and RLS verification completed without a machine-readable summary.",
        reason: artifact.evidenceState?.toLowerCase(),
        verificationPath: [
          "pnpm run security:routes",
          "pnpm run verify:tenant",
          "pnpm run test:cross-tenant",
          "node scripts/security/verify-rls-boundary.mjs",
          "node scripts/security/rls-evidence.mjs",
        ],
        details: {
          routeRegistryStatus: routeRegistry.status,
          tenantCoverageStatus: tenantCoverage.status,
          crossTenantStatus: crossTenant.status,
          crossTenantSuiteStatus: crossTenantArtifact?.status,
          rlsBoundaryStatus: rlsBoundary.status,
          rlsEvidenceStatus: rlsEvidence.status,
          artifactStatus: artifact.status,
          evidenceLevel: artifact.evidenceLevel,
          runtimeExecuted: artifact.runtimeExecuted,
          environmentConstraints: artifact.environmentConstraints,
          nextOperatorAction: artifact.nextOperatorAction,
        },
      },
      issues,
    };
  }

  private runComplianceBoundaryCheck(): CheckExecution {
    return {
      check: {
        name: "compliance",
        status: "not_applicable",
        reason: "compliance_attestation_not_proved_here",
        summary:
          "This agent does not prove compliance certifications or external audit posture. Use repo evidence artifacts plus external audit workflows instead.",
      },
      issues: [],
    };
  }

  private async maybeSendNotification(
    counts: SecurityReport["summaryCounts"],
    issues: SecurityIssue[]
  ): Promise<SecurityCheck> {
    if (counts.critical === 0 && counts.high === 0) {
      return {
        name: "notification",
        status: "not_applicable",
        summary: "No critical or high findings; Slack notification not required.",
      };
    }

    if (!this.config.slackWebhook) {
      return {
        name: "notification",
        status: "degraded",
        reason: "slack_webhook_missing",
        summary: "High-severity findings detected but no Slack webhook is configured.",
      };
    }

    try {
      const response = await this.fetchImpl(this.config.slackWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `Settler security scan: ${counts.critical} critical, ${counts.high} high findings`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text:
                  `*Settler Security Scan*\n` +
                  `Critical: ${counts.critical}\n` +
                  `High: ${counts.high}\n` +
                  `Medium: ${counts.medium}\n` +
                  `Low: ${counts.low}`,
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `Top finding: ${issues[0]?.message || "n/a"}`,
              },
            },
          ],
        }),
      });

      if (!response.ok) {
        return {
          name: "notification",
          status: "degraded",
          reason: "slack_notification_failed",
          summary: `Slack notification failed with HTTP ${response.status}.`,
          details: { status: response.status },
        };
      }

      return {
        name: "notification",
        status: "verified",
        summary: "Slack notification sent for high-severity findings.",
      };
    } catch (error) {
      return {
        name: "notification",
        status: "degraded",
        reason: "slack_notification_exception",
        summary: "Slack notification could not be sent.",
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  private runNodeScript(args: string[], env: NodeJS.ProcessEnv, timeoutMs: number): CommandResult {
    return this.runCommand(process.execPath, args, {
      cwd: this.config.repoRoot,
      env,
      timeoutMs,
    });
  }

  private runPnpm(args: string[], env: NodeJS.ProcessEnv, timeoutMs: number): CommandResult {
    return this.runCommand("pnpm", args, {
      cwd: this.config.repoRoot,
      env,
      timeoutMs,
    });
  }

  private readJsonArtifact<T>(relativeArtifactPath: string): T | null {
    const artifactPath = join(this.config.repoRoot, relativeArtifactPath);
    if (!existsSync(artifactPath)) {
      return null;
    }

    try {
      return JSON.parse(readFileSync(artifactPath, "utf8")) as T;
    } catch (error) {
      log.warn("Failed to parse security artifact", {
        artifactPath,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  private writeReportIfRequested(report: SecurityReport): void {
    const outputPath =
      this.config.reportOutputPath?.trim() || process.env.SETTLER_SECURITY_REPORT_OUT?.trim();

    if (!outputPath) {
      return;
    }

    const resolvedOutput = resolve(outputPath);
    mkdirSync(dirname(resolvedOutput), { recursive: true });
    writeFileSync(resolvedOutput, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
}

function parseScanType(rawValue?: string): SecurityScanType {
  switch (rawValue) {
    case "vulnerabilities":
    case "secrets":
    case "rls":
    case "compliance":
    case "all":
      return rawValue;
    default:
      return "all";
  }
}

export async function runSecurityAgentCli(args = process.argv.slice(2)): Promise<SecurityReport> {
  const scanType = parseScanType(args.find((arg) => arg.startsWith("--scan="))?.split("=")[1]);
  const repoRootArg = args.find((arg) => arg.startsWith("--repo-root="))?.split("=")[1];
  const outArg = args.find((arg) => arg.startsWith("--out="))?.split("=")[1];

  const agent = new SecurityAgent({
    repoRoot: repoRootArg,
    reportOutputPath: outArg,
    slackWebhook: process.env.SLACK_WEBHOOK_URL,
    securityAuditMode:
      (process.env.SECURITY_AUDIT_MODE as SecurityConfig["securityAuditMode"]) || "warn",
    dependencyEvidenceMode:
      (process.env.SECURITY_DEPENDENCY_EVIDENCE_MODE as SecurityConfig["dependencyEvidenceMode"]) ||
      "standard",
    rlsEvidenceMode:
      (process.env.SECURITY_RLS_EVIDENCE_MODE as SecurityConfig["rlsEvidenceMode"]) ||
      "static-only",
    githubToken: process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
    githubRepository: process.env.GITHUB_REPOSITORY,
    dependabotAlertsExportPath: process.env.DEPENDABOT_ALERTS_EXPORT_PATH,
  });

  const report = await agent.scan(scanType);
  printAgentReport(report);
  return report;
}

if (require.main === module) {
  runSecurityAgentCli()
    .then((report) => {
      process.exit(exitCodeForVerdict(report.verdict));
    })
    .catch((error) => {
      const fallbackReport: SecurityReport = {
        agent: "security-agent",
        verdict: "failed",
        summary: "Security agent crashed before producing a complete report.",
        timestamp: new Date().toISOString(),
        scanType: "all",
        scanTime: new Date().toISOString(),
        repoRoot: findRepoRoot(process.cwd()),
        issues: [
          {
            type: "compliance",
            severity: "high",
            message: error instanceof Error ? error.message : String(error),
            source: "security-agent",
          },
        ],
        summaryCounts: {
          critical: 0,
          high: 1,
          medium: 0,
          low: 0,
        },
        checks: [
          {
            name: "notification",
            status: "failed",
            reason: "unhandled_exception",
            summary: "Unhandled exception prevented scan completion.",
          },
        ],
        claimBoundary:
          "This crash report does not prove any security control; it only records that the security-agent itself failed.",
      };

      printAgentReport(fallbackReport);
      process.exit(1);
    });
}
