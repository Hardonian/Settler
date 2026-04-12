import {
  createUnsupportedActionReport,
  exitCodeForVerdict,
  printAgentReport,
  type AgentReport,
} from "./agent-contract";

export function createCommunicationAgentReport(): AgentReport {
  return createUnsupportedActionReport({
    agent: "communication-agent",
    action: "Legacy local communication and paging automation",
    supportedPath:
      "repo-native alerting tables, notification workers, and verified operational routes",
  });
}

export async function runCommunicationAgentCli(): Promise<AgentReport> {
  const report = createCommunicationAgentReport();
  printAgentReport(report);
  return report;
}

if (require.main === module) {
  runCommunicationAgentCli()
    .then((report) => {
      process.exit(exitCodeForVerdict(report.verdict));
    })
    .catch(() => {
      process.exit(1);
    });
}
