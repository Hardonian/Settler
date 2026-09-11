import {
  calculateRfc6962LeafHash,
  calculateRfc6962NodeHash,
  evaluateBatchThreats,
  evaluateReplayCollisions,
  evaluateTransactionThreat,
  type TransactionThreatContext,
} from "./threat-recognition-engine.js";

describe("Threat Recognition Engine", () => {
  const TENANT_A = "tenant_enterprise_alpha";
  const TENANT_B = "tenant_adversary_beta";

  it("enforces tenant isolation and flags cross-tenant injection attempts with systemic severity", () => {
    const maliciousTx: TransactionThreatContext = {
      id: "tx_malicious_001",
      tenantId: TENANT_B, // Foreign tenant
      rail: "stripe",
      amountCents: 500000n, // $5,000.00
      currency: "USD",
      timestamp: new Date().toISOString(),
    };

    const threat = evaluateTransactionThreat(maliciousTx, { activeTenantId: TENANT_A });
    expect(threat).not.toBeNull();
    expect(threat?.threatType).toBe("CROSS_TENANT_LEAK_ATTEMPT");
    expect(threat?.severity).toBe("critical");
    expect(threat?.blastRadius).toBe("systemic");
    expect(threat?.capitalAtRiskCents).toBe(500000n);
    expect(threat?.mitigationStatus).toBe("quarantined");
    expect(threat?.evidenceMerkleLeaf).toMatch(/^[a-f0-9]{64}$/);
  });

  it("detects chargeback double-dipping where both merchant refund and dispute clawback occurred", () => {
    const doubleDipTx: TransactionThreatContext = {
      id: "tx_dd_002",
      tenantId: TENANT_A,
      rail: "stripe",
      amountCents: 125000n, // $1,250.00
      currency: "USD",
      timestamp: new Date().toISOString(),
      arn: "23948572019284758192837",
      hasMerchantRefund: true,
      hasDisputeClawback: true,
    };

    const threat = evaluateTransactionThreat(doubleDipTx, { activeTenantId: TENANT_A });
    expect(threat).not.toBeNull();
    expect(threat?.threatType).toBe("CHARGEBACK_DOUBLE_DIP");
    expect(threat?.severity).toBe("critical");
    expect(threat?.remediation.action).toBe("auto_clawback");
    expect(threat?.remediation.clawbackDossierId).toBeDefined();
    expect(threat?.capitalAtRiskCents).toBe(125000n);
  });

  it("identifies processor fee creep exceeding contract schedule", () => {
    // Contract: 290 bps (2.9%) + 30 cents. Amount: $1,000.00 (100,000 cents)
    // Expected fee: 2,900 + 30 = 2,930 cents ($29.30)
    // Actual fee charged: $35.00 (3,500 cents) -> excess: 570 cents (57 bps over)
    const feeCreepTx: TransactionThreatContext = {
      id: "tx_creep_003",
      tenantId: TENANT_A,
      rail: "stripe",
      amountCents: 100000n,
      feeCents: 3500n,
      currency: "USD",
      timestamp: new Date().toISOString(),
      contractedRateBps: 290,
      contractedFixedFeeCents: 30n,
    };

    const threat = evaluateTransactionThreat(feeCreepTx, {
      activeTenantId: TENANT_A,
      feeCreepToleranceBps: 5,
    });

    expect(threat).not.toBeNull();
    expect(threat?.threatType).toBe("FEE_CREEP_ANOMALY");
    expect(threat?.severity).toBe("high");
    expect(threat?.capitalAtRiskCents).toBe(570n);
  });

  it("detects undisclosed FX spread markup above ECB benchmark tolerance", () => {
    // Applied rate 1.1250, Benchmark 1.0800 -> spread ~416 bps
    const fxTx: TransactionThreatContext = {
      id: "tx_fx_004",
      tenantId: TENANT_A,
      rail: "paypal",
      amountCents: 250000n, // €2,500.00
      currency: "USD",
      originalCurrency: "EUR",
      appliedExchangeRate: 1.125,
      benchmarkExchangeRate: 1.08,
      timestamp: new Date().toISOString(),
    };

    const threat = evaluateTransactionThreat(fxTx, {
      activeTenantId: TENANT_A,
      fxSpreadToleranceBps: 15,
    });

    expect(threat).not.toBeNull();
    expect(threat?.threatType).toBe("UNDISCLOSED_FX_SPREAD");
    expect(threat?.capitalAtRiskCents).toBeGreaterThan(0n);
  });

  it("flags ghost subscription recurring charges on canceled accounts", () => {
    const ghostTx: TransactionThreatContext = {
      id: "tx_ghost_005",
      tenantId: TENANT_A,
      rail: "stripe",
      amountCents: 9900n, // $99.00
      currency: "USD",
      timestamp: new Date().toISOString(),
      subscriptionStatus: "canceled",
      subscriptionCanceledAt: "2026-08-01T00:00:00Z",
    };

    const threat = evaluateTransactionThreat(ghostTx, { activeTenantId: TENANT_A });
    expect(threat).not.toBeNull();
    expect(threat?.threatType).toBe("GHOST_SUBSCRIPTION_LEAK");
    expect(threat?.severity).toBe("high");
    expect(threat?.remediation.action).toBe("auto_clawback");
  });

  it("flags Level 2/3 interchange downgrades on corporate cards missing tax & commodity codes", () => {
    const l2l3Tx: TransactionThreatContext = {
      id: "tx_comm_006",
      tenantId: TENANT_A,
      rail: "card_interchange",
      amountCents: 800000n, // $8,000.00
      currency: "USD",
      timestamp: new Date().toISOString(),
      cardCommercialType: "corporate",
      hasLevel2Data: false,
      hasLevel3Data: false,
    };

    const threat = evaluateTransactionThreat(l2l3Tx, { activeTenantId: TENANT_A });
    expect(threat).not.toBeNull();
    expect(threat?.threatType).toBe("INTERCHANGE_DOWNGRADE_LEAK");
    expect(threat?.remediation.action).toBe("enrich_l3_data");
    // Penalty ~125 bps on 800,000 cents = 10,000 cents ($100.00)
    expect(threat?.capitalAtRiskCents).toBe(10000n);
  });

  it("detects idempotency collisions and replay attacks within sliding window", () => {
    const batch: TransactionThreatContext[] = [
      {
        id: "tx_orig_007",
        tenantId: TENANT_A,
        rail: "stripe",
        amountCents: 15000n,
        currency: "USD",
        timestamp: "2026-09-10T12:00:00Z",
        idempotencyKey: "idem_uuid_84920485",
      },
      {
        id: "tx_replay_008",
        tenantId: TENANT_A,
        rail: "stripe",
        amountCents: 15000n,
        currency: "USD",
        timestamp: "2026-09-10T12:00:04Z",
        idempotencyKey: "idem_uuid_84920485", // Colliding key
      },
    ];

    const replayThreats = evaluateReplayCollisions(batch, TENANT_A);
    expect(replayThreats.length).toBe(1);
    expect(replayThreats[0]?.threatType).toBe("REPLAY_ATTACK_COLLISION");
    expect(replayThreats[0]?.severity).toBe("high");
    expect(replayThreats[0]?.remediation.action).toBe("reject_and_quarantine");
  });

  it("evaluates a full batch and produces RFC 6962 SHA-256 Merkle root", () => {
    const batch: TransactionThreatContext[] = [
      {
        id: "tx_clean_1",
        tenantId: TENANT_A,
        rail: "stripe",
        amountCents: 10000n,
        currency: "USD",
        timestamp: new Date().toISOString(),
      },
      {
        id: "tx_ghost_2",
        tenantId: TENANT_A,
        rail: "stripe",
        amountCents: 4900n,
        currency: "USD",
        timestamp: new Date().toISOString(),
        subscriptionStatus: "canceled",
      },
      {
        id: "tx_creep_3",
        tenantId: TENANT_A,
        rail: "stripe",
        amountCents: 100000n,
        feeCents: 4000n, // $40 fee on $1,000 (400 bps vs 290 baseline)
        contractedRateBps: 290,
        contractedFixedFeeCents: 30n,
        currency: "USD",
        timestamp: new Date().toISOString(),
      },
    ];

    const report = evaluateBatchThreats(batch, { tenantId: TENANT_A });
    expect(report.threatsDetectedCount).toBe(2);
    expect(report.totalCapitalGuardedCents).toBeGreaterThan(0n);
    expect(report.merkleStateRoot).toMatch(/^[a-f0-9]{64}$/);
  });
});
