/** @jest-environment node */

const findManyMock = jest.fn();

jest.mock("@/lib/middleware/api-security", () => ({
  withSecurity: (handler: unknown) => handler,
}));

jest.mock("@/middleware/billing-gate-universal", () => ({
  withUniversalBillingGate: (handler: unknown) => handler,
}));

jest.mock("@/lib/security/billing-enforcement", () => ({
  requireActiveSubscription: jest.fn(async () => ({ allowed: true })),
}));

jest.mock("@/lib/api/auth-gate", () => ({
  requireAdmin: jest.fn(async () => ({ isAdmin: true })),
}));

jest.mock("@/shared/db/prismaClient", () => ({
  prisma: {
    auditLog: {
      findMany: (...args: unknown[]) => findManyMock(...args),
    },
  },
}));

import { GET as getConsoleSupportTickets } from "@/app/api/console/support/tickets/route";
import { GET as getSupportTickets } from "@/app/api/support/tickets/route";

function req(url: string) {
  return {
    url,
    nextUrl: new URL(url),
    headers: new Headers(),
  } as any;
}

describe("support intake family context outputs", () => {
  beforeEach(() => {
    findManyMock.mockReset();
    findManyMock.mockResolvedValue([
      {
        id: "audit-1",
        tenantId: "tenant-a",
        userId: "user-a",
        createdAt: new Date("2026-04-08T12:00:00.000Z"),
        changes: {
          submission_id: "sub-1",
          category: "run_failure",
          description: "Export drift on canonical run after exception adjudication.",
          run_id: "run-1",
          exception_id: "exc-1",
          operator_triage_priority: "high",
          run_context: {
            state: "ok",
            runId: "run-1",
          },
          exception_context: {
            state: "ok",
            exceptionId: "exc-1",
            familySummary: {
              familyCode: "AMOUNT_MISMATCH",
              familyLabel: "Amount Mismatch",
              state: "available",
            },
            operatorSummary: {
              familyLabel: "Amount Mismatch",
              familyState: "available",
            },
          },
        },
        metadata: { intake_version: 2 },
      },
    ]);
  });

  it("surfaces exception family context in the console inbox", async () => {
    const response = await getConsoleSupportTickets(
      req("http://localhost/api/console/support/tickets")
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.items[0]).toMatchObject({
      runId: "run-1",
      exceptionId: "exc-1",
      runContextState: "ok",
      exceptionContextState: "ok",
      familyLabel: "Amount Mismatch",
      familyState: "available",
    });
  });

  it("surfaces exception family context in the legacy admin inbox route", async () => {
    const response = await getSupportTickets(req("http://localhost/api/support/tickets"));

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.tickets[0]).toMatchObject({
      runId: "run-1",
      exceptionId: "exc-1",
      runContextState: "ok",
      exceptionContextState: "ok",
      familyLabel: "Amount Mismatch",
      familyState: "available",
    });
  });
});
