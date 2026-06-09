import assert from "node:assert/strict";
import test from "node:test";
import { createDeployAgentReport } from "../deploy-agent";
import { runOrchestratorAgentCli } from "../orchestrator-agent";

test("legacy deploy agent stays fail-closed", () => {
  const report = createDeployAgentReport();
  assert.equal(report.verdict, "failed");
  assert.equal(report.checks[0]?.reason, "not_implemented");
});

test("legacy orchestrator stays fail-closed", async () => {
  const report = await runOrchestratorAgentCli();
  assert.equal(report.verdict, "failed");
  assert.match(report.summary, /production-safe executor/i);
});
