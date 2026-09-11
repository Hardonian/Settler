import { describe, it, expect } from "vitest";
import { DisputeSentimentScanner } from "../dispute-sentiment-scanner";

describe("DisputeSentimentScanner", () => {
  const scanner = new DisputeSentimentScanner();

  it("escalates regulatory keywords to P0_CRITICAL with 15-minute SLA", () => {
    const assessment = scanner.scan({
      communicationId: "comm-001",
      tenantId: "tenant-acme",
      customerOrMerchantId: "cust-9001",
      transactionReference: "ch_stripe_9921",
      amountCents: 125000,
      messageText: "I have filed a complaint with the CFPB regarding this unauthorized debit!",
      timestamp: "2026-09-11T12:00:00Z",
    });

    expect(assessment.priority).toBe("P0_CRITICAL");
    expect(assessment.regulatoryRisk).toBe(true);
    expect(assessment.recommendedSlaMinutes).toBe(15);
    expect(assessment.quarantineRequired).toBe(true);
    expect(assessment.triggeredKeywords).toContain("cfpb");
  });

  it("escalates high amount with lawyer threat to P0_CRITICAL", () => {
    const assessment = scanner.scan({
      communicationId: "comm-002",
      tenantId: "tenant-acme",
      customerOrMerchantId: "cust-9002",
      transactionReference: "ch_stripe_9922",
      amountCents: 850000, // $8,500
      messageText: "My lawyer will be in touch if you do not reverse this theft immediately!",
      timestamp: "2026-09-11T12:05:00Z",
    });

    expect(assessment.priority).toBe("P0_CRITICAL");
    expect(assessment.legalRisk).toBe(true);
    expect(assessment.churnRisk).toBe(true);
  });

  it("assigns standard priority to benign inquiries", () => {
    const assessment = scanner.scan({
      communicationId: "comm-003",
      tenantId: "tenant-acme",
      customerOrMerchantId: "cust-9003",
      transactionReference: "ch_stripe_9923",
      amountCents: 3500, // $35
      messageText: "Could you please send me a receipt for my monthly subscription?",
      timestamp: "2026-09-11T12:10:00Z",
    });

    expect(assessment.priority).toBe("P2_STANDARD");
    expect(assessment.regulatoryRisk).toBe(false);
    expect(assessment.legalRisk).toBe(false);
  });
});
