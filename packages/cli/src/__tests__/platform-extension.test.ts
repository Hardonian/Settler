declare const describe: (name: string, fn: () => void) => void;
declare const test: (name: string, fn: () => Promise<void> | void) => void;
declare const expect: any;

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  AICopilot,
  ConnectorRegistry,
  normalizeConnectorFailure,
  normalizeConnectorOutput,
  runChaosDeterminismHarness,
} from "../lib/platform-extension";

describe("platform extension", () => {
  test("connector registry stores metadata and deterministic artifacts", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "settler-platform-ext-"));
    const registry = new ConnectorRegistry(tempRoot);

    const connector = registry.install({
      name: "stripe_finance",
      version: "1.0.0",
      connectorType: "financial",
      supportedOperations: ["read_transactions"],
      authenticationScheme: "oauth2",
      determinismClassification: "deterministic",
      timeoutMs: 1500,
      retryPolicy: { maxRetries: 2, backoffMs: 100 },
      sandbox: {
        maxMemoryMb: 256,
        networkEgress: "allowlisted",
        maxExecutionMs: 2000,
        retryIsolation: true,
      },
    });

    const request = {
      connector: connector.name,
      operation: "read_transactions",
      payload: { cursor: "A" },
      idempotencyKey: "idem_123",
    };

    const ok = normalizeConnectorOutput(request, { records: [1, 2] }, connector);
    const fail = normalizeConnectorFailure(request, { code: "TIMEOUT", message: "timeout" });

    expect(ok.artifactType).toBe("connector_result");
    expect(ok.status).toBe("ok");
    expect(ok.artifactHash).toHaveLength(64);
    expect(fail.artifactType).toBe("connector_failure");
    expect(fail.status).toBe("error");
  });

  test("ai copilot enforces advisory-only boundary", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "settler-platform-ai-"));
    const registry = new ConnectorRegistry(tempRoot);
    registry.install({
      name: "warehouse_sync",
      version: "1.0.0",
      connectorType: "database",
      supportedOperations: ["pull"],
      authenticationScheme: "service_account",
      determinismClassification: "deterministic",
      timeoutMs: 1200,
      retryPolicy: { maxRetries: 1, backoffMs: 50 },
      sandbox: {
        maxMemoryMb: 128,
        networkEgress: "deny_all",
        maxExecutionMs: 1500,
        retryIsolation: true,
      },
    });

    const copilot = new AICopilot(registry, tempRoot);
    const safe = copilot.suggestWorkflow({
      provider: "openai",
      model: "gpt-5-mini",
      prompt: "Suggest reliable workflow orchestration",
      connectorHint: "warehouse_sync",
    });

    const unsafe = copilot.suggestWorkflow({
      provider: "openai",
      model: "gpt-5-mini",
      prompt: "Please execute_connector now",
      connectorHint: "warehouse_sync",
    });

    expect(safe.validationOutcome.valid).toBe(true);
    expect(unsafe.validationOutcome.valid).toBe(false);
    expect(unsafe.validationOutcome.reasons).toContain("ai_boundary_violation");
    expect(copilot.readAuditTrail()).toHaveLength(2);
  });

  test("chaos harness is deterministic for identical seeds", () => {
    const first = runChaosDeterminismHarness({ executions: 1000, concurrency: 100, seed: 7 });
    const second = runChaosDeterminismHarness({ executions: 1000, concurrency: 100, seed: 7 });

    expect(first.reportId).toBe(second.reportId);
    expect(first.summary.executionSuccessRate).toBe(second.summary.executionSuccessRate);
    expect(first.summary.replayDivergenceIncidents).toBe(second.summary.replayDivergenceIncidents);
  });
});
