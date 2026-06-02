import { exitCodeForVerdict, printAgentReport, type AgentReport } from "./agent-contract";
import { runSupportBot } from "./support-agent";
import { runSalesHunterAgent } from "./sales-hunter-agent";

export async function runOrchestratorAgentCli(): Promise<AgentReport> {
  console.info("[Orchestrator] Spinning up the AI Workforce...\n");

  const supportReport = await runSupportBot();
  console.info("");
  const salesReport = await runSalesHunterAgent();
  console.info("");

  const hasFailed = supportReport.verdict === "failed" || salesReport.verdict === "failed";
  const hasDegraded =
    supportReport.verdict === "verified_degraded" || salesReport.verdict === "verified_degraded";

  const verdict = hasFailed ? "failed" : hasDegraded ? "verified_degraded" : "verified_pass";

  const report: AgentReport = {
    agent: "orchestrator-agent",
    verdict,
    summary: `Workforce execution completed. SupportVerdict: ${supportReport.verdict}, SalesVerdict: ${salesReport.verdict}`,
    timestamp: new Date().toISOString(),
    checks: [...supportReport.checks, ...salesReport.checks],
  };

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
