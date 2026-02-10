import type { EnhancedAdapter, NormalizedEvent } from "@settler/adapters";

import { WebhookIngestionService } from "../../application/webhooks/WebhookIngestionService";

describe("WebhookIngestionService tenant propagation", () => {
  it("passes tenantId through normalize and persistence pipeline", async () => {
    const service = new WebhookIngestionService();

    const normalizeWebhook = jest.fn<NormalizedEvent[], [Record<string, unknown>, string]>(() => [
      {
        type: "capture",
        rawPayload: { id: "evt_1" },
        timestamp: new Date("2025-01-01T00:00:00.000Z"),
      } as NormalizedEvent,
    ]);

    const adapter: EnhancedAdapter = {
      name: "test-adapter",
      verifyWebhook: jest.fn(() => true),
      normalizeWebhook,
      transformTransaction: jest.fn(),
      transformSettlement: jest.fn(),
      transformRefundDispute: jest.fn(),
      fetchTransactions: jest.fn(),
      fetchSettlements: jest.fn(),
      fetchRefundsDisputes: jest.fn(),
    } as unknown as EnhancedAdapter;

    service.registerAdapter(adapter);

    const checkIdempotencySpy = jest
      .spyOn(
        service as unknown as { checkIdempotency: (k: string, t: string) => Promise<null> },
        "checkIdempotency"
      )
      .mockResolvedValue(null);
    const storeWebhookPayloadSpy = jest
      .spyOn(
        service as unknown as {
          storeWebhookPayload: (
            a: string,
            p: Record<string, unknown>,
            s: string,
            t: string
          ) => Promise<void>;
        },
        "storeWebhookPayload"
      )
      .mockResolvedValue(undefined);
    const processEventSpy = jest
      .spyOn(
        service as unknown as { processEvent: (e: NormalizedEvent, t: string) => Promise<void> },
        "processEvent"
      )
      .mockResolvedValue(undefined);
    const storeIdempotencyKeySpy = jest
      .spyOn(
        service as unknown as {
          storeIdempotencyKey: (k: string, t: string, e: NormalizedEvent[]) => Promise<void>;
        },
        "storeIdempotencyKey"
      )
      .mockResolvedValue(undefined);

    const payload = { id: "evt_1", message: "ok" };
    const result = await service.processWebhook(
      "test-adapter",
      payload,
      "sig",
      "secret",
      "tenant-1"
    );

    expect(result.success).toBe(true);
    expect(normalizeWebhook).toHaveBeenCalledWith(payload, "tenant-1");
    expect(checkIdempotencySpy).toHaveBeenCalledWith("evt_1", "tenant-1");
    expect(storeWebhookPayloadSpy).toHaveBeenCalledWith("test-adapter", payload, "sig", "tenant-1");
    expect(processEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "capture" }),
      "tenant-1"
    );
    expect(storeIdempotencyKeySpy).toHaveBeenCalledWith(
      "evt_1",
      "tenant-1",
      expect.arrayContaining([expect.objectContaining({ type: "capture" })])
    );
  });
});
