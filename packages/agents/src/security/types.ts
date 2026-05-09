import type { AgentCheck, AgentReport } from "../agent-contract";

export type SecurityScanType = "vulnerabilities" | "secrets" | "rls" | "compliance" | "all";

export interface SecurityConfig {
  repoRoot?: string;
  slackWebhook?: string;
  reportOutputPath?: string;
  securityAuditMode?: "strict" | "warn" | "off";
  dependencyEvidenceMode?: "standard" | "strict";
  rlsEvidenceMode?: "static-only" | "runtime-rls" | "runtime-rls-required";
  githubToken?: string;
  githubRepository?: string;
  dependabotAlertsExportPath?: string;
}

export interface SecurityIssue {
  type: "vulnerability" | "secret" | "rls" | "compliance";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  file?: string;
  line?: number;
  source?: string;
}

export interface SecurityCheck extends AgentCheck {
  name: "vulnerabilities" | "secrets" | "rls" | "compliance" | "notification";
}

export interface SecurityReport extends AgentReport {
  agent: "security-agent";
  scanType: SecurityScanType;
  scanTime: string;
  repoRoot: string;
  issues: SecurityIssue[];
  summaryCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  checks: SecurityCheck[];
}

export type CommandResult = {
  command: string;
  args: string[];
  status: number;
  stdout: string;
  stderr: string;
  error?: string;
};

export type CommandRunner = (
  command: string,
  args: string[],
  options: { cwd: string; env: NodeJS.ProcessEnv; timeoutMs?: number }
) => CommandResult;

export interface SecurityAgentDependencies {
  fetchImpl?: typeof fetch;
  runCommand?: CommandRunner;
}

export interface DependencyEvidenceArtifact {
  status?: string;
  reason?: string;
  evidenceState?: string;
  evidenceCompleteness?: string;
  environmentConstraints?: string[];
  nextOperatorAction?: string[];
  localAudit?: {
    summary?: {
      high?: number;
      critical?: number;
      moderate?: number;
      low?: number;
      info?: number;
    } | null;
    outcome?: string;
  };
  advisoryCompleteness?: {
    status?: string;
    reason?: string;
  };
}

export interface RlsEvidenceArtifact {
  status?: string;
  reason?: string;
  evidenceState?: string;
  evidenceLevel?: string;
  environmentConstraints?: string[];
  nextOperatorAction?: string[];
  runtimeExecuted?: boolean;
}

export interface CrossTenantArtifact {
  status?: string;
  exitCode?: number;
  suiteFiles?: string[];
}

export type CheckExecution = {
  check: SecurityCheck;
  issues: SecurityIssue[];
};
