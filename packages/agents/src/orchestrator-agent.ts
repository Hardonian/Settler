import {
  createUnsupportedActionReport,
  exitCodeForVerdict,
  printAgentReport,
  type AgentReport,
} from "./agent-contract";

export function createOrchestratorAgentReport(): AgentReport {
  return createUnsupportedActionReport({
    agent: "orchestrator-agent",
    action: "Legacy local multi-agent orchestration",
    supportedPath: "`scripts/run-agent.ts` and repo-owned verification/release workflows",
  });
}

export async function runOrchestratorAgentCli(): Promise<AgentReport> {
  const report = createOrchestratorAgentReport();
  printAgentReport(report);
  return report;
}

if (require.main === module) {
  runOrchestratorAgentCli()
    .then((report) => {
      process.exit(exitCodeForVerdict(report.verdict));
    })
    .catch(() => {
      process.exit(1);
    });
}
