import { describe, it, expect, vi } from "vitest";
import { createWebhookManager } from "../webhooks";
import * as licensing from "../licensing";

// Mock the licensing module so requireFeature doesn't throw
vi.mock("../licensing", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    requireFeature: vi.fn(),
  };
});

describe("WebhookManager", () => {
  it("should securely sign payload using subtle crypto when available", async () => {
    const manager = createWebhookManager("test-secret");

    let capturedPayload: any;
    manager.on("transaction.created", (payload) => {
      capturedPayload = payload;
    });

    await manager.emit("transaction.created", { foo: "bar" });

    expect(capturedPayload).toBeDefined();
    expect(capturedPayload.signature).toBeDefined();

    // Check if signature is a SHA-256 hash (64 hex characters)
    expect(capturedPayload.signature).toMatch(/^[0-9a-f]{64}$/);

    // Verify signature
    const isValid = await manager.verifySignature(capturedPayload, capturedPayload.signature);
    expect(isValid).toBe(true);
  });

  it("should throw an error in fallback mode instead of using insecure btoa", async () => {
    // Hide crypto.subtle temporarily to test fallback
    const originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, "crypto", {
      value: { ...originalCrypto, subtle: undefined },
      writable: true,
      configurable: true,
    });

    const manager = createWebhookManager("test-secret");

    // Emitting an event should throw since it tries to sign the payload
    await expect(manager.emit("transaction.created", { foo: "bar" })).rejects.toThrow(
      "Secure crypto implementation is required but not available in this environment."
    );

    // Restore crypto
    Object.defineProperty(globalThis, "crypto", {
      value: originalCrypto,
      writable: true,
      configurable: true,
    });
  });
});
