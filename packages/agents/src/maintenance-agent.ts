import {
  createUnsupportedActionReport,
  exitCodeForVerdict,
  printAgentReport,
  type AgentReport,
} from "./agent-contract";

export function createMaintenanceAgentReport(): AgentReport {
  return createUnsupportedActionReport({
    agent: "maintenance-agent",
    action: "Legacy local maintenance automation",
    supportedPath: "repo-native maintenance scripts and verified retention workers",
  });
}

export async function runMaintenanceAgentCli(): Promise<AgentReport> {
  const report = createMaintenanceAgentReport();
  printAgentReport(report);
  return report;
}

if (require.main === module) {
  runMaintenanceAgentCli()
    .then((report) => {
      process.exit(exitCodeForVerdict(report.verdict));
    })
    .catch(() => {
      process.exit(1);
    });
}
