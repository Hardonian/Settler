import request from "supertest";
import express from "express";
import ventureInvoiceNudgerRouter from "../v1/venture-invoice-nudger";
import { AuthRequest } from "../../middleware/auth";

const queryWithTenantMock = jest.fn();
const transactionWithTenantMock = jest.fn();

jest.mock("../../middleware/authorization", () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../../middleware/validation", () => ({
  validateRequest: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../../middleware/governance", () => ({
  enforceFreezeState: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock("../../db", () => ({
  queryWithTenant: (...args: unknown[]) => queryWithTenantMock(...args),
  transactionWithTenant: (...args: unknown[]) => transactionWithTenantMock(...args),
}));

describe("venture invoice nudger routes", () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as AuthRequest).tenantId = "00000000-0000-4000-8000-000000000111";
      (req as AuthRequest).userId = "00000000-0000-4000-8000-000000000222";
      next();
    });
    app.use("/api/v1/venture", ventureInvoiceNudgerRouter);

    jest.clearAllMocks();
  });

  it("creates a nudger run", async () => {
    queryWithTenantMock.mockResolvedValueOnce([
      {
        id: "00000000-0000-4000-8000-000000000301",
        external_id: "inv_ext_1",
        invoice_number: "INV-001",
        customer_id: "cust-1",
        customer_name: "Acme",
        amount_cents: "25000",
        currency: "USD",
        status: "overdue",
        issue_date: "2026-03-01",
        due_date: "2026-03-15",
        paid_at: null,
      },
    ]);

    transactionWithTenantMock.mockImplementation(async (_tenantId, callback) => {
      const runId = "00000000-0000-4000-8000-000000000999";
      const client = {
        query: jest
          .fn()
          .mockResolvedValueOnce({
            rows: [{ id: runId, created_at: "2026-04-10T05:30:00.000Z" }],
          })
          .mockResolvedValueOnce({ rows: [{ signal_count: "0" }] })
          .mockResolvedValueOnce({ rows: [{ signal_count: "1" }] })
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce({ rows: [] }),
      };

      return callback(client);
    });

    const res = await request(app).post("/api/v1/venture/invoice-nudger/run").send({
      minDaysOverdue: 7,
      maxInvoices: 25,
      lookbackDays: 14,
      execute: false,
    });

    expect(res.status).toBe(201);
    expect(res.body?.data?.runId).toBe("00000000-0000-4000-8000-000000000999");
    expect(res.body?.data?.totalScanned).toBe(1);
    expect(res.body?.data?.totalNudged).toBe(1);
    expect(res.body?.data?.totalSuppressed).toBe(0);
  });

  it("lists prior runs", async () => {
    queryWithTenantMock.mockResolvedValueOnce([
      {
        id: "00000000-0000-4000-8000-000000000401",
        status: "completed",
        minDaysOverdue: 7,
        lookbackDays: 14,
        executeMode: false,
        totalScanned: 10,
        totalNudged: 8,
        totalSuppressed: 2,
        createdAt: "2026-04-10T05:30:00.000Z",
        completedAt: "2026-04-10T05:31:00.000Z",
      },
    ]);

    const res = await request(app).get("/api/v1/venture/invoice-nudger/runs?limit=5");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body?.data)).toBe(true);
    expect(res.body?.data?.[0]?.id).toBe("00000000-0000-4000-8000-000000000401");
  });
});
