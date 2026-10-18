import type { EnhancedAdapter, NormalizedEvent } from "@settler/adapters";

import { WebhookIngestionService } from "../../application/webhooks/WebhookIngestionService";
import { cache } from "../../infrastructure/redis/client";

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

  it("processes only one of 50 concurrent deliveries for the same tenant and event", async () => {
    const service = new WebhookIngestionService();
    let completed = false;
    let lockOwner: string | null = null;

    const adapter: EnhancedAdapter = {
      name: "race-adapter",
      verifyWebhook: jest.fn(() => true),
      normalizeWebhook: jest.fn(() => [
        {
          type: "capture",
          rawPayload: { id: "evt-race" },
          timestamp: new Date("2026-10-18T00:00:00.000Z"),
        } as NormalizedEvent,
      ]),
    } as unknown as EnhancedAdapter;
    service.registerAdapter(adapter);

    jest.spyOn(cache, "acquireLock").mockImplementation(async () => {
      if (lockOwner) return null;
      lockOwner = "lease-owner";
      return lockOwner;
    });
    jest.spyOn(cache, "releaseLock").mockImplementation(async (_key, token) => {
      if (token === lockOwner) lockOwner = null;
    });
    jest
      .spyOn(
        service as unknown as {
          checkIdempotency: () => Promise<{ events: NormalizedEvent[] } | null>;
        },
        "checkIdempotency"
      )
      .mockImplementation(async () => (completed ? { events: [] } : null));
    const persist = jest
      .spyOn(
        service as unknown as { storeWebhookPayload: () => Promise<void> },
        "storeWebhookPayload"
      )
      .mockResolvedValue(undefined);
    jest
      .spyOn(service as unknown as { processEvent: () => Promise<void> }, "processEvent")
      .mockResolvedValue(undefined);
    jest
      .spyOn(
        service as unknown as { storeIdempotencyKey: () => Promise<void> },
        "storeIdempotencyKey"
      )
      .mockImplementation(async () => {
        completed = true;
      });

    const results = await Promise.all(
      Array.from({ length: 50 }, () =>
        service.processWebhook(
          "race-adapter",
          { id: "evt-race" },
          "signature",
          "secret",
          "00000000-0000-4000-8000-0000000000a1"
        )
      )
    );

    expect(results.every((result) => result.success)).toBe(true);
    expect(persist).toHaveBeenCalledTimes(1);
  });
});
