const logWarnMock = jest.fn();
const logInfoMock = jest.fn();
const logErrorMock = jest.fn();

jest.mock("../../utils/logger", () => ({
  logWarn: (...args: unknown[]) => logWarnMock(...args),
  logInfo: (...args: unknown[]) => logInfoMock(...args),
  logError: (...args: unknown[]) => logErrorMock(...args),
}));

import { AIRouter } from "../../services/ai-mesh/ai-router";
import { MultiAgentFallback } from "../../services/ai-mesh/multi-agent-fallback";
import { MultiModelRouter } from "../../services/datapane/multi-model-router";
import { DriftDetector } from "../../services/drift/drift-detector";

describe("runtime truth closure", () => {
  beforeEach(() => {
    logWarnMock.mockReset();
    logInfoMock.mockReset();
    logErrorMock.mockReset();
  });

  it("returns explicit unavailable multi-agent contracts with deterministic task identifiers", async () => {
    const fallback = new MultiAgentFallback(new AIRouter());

    const first = await fallback.handleSchemaDeviation(
      { type: "number", value: 100 },
      { type: "string", value: "100" }
    );
    const second = await fallback.handleSchemaDeviation(
      { type: "number", value: 100 },
      { type: "string", value: "100" }
    );

    expect(first).toEqual(second);
    expect(first).toMatchObject({
      success: false,
      status: "unavailable",
      reasonCode: "ai_mesh_executor_unavailable",
      degraded: true,
      attemptedModels: [
        "gpt-4",
        "claude-3-opus",
        "claude-3-sonnet",
        "gpt-3.5-turbo",
        "claude-3-haiku",
        "local-llm",
      ],
    });

    const unavailableCalls = logWarnMock.mock.calls.filter(
      ([message]) => message === "multi_agent_executor_unavailable"
    );
    expect(unavailableCalls).toHaveLength(2);
    expect(unavailableCalls[0]?.[1]).toEqual(
      expect.objectContaining({
        taskId: unavailableCalls[1]?.[1]?.taskId,
        reasonCode: "ai_mesh_executor_unavailable",
      })
    );
  });

  it("records blocked drift auto-repair semantics instead of implying repair occurred", async () => {
    const prisma = {
      contractVersion: { findUnique: jest.fn().mockResolvedValue(null) },
      driftEvent: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    } as any;

    const detector = new DriftDetector(prisma);
    const repaired = await detector.autoRepair("tenant-1", "job-1", {
      fieldPath: "amount",
      expectedType: "number",
      actualType: "string",
      expectedValue: 10,
      actualValue: "10",
      severity: "error",
      confidence: 1,
    });

    expect(repaired).toBe(false);
    expect(prisma.driftEvent.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: "tenant-1",
          reconJobId: "job-1",
          fieldPath: "amount",
        }),
        data: expect.objectContaining({
          autoRepaired: false,
          repairAction: expect.objectContaining({
            status: "unavailable",
            reasonCode: "ai_mesh_executor_unavailable",
            degraded: true,
          }),
        }),
      })
    );
  });

  it("returns explicit unavailable multi-model execution results instead of placeholder success", async () => {
    const router = new MultiModelRouter({
      primaryModel: "gpt-4",
      fallbackModels: ["claude-3-sonnet", "gpt-3.5-turbo"],
      enableFallback: true,
      budgetLimit: 0.05,
      latencyTarget: 2500,
    });

    const decision = await router.route({ prompt: "Summarize" }, "low");
    const result = await router.executeWithFallback({ prompt: "Summarize" }, decision);

    expect(result).toMatchObject({
      status: "unavailable",
      result: null,
      model: decision.selectedModel,
      attempts: 0,
      reasonCode: "multi_model_executor_unavailable",
      degraded: true,
      attemptedModels: [decision.selectedModel, ...decision.fallbackChain],
    });
  });
});
