import {
  createUnsupportedActionReport,
  exitCodeForVerdict,
  printAgentReport,
  type AgentReport,
} from "./agent-contract";

export function createMonitorAgentReport(): AgentReport {
  return createUnsupportedActionReport({
    agent: "monitor-agent",
    action: "Legacy local monitor daemon",
    supportedPath:
      "`pnpm run ops:doctor`, `pnpm run verify:security:runtime`, and repo-native health routes",
  });
}

export async function runMonitorAgentCli(): Promise<AgentReport> {
  const report = createMonitorAgentReport();
  printAgentReport(report);
  return report;
}

if (require.main === module) {
  runMonitorAgentCli()
    .then((report) => {
      process.exit(exitCodeForVerdict(report.verdict));
    })
    .catch(() => {
      process.exit(1);
    });
}
