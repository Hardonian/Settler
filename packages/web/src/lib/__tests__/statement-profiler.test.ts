import {
  profileStatement,
  detectStatementFormat,
  sniffDelimiter,
} from "../ingest/statement-profiler";

describe("Statement Profiler & Pre-Validator", () => {
  it("detects CSV format, auto-maps columns, and computes exact integer cents volume", async () => {
    const csvContent = `date,amount,currency,description,reference
2026-09-01,150.25,USD,Stripe Payout,PAY-001
2026-09-02,300.00,USD,Stripe Payout,PAY-002
2026-09-03,-15.50,USD,Processing Fee,FEE-001`;

    expect(sniffDelimiter(["a,b,c", "1,2,3"])).toBe(",");
    expect(sniffDelimiter(["a;b;c", "1;2;3"])).toBe(";");
    expect(sniffDelimiter(["a\tb\tc", "1\t2\t3"])).toBe("\t");

    const profile = await profileStatement(csvContent);
    expect(profile.format).toBe("csv");
    expect(profile.delimiter).toBe(",");
    expect(profile.rowCount).toBe(3);
    expect(profile.creditCount).toBe(2);
    expect(profile.debitCount).toBe(1);
    expect(profile.totalCreditMinorUnits).toBe(45025); // 150.25 + 300.00
    expect(profile.totalDebitMinorUnits).toBe(1550); // 15.50
    expect(profile.netMinorUnits).toBe(43475);
    expect(profile.currencies).toEqual(["USD"]);
    expect(profile.dateRange.earliest).toBe("2026-09-01");
    expect(profile.dateRange.latest).toBe("2026-09-03");
    expect(profile.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(profile.isReadyForReconciliation).toBe(true);
    expect(profile.previewRows).toHaveLength(3);
  });

  it("detects malformed numbers and duplicate rows as actionable anomalies", async () => {
    const malformedCsv = `Date,Amount,Reference
2026-09-01,100.00,REF-1
2026-09-01,NOT_A_NUMBER,REF-2
2026-09-01,100.00,REF-1`;

    const profile = await profileStatement(malformedCsv);
    expect(profile.isReadyForReconciliation).toBe(false);
    expect(profile.anomalies.length).toBeGreaterThanOrEqual(2);

    const malformedAnomaly = profile.anomalies.find((a) => a.type === "malformed_amount");
    expect(malformedAnomaly).toBeDefined();
    expect(malformedAnomaly?.rowNumber).toBe(3);

    const dupAnomaly = profile.anomalies.find((a) => a.type === "duplicate_signature");
    expect(dupAnomaly).toBeDefined();
    expect(dupAnomaly?.rowNumber).toBe(4);
  });

  it("auto-detects and profiles SWIFT MT940 statements", async () => {
    const mt940Sample = `:20:SETTLER-2026
:25:DE89370400440532013000
:60F:C260901EUR50000,00
:61:2609020902C1250,50NTRFCUST-TX-101//BANK-REF-901
:86:Stripe Net Settlement
:61:2609030903D50,00NTRFFEE//BANK-FEE
:62F:C260903EUR51200,50
-}`;

    expect(detectStatementFormat(mt940Sample)).toBe("mt940");
    const profile = await profileStatement(mt940Sample);
    expect(profile.format).toBe("mt940");
    expect(profile.rowCount).toBe(2);
    expect(profile.creditCount).toBe(1);
    expect(profile.debitCount).toBe(1);
    expect(profile.totalCreditMinorUnits).toBe(125050);
    expect(profile.totalDebitMinorUnits).toBe(5000);
    expect(profile.currencies).toContain("EUR");
    expect(profile.isReadyForReconciliation).toBe(true);
  });

  it("auto-detects and profiles ISO 20022 CAMT.053 XML statements", async () => {
    const camtXml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.02">
  <BkToCstmrStmt>
    <Stmt>
      <Id>STMT-01</Id>
      <Ntry>
        <Amt Ccy="EUR">4500.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <BookgDt><Dt>2026-09-15</Dt></BookgDt>
        <AcctSvcrRef>STRIPE-PAYOUT-1</AcctSvcrRef>
      </Ntry>
    </Stmt>
  </BkToCstmrStmt>
</Document>`;

    expect(detectStatementFormat(camtXml)).toBe("camt053");
    const profile = await profileStatement(camtXml);
    expect(profile.format).toBe("camt053");
    expect(profile.rowCount).toBe(1);
    expect(profile.totalCreditMinorUnits).toBe(450000);
    expect(profile.currencies).toContain("EUR");
    expect(profile.isReadyForReconciliation).toBe(true);
  });

  it("handles empty files gracefully", async () => {
    const profile = await profileStatement("");
    expect(profile.rowCount).toBe(0);
    expect(profile.isReadyForReconciliation).toBe(false);
    expect(profile.anomalies[0]?.type).toBe("empty_file");
  });
});
