/** @jest-environment node */

import { NextRequest } from "next/server";
import { GET, PATCH } from "@/app/api/console/schedules/route";

jest.mock("@/middleware/billing-gate-universal", () => ({
  withUniversalBillingGate: (handler: unknown) => handler,
}));

jest.mock("@/lib/middleware/api-security", () => ({
  withSecurity: (handler: unknown) => handler,
}));

const requireTenantRequestContext = jest.fn();
const reconJobFindManyMock = jest.fn();
const reconJobFindFirstMock = jest.fn();
const reconJobUpdateMock = jest.fn();
const logAuditEventMock = jest.fn();

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

jest.mock("@/shared/db/prismaClient", () => ({
  prisma: {
    reconJob: {
      findMany: (...args: unknown[]) => reconJobFindManyMock(...args),
      findFirst: (...args: unknown[]) => reconJobFindFirstMock(...args),
      update: (...args: unknown[]) => reconJobUpdateMock(...args),
    },
  },
}));

jest.mock("@/lib/audit/logger", () => ({
  logAuditEvent: (...args: unknown[]) => logAuditEventMock(...args),
}));

jest.mock("@/lib/utils/logger", () => ({
  appLogger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

function makeGetRequest() {
  return new NextRequest("http://localhost/api/console/schedules");
}

function makePatchRequest(body: unknown) {
  return new NextRequest("http://localhost/api/console/schedules", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  });
}

describe("/api/console/schedules route", () => {
  const originalSchedulerEnabled = process.env.SCHEDULER_ENABLED;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SCHEDULER_ENABLED = "true";
    requireTenantRequestContext.mockResolvedValue({ userId: "user-1", tenantId: "tenant-1" });
  });

  afterAll(() => {
    process.env.SCHEDULER_ENABLED = originalSchedulerEnabled;
  });

  it("GET returns degraded capability when scheduler is disabled", async () => {
    process.env.SCHEDULER_ENABLED = "false";
    reconJobFindManyMock.mockResolvedValue([]);

    const response = await GET(makeGetRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.capability).toEqual({ state: "degraded", reason: "scheduler_disabled_by_env" });
  });

  it("PATCH keeps update truthful when scheduler is disabled", async () => {
    process.env.SCHEDULER_ENABLED = "false";

    reconJobFindFirstMock.mockResolvedValue({
      id: "job-1",
      tenantId: "tenant-1",
      scheduleCron: "0 0 * * *",
      scheduleTimezone: "UTC",
      deletedAt: null,
    });

    reconJobUpdateMock.mockResolvedValue({
      id: "job-1",
      scheduleCron: "0 6 * * *",
      scheduleTimezone: "America/New_York",
    });

    const response = await PATCH(
      makePatchRequest({
        jobId: "job-1",
        scheduleCron: "0 6 * * *",
        scheduleTimezone: "America/New_York",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.capability).toEqual({ state: "degraded", reason: "scheduler_disabled_by_env" });
    expect(logAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        tenantId: "tenant-1",
        action: "update",
        resourceType: "reconciliation_job",
        resourceId: "job-1",
      })
    );
  });

  it("PATCH rejects out-of-range cron expressions", async () => {
    reconJobFindFirstMock.mockResolvedValue({
      id: "job-1",
      tenantId: "tenant-1",
      scheduleCron: null,
      scheduleTimezone: "UTC",
      deletedAt: null,
    });

    const response = await PATCH(
      makePatchRequest({
        jobId: "job-1",
        scheduleCron: "99 0 * * *",
        scheduleTimezone: "UTC",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.capability).toEqual({ state: "degraded", reason: "invalid_cron_expression" });
    expect(reconJobUpdateMock).not.toHaveBeenCalled();
  });
});
