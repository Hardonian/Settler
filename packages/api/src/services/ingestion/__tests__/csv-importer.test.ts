/**
 * CSV Importer Tests
 * Contract tests for CSV import functionality
 */

import {
  parseCSV,
  autoDetectColumnMapping,
  normalizeCSVRow,
  validateMapping,
} from "../csv-importer";
import { CSVColumnMapping } from "../types";

describe("CSV Importer", () => {
  const sampleCSV = `Date,Description,Amount,Currency,Transaction ID,Category,Payment Method
2024-01-15,Stripe Payment - Customer #1234,1250.50,USD,txn_abc123,payment,stripe
2024-01-16,Shopify Order #5678,89.99,USD,ord_xyz789,sale,shopify`;

  describe("parseCSV", () => {
    it("should parse CSV content correctly", () => {
      const result = parseCSV(sampleCSV);

      expect(result.headers).toEqual([
        "Date",
        "Description",
        "Amount",
        "Currency",
        "Transaction ID",
        "Category",
        "Payment Method",
      ]);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toHaveProperty("Date", "2024-01-15");
      expect(result.rows[0]).toHaveProperty("Amount", 1250.5);
    });

    it("should handle empty CSV", () => {
      expect(() => parseCSV("")).toThrow("CSV file is empty");
    });
  });

  describe("autoDetectColumnMapping", () => {
    it("should detect common column names", () => {
      const headers = [
        "Date",
        "Description",
        "Amount",
        "Currency",
        "Transaction ID",
      ];
      const mapping = autoDetectColumnMapping(headers);

      expect(mapping.date).toBe("Date");
      expect(mapping.description).toBe("Description");
      expect(mapping.amount).toBe("Amount");
      expect(mapping.currency).toBe("Currency");
      expect(mapping.externalId).toBe("Transaction ID");
    });

    it("should handle alternative column names", () => {
      const headers = ["Transaction Date", "Memo", "Total", "CCY", "Ref"];
      const mapping = autoDetectColumnMapping(headers);

      expect(mapping.date).toBe("Transaction Date");
      expect(mapping.description).toBe("Memo");
      expect(mapping.amount).toBe("Total");
      expect(mapping.currency).toBe("CCY");
      expect(mapping.externalId).toBe("Ref");
    });
  });

  describe("validateMapping", () => {
    it("should validate complete mapping", () => {
      const mapping: CSVColumnMapping = {
        amount: "Amount",
        date: "Date",
      };
      const result = validateMapping(mapping);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject missing required fields", () => {
      const mapping: CSVColumnMapping = {
        amount: "Amount",
        // Missing date
      };
      const result = validateMapping(mapping);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Date column mapping is required");
    });
  });

  describe("normalizeCSVRow", () => {
    it("should normalize CSV row to transaction format", () => {
      const row = {
        Date: "2024-01-15",
        Description: "Test Payment",
        Amount: 1250.5,
        Currency: "USD",
        "Transaction ID": "txn_123",
      };
      const mapping: CSVColumnMapping = {
        date: "Date",
        description: "Description",
        amount: "Amount",
        currency: "Currency",
        externalId: "Transaction ID",
      };

      const normalized = normalizeCSVRow(row, mapping);

      expect(normalized.amount).toBe(1250.5);
      expect(normalized.currency).toBe("USD");
      expect(normalized.date).toBeInstanceOf(Date);
      expect(normalized.description).toBe("Test Payment");
      expect(normalized.externalId).toBe("txn_123");
    });

    it("should default currency to USD", () => {
      const row = {
        Date: "2024-01-15",
        Amount: 100,
      };
      const mapping: CSVColumnMapping = {
        date: "Date",
        amount: "Amount",
      };

      const normalized = normalizeCSVRow(row, mapping);

      expect(normalized.currency).toBe("USD");
    });

    it("should handle negative amounts", () => {
      const row = {
        Date: "2024-01-15",
        Amount: -100,
      };
      const mapping: CSVColumnMapping = {
        date: "Date",
        amount: "Amount",
      };

      const normalized = normalizeCSVRow(row, mapping);

      expect(normalized.amount).toBe(100); // Always positive
    });

    it("should throw error for missing required fields", () => {
      const row = {
        Description: "Test",
        Amount: 100,
        // Missing date
      };
      const mapping: CSVColumnMapping = {
        date: "Date",
        amount: "Amount",
      };

      expect(() => normalizeCSVRow(row, mapping)).toThrow();
    });
  });
});
