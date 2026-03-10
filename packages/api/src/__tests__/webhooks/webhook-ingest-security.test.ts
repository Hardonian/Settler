import {
  buildWebhookReplayKey,
  isAllowedWebhookAdapter,
  validateWebhookTimestamp,
} from "../../services/webhooks/security";

describe("webhook ingest security utilities", () => {
  it("rejects missing timestamps", () => {
    expect(validateWebhookTimestamp(undefined)).toEqual({ valid: false, reason: "missing" });
  });

  it("rejects stale timestamps", () => {
    const now = 1_700_000_000;
    expect(validateWebhookTimestamp(String(now - 301), now)).toEqual({
      valid: false,
      reason: "stale",
    });
  });

  it("accepts bounded timestamps", () => {
    const now = 1_700_000_000;
    expect(validateWebhookTimestamp(String(now - 120), now)).toEqual({
      valid: true,
      timestamp: now - 120,
    });
  });

  it("enforces adapter allowlist", () => {
    expect(isAllowedWebhookAdapter("stripe", ["stripe", "shopify"])).toBe(true);
    expect(isAllowedWebhookAdapter("unknown-adapter", ["stripe", "shopify"])).toBe(false);
  });

  it("builds deterministic namespaced replay keys", () => {
    const keyA = buildWebhookReplayKey("stripe", "sig", "1700000000");
    const keyB = buildWebhookReplayKey("stripe", "sig", "1700000000");
    const keyC = buildWebhookReplayKey("stripe", "sig-x", "1700000000");

    expect(keyA).toEqual(keyB);
    expect(keyA).toContain("settler:webhook:replay:v1:stripe:");
    expect(keyA).not.toEqual(keyC);
  });
});
