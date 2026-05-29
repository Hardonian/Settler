/** @jest-environment node */

import { NextRequest } from "next/server";
import { GET as listWorkflows, POST as createWorkflow } from "@/app/api/workflows/route";
import {
  GET as getWorkflow,
  PATCH as updateWorkflow,
  DELETE as deleteWorkflow,
} from "@/app/api/workflows/[id]/route";
import { POST as testWorkflow } from "@/app/api/workflows/[id]/test/route";

jest.mock("@/middleware/billing-gate-universal", () => ({
  withUniversalBillingGate: (handler: unknown) => handler,
}));

jest.mock("@/lib/middleware/api-security", () => ({
  withSecurity: (handler: unknown) => handler,
}));

const requireTenantRequestContext = jest.fn();

jest.mock("@/lib/api/tenant-context", () => ({
  requireTenantRequestContext: (...args: unknown[]) => requireTenantRequestContext(...args),
  buildTenantContextErrorResponse: (error: {
    status: number;
    code: string;
    message: string;
    capability: unknown;
  }) =>
    Response.json(
      { error: error.message, code: error.code, capability: error.capability },
      { status: error.status }
    ),
}));

const findMany = jest.fn();
const findFirst = jest.fn();

jest.mock("@/shared/db/prismaClient", () => ({
  prisma: {
    workflowRun: {
      findMany: (...args: unknown[]) => findMany(...args),
      findFirst: (...args: unknown[]) => findFirst(...args),
    },
  },
}));

function makeRequest(url: string) {
  return new NextRequest(url);
}

describe("workflow automation thin-surface API contract", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireTenantRequestContext.mockResolvedValue({ tenantId: "tenant-1", userId: "user-1" });
  });

  it("returns history list with explicit automation unavailability", async () => {
    findMany.mockResolvedValue([
      {
        workflowId: "wf_1",
        workflowName: "Nightly reconciliation",
        status: "completed",
        startedAt: new Date("2026-04-10T00:00:00.000Z"),
        errorMessage: null,
      },
    ]);

    const response = await listWorkflows(makeRequest("http://localhost/api/workflows"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.capability).toEqual({ state: "available", mode: "history_only" });
    expect(body.automationCapability).toMatchObject({
      state: "unavailable",
      reason: "workflow_automation_thin_surface",
    });
    expect(body.workflows).toHaveLength(1);
    expect(body.workflows[0]).toMatchObject({
      id: "wf_1",
      name: "Nightly reconciliation",
      enabled: false,
      trigger: { type: "historical.workflow_run" },
      actions: [{ type: "history_only" }],
      lastRun: { status: "success", timestamp: "2026-04-10T00:00:00.000Z" },
    });
  });

  it("returns detail from tenant-scoped workflow history", async () => {
    findFirst.mockResolvedValue({
      workflowId: "wf_1",
      workflowName: "Nightly reconciliation",
      status: "failed",
      startedAt: new Date("2026-04-10T01:00:00.000Z"),
      errorMessage: "timeout",
    });

    const response = await getWorkflow(makeRequest("http://localhost/api/workflows/wf_1"), {
      params: Promise.resolve({ id: "wf_1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("wf_1");
    expect(body.lastRun).toMatchObject({ status: "failed", error: "timeout" });
    expect(body.automationCapability.state).toBe("unavailable");
  });

  it("returns explicit unavailable capability for mutating endpoints", async () => {
    const createResponse = await createWorkflow(makeRequest("http://localhost/api/workflows"));
    const patchResponse = await updateWorkflow(makeRequest("http://localhost/api/workflows/wf_1"));
    const deleteResponse = await deleteWorkflow(makeRequest("http://localhost/api/workflows/wf_1"));
    const testResponse = await testWorkflow(
      makeRequest("http://localhost/api/workflows/wf_1/test")
    );

    for (const response of [createResponse, patchResponse, deleteResponse, testResponse]) {
      const body = await response.json();
      expect(response.status).toBe(409);
      expect(body.code).toBe("WORKFLOW_AUTOMATION_UNAVAILABLE");
      expect(body.capability).toMatchObject({
        state: "unavailable",
        reason: "workflow_automation_thin_surface",
      });
    }
  });
});
