import { ClockSkewCompensator } from "../clock-skew";

describe("Multi-Rail Clock Skew Compensation", () => {
  it("records offset samples and accurately computes median clock skew", () => {
    const compensator = new ClockSkewCompensator();
    const baseTime = 1757548800000; // Fixed epoch ms

    // Simulate 5 samples with +3200ms skew on Stripe
    for (let i = 0; i < 5; i++) {
      compensator.recordSample({
        sourceRail: "stripe",
        sourceTimestamp: baseTime + 3200 + i * 10,
        receivedAt: baseTime + i * 10,
      });
    }

    const estimate = compensator.estimateSkew("stripe");
    expect(estimate.sampleCount).toBe(5);
    expect(estimate.medianOffsetMs).toBe(3200);
    expect(estimate.driftStatus).toBe("compensated");
  });

  it("normalizes external timestamp and subtracts estimated skew", () => {
    const compensator = new ClockSkewCompensator();
    const receiptTime = new Date("2026-09-10T12:00:00.000Z");
    const skewedSourceTime = new Date("2026-09-10T12:00:05.000Z"); // +5000ms ahead

    compensator.recordSample({
      sourceRail: "paypal",
      sourceTimestamp: skewedSourceTime,
      receivedAt: receiptTime,
    });

    const eventData = { transactionId: "tx_paypal_99" };
    const normalized = compensator.normalizeTimestamp("paypal", skewedSourceTime, eventData);

    expect(new Date(normalized.normalizedTimestamp).toISOString()).toBe(receiptTime.toISOString());
    expect(normalized.offsetAppliedMs).toBe(5000);
    expect(normalized.isOrderingParadoxResolved).toBe(false);
  });

  it("resolves temporal ordering paradox when clearing appears before preceding authorization", () => {
    const compensator = new ClockSkewCompensator();
    const authTime = "2026-09-10T12:00:02.000Z";
    // Clearing event with residual clock drift that would place it at 12:00:01 (before auth!)
    const clearingTime = "2026-09-10T12:00:01.500Z";

    const normalized = compensator.normalizeTimestamp(
      "ach",
      clearingTime,
      { type: "clearing" },
      { precedingEventTimestamp: authTime }
    );

    expect(normalized.isOrderingParadoxResolved).toBe(true);
    // Must be clamped to authTime + 1ms
    expect(new Date(normalized.normalizedTimestamp).getTime()).toBe(
      new Date(authTime).getTime() + 1
    );
  });

  it("flags SLA breach when clock drift exceeds max allowed tolerance (e.g. 180s)", () => {
    const compensator = new ClockSkewCompensator({ maxAllowedSkewMs: 180_000 });
    const receiptTime = 1757548800000;
    const extremeDriftTime = receiptTime + 250_000; // 250s drift!

    compensator.recordSample({
      sourceRail: "chase_bai2",
      sourceTimestamp: extremeDriftTime,
      receivedAt: receiptTime,
    });

    const estimate = compensator.estimateSkew("chase_bai2");
    expect(estimate.driftStatus).toBe("sla_breach");
  });
});
