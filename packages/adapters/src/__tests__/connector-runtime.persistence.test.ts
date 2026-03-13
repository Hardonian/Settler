import { ConnectorRuntime } from "../connector-runtime";

const rpcMock = jest.fn();
const upsertMock = jest.fn();
const singleMock = jest.fn();
jest.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    rpc: rpcMock,
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ single: singleMock }),
          single: singleMock,
        }),
      }),
      upsert: (records: unknown[]) => upsertMock(table, records),
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
    }),
  }),
}));

describe("connector-runtime persistence truth", () => {
  const runtime = new ConnectorRuntime({
    supabaseUrl: "http://localhost",
    supabaseServiceKey: "service",
  });

  beforeEach(() => {
    rpcMock.mockReset();
    upsertMock.mockReset();
    singleMock.mockReset();
    singleMock.mockResolvedValue({ data: { id: "conn-db-id" }, error: null });
  });

  it("marks durable_non_atomic when atomic RPC is unavailable but fallback completes", async () => {
    rpcMock.mockResolvedValue({ error: { code: "PGRST202", message: "rpc missing" } });
    upsertMock.mockResolvedValue({ error: null });

    const outcome = await runtime.saveNormalizedData("tenant-1", "stripe", "sync-1", {
      accounts: [
        {
          providerAccountId: "acct_1",
          accountName: "Primary",
          currency: "USD",
        },
      ],
    });

    expect(outcome.status).toBe("durable_non_atomic");
    expect(outcome.recoveryRequired).toBe(false);
    expect(outcome.fallbackUsed).toBe(true);
  });

  it("marks failed_partial and recovery_required when fallback fails mid-write", async () => {
    rpcMock.mockResolvedValue({ error: { code: "PGRST202", message: "rpc missing" } });
    upsertMock
      .mockResolvedValueOnce({ error: null }) // snapshot
      .mockResolvedValueOnce({ error: null }) // fallback evidence
      .mockResolvedValueOnce({ error: null }) // accounts
      .mockResolvedValueOnce({ error: { message: "tx fail" } }) // transactions
      .mockResolvedValue({ error: null }); // recovery marker + sync run updates

    await expect(
      runtime.saveNormalizedData("tenant-1", "stripe", "sync-2", {
        accounts: [
          {
            providerAccountId: "acct_1",
            accountName: "Primary",
            currency: "USD",
          },
        ],
        transactions: [
          {
            externalId: "tx_1",
            transactionType: "debit",
            amountCents: 100,
            currency: "USD",
            occurredAt: new Date("2026-01-01T00:00:00.000Z"),
            idempotencyKey: "idemp-1",
          },
        ],
      })
    ).rejects.toThrow("Failed to persist transactions");

    const recoveryEventCall = upsertMock.mock.calls.find((call: unknown[]) => {
      const table = call[0] as string;
      const records = call[1] as Array<{ event_type?: string }>;
      if (table !== "raw_events") return false;
      return (
        Array.isArray(records) &&
        records.some((r) => (r as { event_type?: string }).event_type === "sync_recovery_required")
      );
    });

    expect(recoveryEventCall).toBeDefined();
  });
});
