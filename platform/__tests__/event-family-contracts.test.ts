import { describe, expect, it } from "vitest";
import { createPlatformEvent, validatePlatformEventContract } from "../event-protocol";

function expectValid(event: ReturnType<typeof createPlatformEvent>): void {
  const errors = validatePlatformEventContract(event);
  expect(errors).toEqual([]);
}

describe("event family contracts", () => {
  it("validates replay event contract", () => {
    const event = createPlatformEvent({
      eventId: "replay-1",
      tenantId: "tenant-a",
      executionId: "run-a",
      eventType: "replay.started",
      sequence: 1,
      source: "platform.tests",
      correlation: {
        correlationId: "corr-replay",
        tenantId: "tenant-a",
        runId: "run-a",
      },
      payload: { replayId: "rep-1", originalExecutionId: "run-o" },
    });
    expectValid(event);
    expect(event.payload.replayId).toBe("rep-1");
  });

  it("validates alert event contract", () => {
    const event = createPlatformEvent({
      eventId: "alert-1",
      tenantId: "tenant-a",
      executionId: "alert-1",
      eventType: "alert.created",
      sequence: 2,
      source: "platform.tests",
      severity: "warning",
      correlation: {
        correlationId: "corr-alert",
        tenantId: "tenant-a",
        alertId: "alert-1",
      },
      payload: { alertId: "alert-1", status: "open" },
    });
    expectValid(event);
    expect(event.correlation.alertId).toBe("alert-1");
  });

  it("validates webhook event contract", () => {
    const event = createPlatformEvent({
      eventId: "webhook-1",
      tenantId: "tenant-a",
      executionId: "run-a",
      eventType: "webhook.received",
      sequence: 3,
      source: "platform.tests",
      correlation: {
        correlationId: "corr-webhook",
        tenantId: "tenant-a",
        runId: "run-a",
      },
      payload: { provider: "stripe", deliveryId: "d1" },
    });
    expectValid(event);
    expect(event.payload.provider).toBe("stripe");
  });

  it("validates support event contract", () => {
    const event = createPlatformEvent({
      eventId: "support-1",
      tenantId: "tenant-a",
      executionId: "ticket-1",
      eventType: "support.issue.created",
      sequence: 4,
      source: "platform.tests",
      correlation: {
        correlationId: "corr-support",
        tenantId: "tenant-a",
        supportIssueId: "ticket-1",
        actorId: "user-1",
      },
      payload: { ticketId: "ticket-1", category: "integration" },
    });
    expectValid(event);
    expect(event.correlation.supportIssueId).toBe("ticket-1");
  });
});
