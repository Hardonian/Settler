import {
  validateIban,
  parseSepaInstantMessage,
  reconcileSepaInstantBatch,
  type SepaInstantMessage,
} from "../sepa-instant";

describe("SEPA Instant Credit Transfer Pipeline (pacs.008)", () => {
  describe("validateIban", () => {
    it("validates legitimate IBANs with valid Mod-97 checksums", () => {
      // Standard valid European test IBANs
      expect(validateIban("DE89370400440532013000")).toBe(true); // Germany Deutsche Bank
      expect(validateIban("FR1420041010050500013M02606")).toBe(true); // France BNP Paribas
      expect(validateIban("NL91ABNA0417164300")).toBe(true); // Netherlands ABN AMRO
    });

    it("rejects invalid IBAN checksums or corrupted lengths", () => {
      expect(validateIban("DE89370400440532013009")).toBe(false); // Corrupted check digit
      expect(validateIban("FR1420041010050500013M02607")).toBe(false);
      expect(validateIban("INVALID_IBAN")).toBe(false);
      expect(validateIban("DE123")).toBe(false); // Too short
    });
  });

  describe("parseSepaInstantMessage", () => {
    it("parses valid pacs.008 message and generates RFC 6962 SHA-256 leaf hash", () => {
      const parsed = parseSepaInstantMessage({
        msgId: "MSG-2026-SCT-001",
        instId: "INST-88899",
        e2eId: "E2E-ORD-90210",
        dbtrIban: "DE89370400440532013000",
        dbtrBic: "DBEUDEDDXXX",
        dbtrNm: "Hans Mueller",
        cdtrIban: "NL91ABNA0417164300",
        cdtrBic: "ABNANL2AXXX",
        cdtrNm: "Acme European Sales BV",
        amtEur: 499.5,
        sttlmDt: "2026-09-10T12:00:00Z",
        rmtInf: "INV-2026-0042",
      });

      expect(parsed.amountCents).toBe(49950n);
      expect(parsed.currency).toBe("EUR");
      expect(parsed.status).toBe("ACCP");
      expect(parsed.rawLeafHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("rejects messages with invalid IBANs or non-positive amounts", () => {
      expect(() =>
        parseSepaInstantMessage({
          msgId: "MSG-ERR",
          instId: "INST-ERR",
          e2eId: "E2E-ERR",
          dbtrIban: "INVALID_IBAN",
          dbtrBic: "BIC",
          dbtrNm: "Name",
          cdtrIban: "NL91ABNA0417164300",
          cdtrBic: "BIC",
          cdtrNm: "Name",
          amtEur: 100,
          sttlmDt: "2026-09-10T12:00:00Z",
        })
      ).toThrow(/Invalid Debtor IBAN/);
    });
  });

  describe("reconcileSepaInstantBatch", () => {
    it("reconciles transfers with merchant orders and generates batch Merkle root", () => {
      const transfer1 = parseSepaInstantMessage({
        msgId: "MSG-1",
        instId: "INST-1",
        e2eId: "ORD-101",
        dbtrIban: "DE89370400440532013000",
        dbtrBic: "DBEUDEDDXXX",
        dbtrNm: "Buyer 1",
        cdtrIban: "NL91ABNA0417164300",
        cdtrBic: "ABNANL2AXXX",
        cdtrNm: "Merchant",
        amtEur: 150.0,
        sttlmDt: "2026-09-10T12:00:00Z",
      });

      const transfer2 = parseSepaInstantMessage({
        msgId: "MSG-2",
        instId: "INST-2",
        e2eId: "ORD-102",
        dbtrIban: "FR1420041010050500013M02606",
        dbtrBic: "BNPAFR2AXXX",
        dbtrNm: "Buyer 2",
        cdtrIban: "NL91ABNA0417164300",
        cdtrBic: "ABNANL2AXXX",
        cdtrNm: "Merchant",
        amtEur: 299.99,
        sttlmDt: "2026-09-10T12:01:00Z",
      });

      const orders = [
        { orderId: "ord_db_1", referenceNumber: "ORD-101", expectedAmountCents: 15000n },
        { orderId: "ord_db_2", referenceNumber: "ORD-102", expectedAmountCents: 29999n },
        { orderId: "ord_db_3", referenceNumber: "ORD-103", expectedAmountCents: 5000n },
      ];

      const result = reconcileSepaInstantBatch([transfer1, transfer2], orders);

      expect(result.matchedCount).toBe(2);
      expect(result.unmatchedOrdersCount).toBe(1);
      expect(result.unmatchedTransfersCount).toBe(0);
      expect(result.merkleBatchRoot).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});
