import { parseFedNowMessage, reconcileFedNowSettlement } from "../fednow";

describe("FedNow Instant Payment Reconciliation Pipeline", () => {
  const tenantId = "tenant_fednow_test";

  const xmlSample = `
<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>FEDNOW-MSG-20260910-001</MsgId>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <EndToEndId>E2E-ORD-90210</EndToEndId>
        <TxId>TX-FED-44332211</TxId>
        <ClrSysRef>CLR-FED-998877</ClrSysRef>
      </PmtId>
      <IntrBkSttlmAmt Ccy="USD">1425.50</IntrBkSttlmAmt>
      <IntrBkSttlmDtTm>2026-09-10T22:30:00.123Z</IntrBkSttlmDtTm>
      <DbtrAgt>
        <FinInstnId><ClrSysMmbId><MmbId>121000358</MmbId></ClrSysMmbId></FinInstnId>
      </DbtrAgt>
      <CdtrAgt>
        <FinInstnId><ClrSysMmbId><MmbId>021000021</MmbId></ClrSysMmbId></FinInstnId>
      </CdtrAgt>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>
`.trim();

  it("fails fast if tenantId is missing", () => {
    expect(() => parseFedNowMessage("", xmlSample)).toThrow(/Tenant isolation invariant violation/);
  });

  it("parses FedNow ISO 20022 pacs.008 XML with sub-second timestamps and exact integer cents", () => {
    const msg = parseFedNowMessage(tenantId, xmlSample);

    expect(msg.tenantId).toBe(tenantId);
    expect(msg.messageId).toBe("FEDNOW-MSG-20260910-001");
    expect(msg.endToEndId).toBe("E2E-ORD-90210");
    expect(msg.transactionId).toBe("TX-FED-44332211");
    expect(msg.clearingSystemRef).toBe("CLR-FED-998877");
    expect(msg.amountCents).toBe(142550);
    expect(msg.currency).toBe("USD");
    expect(msg.debtorRouting).toBe("121000358");
    expect(msg.creditorRouting).toBe("021000021");
    expect(msg.status).toBe("ACTC");
    expect(msg.leafHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("reconciles FedNow settlement message against internal order in real time", () => {
    const msg = parseFedNowMessage(tenantId, xmlSample);
    const expectedOrders = [
      {
        orderId: "ORDER-US-90210",
        endToEndId: "E2E-ORD-90210",
        amountCents: 142550,
        createdAt: "2026-09-10T22:29:59.800Z",
      },
    ];

    const match = reconcileFedNowSettlement(tenantId, msg, expectedOrders);
    expect(match).not.toBeNull();
    expect(match!.orderId).toBe("ORDER-US-90210");
    expect(match!.matchedCents).toBe(142550);
    expect(match!.isDeterministicMatch).toBe(true);
    expect(match!.latencyMs).toBe(323); // 123ms - (-200ms) = 323ms sub-second transit latency
    expect(match!.leafHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
