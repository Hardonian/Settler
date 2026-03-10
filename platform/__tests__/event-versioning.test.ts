import { describe, expect, it } from "vitest";
import { adaptPlatformEventToVersion } from "../event-protocol";
import type { PlatformEvent } from "../primitives";

describe("platform event versioning adapters", () => {
  it("adapts v1 execution payload to v2 canonical fields", () => {
    const v1: PlatformEvent = {
      eventId: "ev-v1",
      tenantId: "tenant-1",
      executionId: "exec-1",
      eventType: "execution.completed",
      eventVersion: 1,
      sequence: 1,
      occurredAt: "2026-01-01T00:00:00.000Z",
      source: "platform.tests",
      correlation: {
        correlationId: "corr-v1",
        tenantId: "tenant-1",
      },
      payload: {
        run_fingerprint: "fp-1",
      },
    };

    const v2 = adaptPlatformEventToVersion(v1, 2);
    expect(v2.eventVersion).toBe(2);
    expect(v2.payload.runFingerprint).toBe("fp-1");
    expect(v2.metadata?.adapter).toBe("platform_v1_to_v2");
  });
});
