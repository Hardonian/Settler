export type AgentVerdict = "verified_pass" | "verified_degraded" | "failed" | "not_applicable";

export type AgentCheckStatus = "verified" | "degraded" | "failed" | "not_applicable";

export interface AgentCheck {
  name: string;
  status: AgentCheckStatus;
  summary: string;
  reason?: string;
  verificationPath?: string[];
  details?: Record<string, unknown>;
}

export interface AgentReport {
  agent: string;
  verdict: AgentVerdict;
  summary: string;
  timestamp: string;
  checks: AgentCheck[];
  claimBoundary?: string;
  metadata?: Record<string, unknown>;
}

export function deriveVerdict(checks: AgentCheck[]): AgentVerdict {
  if (checks.length === 0) {
    return "not_applicable";
  }

  if (checks.some((check) => check.status === "failed")) {
    return "failed";
  }

  if (checks.some((check) => check.status === "degraded")) {
    return "verified_degraded";
  }

  if (checks.every((check) => check.status === "not_applicable")) {
    return "not_applicable";
  }

  return "verified_pass";
}

export function exitCodeForVerdict(verdict: AgentVerdict): number {
  switch (verdict) {
    case "verified_pass":
    case "not_applicable":
      return 0;
    case "verified_degraded":
      return 2;
    case "failed":
    default:
      return 1;
  }
}

export function printAgentReport(report: AgentReport): void {
  console.info(`${report.agent} report`);
  console.info(`verdict=${report.verdict}`);
  console.info(report.summary);

  for (const check of report.checks) {
    console.info(`- ${check.name}: ${check.status} — ${check.summary}`);
    if (check.reason) {
      console.info(`  reason=${check.reason}`);
    }
  }

  if (report.claimBoundary) {
    console.info(`claimBoundary=${report.claimBoundary}`);
  }

  console.info(JSON.stringify(report));
}

export function createUnsupportedActionReport(params: {
  agent: string;
  action: string;
  supportedPath?: string;
}): AgentReport {
  const supportedSummary = params.supportedPath ? ` Use ${params.supportedPath} instead.` : "";

  return {
    agent: params.agent,
    verdict: "failed",
    summary: `${params.action} is blocked because this repository does not contain a production-safe executor for it.${supportedSummary}`,
    timestamp: new Date().toISOString(),
    claimBoundary:
      "Do not treat legacy local agent entrypoints as operational automation until they are rebuilt with explicit execution contracts, verification, and evidence surfaces.",
    checks: [
      {
        name: "execution",
        status: "failed",
        reason: "not_implemented",
        summary: "CLI execution is intentionally fail-closed to avoid false operational claims.",
      },
    ],
  };
}
