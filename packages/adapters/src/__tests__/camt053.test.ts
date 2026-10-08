import { parseCamt053Xml } from "../camt053";

describe("ISO 20022 CAMT.053 Statement Parser", () => {
  it("parses bank statement XML into structured records with integer cents", () => {
    const camtXmlSample = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.02">
  <BkToCstmrStmt>
    <Stmt>
      <Id>STMT-2026-EUR-001</Id>
      <CreDtTm>2026-09-15T08:30:00Z</CreDtTm>
      <Acct>
        <Id>
          <IBAN>FR7630006000011234567890189</IBAN>
        </Id>
      </Acct>
      <Bal>
        <Tp>
          <CdOrPrtry>
            <Cd>OPBD</Cd>
          </CdOrPrtry>
        </Tp>
        <Amt Ccy="EUR">100000.50</Amt>
      </Bal>
      <Ntry>
        <Amt Ccy="EUR">4520.75</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <BookgDt>
          <Dt>2026-09-15</Dt>
        </BookgDt>
        <AcctSvcrRef>STRIPE-PAYOUT-7890</AcctSvcrRef>
        <NtryDtls>
          <TxDtls>
            <RmtInf>
              <Ustrd>Stripe Batch Settlement Payout ARN: 12345678901234567890123</Ustrd>
            </RmtInf>
          </TxDtls>
        </NtryDtls>
        <BkTxCd>
          <Prtry>
            <Cd>MSC</Cd>
          </Prtry>
        </BkTxCd>
      </Ntry>
      <Ntry>
        <Amt Ccy="EUR">120.00</Amt>
        <CdtDbtInd>DBIT</CdtDbtInd>
        <BookgDt>
          <Dt>2026-09-15</Dt>
        </BookgDt>
        <AcctSvcrRef>BANK-FEE-001</AcctSvcrRef>
        <NtryDtls>
          <TxDtls>
            <RmtInf>
              <Ustrd>Monthly wire handling fee</Ustrd>
            </RmtInf>
          </TxDtls>
        </NtryDtls>
      </Ntry>
      <Bal>
        <Tp>
          <CdOrPrtry>
            <Cd>CLBD</Cd>
          </CdOrPrtry>
        </Tp>
        <Amt Ccy="EUR">104401.25</Amt>
      </Bal>
    </Stmt>
  </BkToCstmrStmt>
</Document>`;

    const statements = parseCamt053Xml(camtXmlSample);
    expect(statements).toHaveLength(1);

    const stmt = statements[0]!;
    expect(stmt.statementId).toBe("STMT-2026-EUR-001");
    expect(stmt.accountIban).toBe("FR7630006000011234567890189");
    expect(stmt.currency).toBe("EUR");
    expect(stmt.openingBalanceCents).toBe(10000050);
    expect(stmt.closingBalanceCents).toBe(10440125);
    expect(stmt.entries).toHaveLength(2);

    const [entry1, entry2] = stmt.entries;
    expect(entry1!.creditDebitIndicator).toBe("CRDT");
    expect(entry1!.amountCents).toBe(452075);
    expect(entry1!.currency).toBe("EUR");
    expect(entry1!.bookingDate).toBe("2026-09-15");
    expect(entry1!.entryReference).toBe("STRIPE-PAYOUT-7890");
    expect(entry1!.acquirerReferenceNumber).toBe("12345678901234567890123");
    expect(entry1!.proprietaryCode).toBe("MSC");

    expect(entry2!.creditDebitIndicator).toBe("DBIT");
    expect(entry2!.amountCents).toBe(12000);
    expect(entry2!.bookingDate).toBe("2026-09-15");
    expect(entry2!.entryReference).toBe("BANK-FEE-001");

    expect(stmt.totalCreditCents).toBe(452075);
    expect(stmt.totalDebitCents).toBe(12000);
  });

  it("handles empty statements gracefully without errors", () => {
    const emptyXml = `<Document><BkToCstmrStmt></BkToCstmrStmt></Document>`;
    const statements = parseCamt053Xml(emptyXml);
    expect(statements).toHaveLength(0);
  });
});
