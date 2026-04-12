import {
  createUnsupportedActionReport,
  exitCodeForVerdict,
  printAgentReport,
  type AgentReport,
} from "./agent-contract";

export function createDeployAgentReport(): AgentReport {
  return createUnsupportedActionReport({
    agent: "deploy-agent",
    action: "Legacy local deploy automation",
    supportedPath: "`scripts/run-agent.ts` or the repo's verified release/deploy workflows",
  });
}

export async function runDeployAgentCli(): Promise<AgentReport> {
  const report = createDeployAgentReport();
  printAgentReport(report);
  return report;
}

if (require.main === module) {
  runDeployAgentCli()
    .then((report) => {
      process.exit(exitCodeForVerdict(report.verdict));
    })
    .catch(() => {
      process.exit(1);
    });
}
