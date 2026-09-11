export interface CustomerDisputeCommunication {
  communicationId: string;
  tenantId: string;
  customerOrMerchantId: string;
  transactionReference: string;
  amountCents: number;
  messageText: string;
  timestamp: string;
}

export type EscalationPriority = "P0_CRITICAL" | "P1_HIGH" | "P2_STANDARD";

export interface DisputeSentimentAssessment {
  communicationId: string;
  tenantId: string;
  priority: EscalationPriority;
  sentimentScore: number; // -1.0 (extremely hostile/urgent) to +1.0 (calm/satisfied)
  churnRisk: boolean;
  legalRisk: boolean;
  regulatoryRisk: boolean;
  triggeredKeywords: string[];
  recommendedSlaMinutes: number;
  quarantineRequired: boolean;
}

/**
 * Real-Time Sentiment & Dispute Escalation Scanner (#78)
 * Evaluates payment dispute communications and merchant escalations, scoring severity and risk.
 */
export class DisputeSentimentScanner {
  private static readonly REGULATORY_KEYWORDS = [
    "cfpb",
    "subpoena",
    "attorney general",
    "complaint",
    "fdic",
    "sec",
    "finra",
    "fca",
  ];
  private static readonly LEGAL_KEYWORDS = [
    "lawyer",
    "attorney",
    "legal action",
    "lawsuit",
    "arbitration",
    "sue",
    "breach of contract",
    "court",
  ];
  private static readonly HOSTILE_KEYWORDS = [
    "fraud",
    "scam",
    "stolen",
    "theft",
    "unauthorized",
    "chargeback immediately",
    "shameful",
    "unacceptable",
    "furious",
  ];

  public scan(comm: CustomerDisputeCommunication): DisputeSentimentAssessment {
    if (!comm.tenantId) {
      throw new Error("TenantId invariant violation: tenantId required for dispute sentiment scan");
    }

    const lower = comm.messageText.toLowerCase();
    const triggered: string[] = [];

    let regulatoryRisk = false;
    for (const kw of DisputeSentimentScanner.REGULATORY_KEYWORDS) {
      if (lower.includes(kw)) {
        regulatoryRisk = true;
        triggered.push(kw);
      }
    }

    let legalRisk = false;
    for (const kw of DisputeSentimentScanner.LEGAL_KEYWORDS) {
      if (lower.includes(kw)) {
        legalRisk = true;
        triggered.push(kw);
      }
    }

    let hostileCount = 0;
    for (const kw of DisputeSentimentScanner.HOSTILE_KEYWORDS) {
      if (lower.includes(kw)) {
        hostileCount++;
        triggered.push(kw);
      }
    }

    // High financial exposure (>$5,000 USD)
    const isLargeExposure = comm.amountCents >= 500000;

    let priority: EscalationPriority = "P2_STANDARD";
    let recommendedSlaMinutes = 1440; // 24 hours
    let quarantineRequired = false;

    if (
      regulatoryRisk ||
      (legalRisk && isLargeExposure) ||
      (hostileCount >= 2 && isLargeExposure)
    ) {
      priority = "P0_CRITICAL";
      recommendedSlaMinutes = 15;
      quarantineRequired = true;
    } else if (legalRisk || hostileCount >= 1 || isLargeExposure) {
      priority = "P1_HIGH";
      recommendedSlaMinutes = 120; // 2 hours
      quarantineRequired = isLargeExposure;
    }

    // Compute sentiment score
    let sentimentScore = 0.0;
    if (regulatoryRisk || legalRisk) {
      sentimentScore -= 0.6;
    }
    sentimentScore -= Math.min(0.4, hostileCount * 0.15);
    sentimentScore = Math.max(-1.0, Math.min(1.0, sentimentScore));

    const churnRisk = sentimentScore < -0.3 || legalRisk;

    return {
      communicationId: comm.communicationId,
      tenantId: comm.tenantId,
      priority,
      sentimentScore,
      churnRisk,
      legalRisk,
      regulatoryRisk,
      triggeredKeywords: Array.from(new Set(triggered)),
      recommendedSlaMinutes,
      quarantineRequired,
    };
  }
}
