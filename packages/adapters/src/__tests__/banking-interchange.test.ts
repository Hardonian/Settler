import { parseBai2File } from "../bai2";
import { parseCamt053Xml } from "../camt053";
import { auditInterchangeQualification } from "../l2-l3-optimizer";

describe("Advanced Banking & Interchange Adapters", () => {
  describe("BAI2 Cash Management Parser", () => {
    it("should parse file header, accounts, and normalize transactions to integer cents", () => {
      const sampleBai2 = `
01,CHASEUS33,CORPENTERPRISE,260910,2100,1,,,2/
02,CORP_RECON,CHASEUS33,1,260910,,USD,2/
03,123456789,USD,010,1000000,,,/
16,165,49000,0,REF1001,CUST8901,STRIPE PAYOUT BATCH 891/
16,495,12000,0,WIRE2002,CUST9902,VENDOR SETTLEMENT/
49,37000,4/
98,37000,1,6/
99,37000,1,8/
      `.trim();

      const parsed = parseBai2File(sampleBai2);

      expect(parsed.senderId).toBe("CHASEUS33");
      expect(parsed.receiverId).toBe("CORPENTERPRISE");
      expect(parsed.accounts).toHaveLength(1);

      const acct = parsed.accounts[0]!;
      expect(acct.accountNumber).toBe("123456789");
      expect(acct.currency).toBe("USD");
      expect(acct.transactions).toHaveLength(2);

      // Check credit (+49000 cents = $490.00)
      expect(acct.transactions[0]!.amountCents).toBe(49000);
      expect(acct.transactions[0]!.typeDescription).toBe("Preauthorized ACH Credit");

      // Check debit (-12000 cents = -$120.00)
      expect(acct.transactions[1]!.amountCents).toBe(-12000);
      expect(acct.transactions[1]!.typeDescription).toBe("Outgoing Wire Transfer");

      // Net movement: 49000 - 12000 = 37000 cents
      expect(parsed.totalNetMovementCents).toBe(37000);
    });
  });

  describe("ISO 20022 CAMT.053 XML Parser", () => {
    it("should extract statement metadata, balances, and entries with integer cents", () => {
      const sampleXml = `
<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.02">
  <BkToCstmrStmt>
    <Stmt>
      <Id>STMT-2026-SEP-019</Id>
      <CreDtTm>2026-09-10T20:00:00Z</CreDtTm>
      <Acct>
        <Id>
          <IBAN>GB33BARC20201555555555</IBAN>
        </Id>
      </Acct>
      <Bal>
        <Tp><CdOrPrtry><Cd>OPBD</Cd></CdOrPrtry></Tp>
        <Amt Ccy="EUR">5000.00</Amt>
      </Bal>
      <Bal>
        <Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp>
        <Amt Ccy="EUR">6490.00</Amt>
      </Bal>
      <Ntry>
        <Amt Ccy="EUR">1490.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <BookgDt><Dt>2026-09-10</Dt></BookgDt>
        <AcctSvcrRef>PAYPAL-SETTLE-8910</AcctSvcrRef>
        <NtryDtls>
          <TxDtls>
            <RmtInf>
              <Ustrd>ARN: 74582910492819284719283 - MERCHANT PAYOUT</Ustrd>
            </RmtInf>
          </TxDtls>
        </NtryDtls>
      </Ntry>
    </Stmt>
  </BkToCstmrStmt>
</Document>
      `.trim();

      const statements = parseCamt053Xml(sampleXml);

      expect(statements).toHaveLength(1);
      const stmt = statements[0]!;

      expect(stmt.statementId).toBe("STMT-2026-SEP-019");
      expect(stmt.accountIban).toBe("GB33BARC20201555555555");
      expect(stmt.openingBalanceCents).toBe(500000);
      expect(stmt.closingBalanceCents).toBe(649000);
      expect(stmt.entries).toHaveLength(1);

      const entry = stmt.entries[0]!;
      expect(entry.amountCents).toBe(149000);
      expect(entry.creditDebitIndicator).toBe("CRDT");
      expect(entry.acquirerReferenceNumber).toBe("74582910492819284719283");
    });
  });

  describe("Interchange Level 2/Level 3 Optimizer", () => {
    it("should detect Level 3 downgrade and calculate fee leakage", () => {
      const unoptimizedPayload = {
        transactionId: "trx_corp_89104",
        cardBrand: "VISA" as const,
        amountCents: 1000000, // $10,000.00
      };

      const audit = auditInterchangeQualification(unoptimizedPayload);

      expect(audit.qualifiedTier).toBe("STANDARD_DOWNGRADE_EIRF");
      expect(audit.targetTier).toBe("COMMERCIAL_LEVEL_3");
      expect(audit.effectiveRateBps).toBe(295);
      expect(audit.optimalRateBps).toBe(180);
      expect(audit.surchargePenaltyBps).toBe(115); // 115 bps penalty
      // 10,000.00 * 1.15% = $115.00 = 11,500 cents
      expect(audit.surchargeLeakageCents).toBe(11500);
      expect(audit.enrichmentReady).toBe(true);
      expect(audit.synthesizedEnrichment?.suggestedCommodityCode).toBe("43211500");
    });

    it("should qualify transaction as Level 3 when all line-item data is present", () => {
      const optimizedPayload = {
        transactionId: "trx_corp_89105",
        cardBrand: "VISA" as const,
        amountCents: 1000000,
        taxAmountCents: 82500,
        customerReference: "PO-99201",
        lineItems: [
          {
            productCode: "SKU-SVR-01",
            description: "Cloud Compute Instance 64GB",
            quantity: 1,
            unitPriceCents: 1000000,
            commodityCode: "43211500",
          },
        ],
      };

      const audit = auditInterchangeQualification(optimizedPayload);

      expect(audit.qualifiedTier).toBe("COMMERCIAL_LEVEL_3");
      expect(audit.surchargePenaltyBps).toBe(0);
      expect(audit.surchargeLeakageCents).toBe(0);
      expect(audit.enrichmentReady).toBe(false);
    });
  });
});
