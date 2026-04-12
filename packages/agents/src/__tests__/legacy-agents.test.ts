import assert from "node:assert/strict";
import test from "node:test";
import { createDeployAgentReport } from "../deploy-agent";
import { createOrchestratorAgentReport } from "../orchestrator-agent";

test("legacy deploy agent stays fail-closed", () => {
  const report = createDeployAgentReport();
  assert.equal(report.verdict, "failed");
  assert.equal(report.checks[0]?.reason, "not_implemented");
});

test("legacy orchestrator stays fail-closed", () => {
  const report = createOrchestratorAgentReport();
  assert.equal(report.verdict, "failed");
  assert.match(report.summary, /production-safe executor/i);
});
