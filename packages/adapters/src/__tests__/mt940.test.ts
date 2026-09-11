import { parseMt940, parseMt940Amount } from "../mt940";

describe("MT940 Statement Parser", () => {
  it("correctly parses SWIFT amounts with commas into integer cents without float drift", () => {
    expect(parseMt940Amount("1250,50")).toBe(125050);
    expect(parseMt940Amount("0,05")).toBe(5);
    expect(parseMt940Amount("1000000,00")).toBe(100000000);
    expect(parseMt940Amount("14.99")).toBe(1499);
  });

  it("parses a standard MT940 statement with opening/closing balances and statement lines", () => {
    const mt940Sample = `
:20:SETTLER-STMT-2026-09
:25:DE89370400440532013000
:28C:00042/001
:60F:C260901EUR50000,00
:61:2609020902C1500,25NTRFCUST-TX-1001//BANK-REF-9001
:86:Stripe Net Batch Settlement Payout
:61:2609030903D250,00NTRFPAYPAL-DISPUTE//RESERVE-HOLD-11
:86:Quarantined Chargeback Reserve
:62F:C260903EUR51250,25
-}`;

    const statements = parseMt940(mt940Sample);
    expect(statements).toHaveLength(1);

    const stmt = statements[0]!;
    expect(stmt.transactionReference).toBe("SETTLER-STMT-2026-09");
    expect(stmt.accountIdentification).toBe("DE89370400440532013000");
    expect(stmt.statementNumber).toBe("00042/001");
    expect(stmt.currency).toBe("EUR");
    expect(stmt.openingBalanceCents).toBe(5000000);
    expect(stmt.closingBalanceCents).toBe(5125025);
    expect(stmt.entries).toHaveLength(2);

    const [entry1, entry2] = stmt.entries;
    expect(entry1!.creditDebitIndicator).toBe("CRDT");
    expect(entry1!.amountCents).toBe(150025);
    expect(entry1!.customerReference).toBe("CUST-TX-1001");
    expect(entry1!.bankReference).toBe("BANK-REF-9001");
    expect(entry1!.narrative).toBe("Stripe Net Batch Settlement Payout");
    expect(entry1!.leafHash).toMatch(/^[a-f0-9]{64}$/);

    expect(entry2!.creditDebitIndicator).toBe("DBIT");
    expect(entry2!.amountCents).toBe(25000);
    expect(entry2!.customerReference).toBe("PAYPAL-DISPUTE");
    expect(entry2!.bankReference).toBe("RESERVE-HOLD-11");
    expect(entry2!.narrative).toBe("Quarantined Chargeback Reserve");
    expect(entry2!.leafHash).toMatch(/^[a-f0-9]{64}$/);

    expect(stmt.totalCreditCents).toBe(150025);
    expect(stmt.totalDebitCents).toBe(25000);
  });
});
