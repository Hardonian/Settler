/**
 * CSV Importer Tests
 * Contract tests for CSV import functionality
 */

import {
  parseCSV,
  autoDetectColumnMapping,
  normalizeCSVRow,
  validateMapping,
  buildImportWorkbenchPreview,
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
      const headers = ["Date", "Description", "Amount", "Currency", "Transaction ID"];
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

      expect(normalized.amount).toBe(100);
    });

    it("should throw error for missing required fields", () => {
      const row = {
        Description: "Test",
        Amount: 100,
      };
      const mapping: CSVColumnMapping = {
        date: "Date",
        amount: "Amount",
      };

      expect(() => normalizeCSVRow(row, mapping)).toThrow();
    });
  });

  describe("buildImportWorkbenchPreview", () => {
    it("should produce preview diagnostics and normalized sample records", () => {
      const parsed = parseCSV(sampleCSV);
      const preview = buildImportWorkbenchPreview({
        fileName: "sample.csv",
        fileSizeBytes: Buffer.byteLength(sampleCSV),
        headers: parsed.headers,
        rows: parsed.rows,
      });

      expect(preview.canProceed).toBe(true);
      expect(preview.normalization.normalizedRows).toBe(2);
      expect(preview.normalization.failedRows).toBe(0);
      expect(preview.normalization.sampleNormalizedRecords).toHaveLength(2);
      expect(preview.mapping.requiredMissing).toHaveLength(0);
      expect(preview.qualityGates.find((g) => g.gate === "required_mapping_present")?.passed).toBe(
        true
      );
    });

    it("should block when required mappings are missing", () => {
      const csv = `Memo,Total\nSubscription payment,100`;
      const parsed = parseCSV(csv);

      const preview = buildImportWorkbenchPreview({
        fileName: "bad.csv",
        fileSizeBytes: Buffer.byteLength(csv),
        headers: parsed.headers,
        rows: parsed.rows,
      });

      expect(preview.canProceed).toBe(false);
      expect(preview.mapping.requiredMissing).toContain("date");
      expect(
        preview.diagnostics.some((d) => d.code === "required_mapping_missing" && d.field === "date")
      ).toBe(true);
    });

    it("should include remediation hints and contract metadata for blocking diagnostics", () => {
      const csv = `Memo,Total
Subscription payment,100`;
      const parsed = parseCSV(csv);

      const preview = buildImportWorkbenchPreview({
        fileName: "bad.csv",
        fileSizeBytes: Buffer.byteLength(csv),
        headers: parsed.headers,
        rows: parsed.rows,
      });

      const missingDateDiagnostic = preview.diagnostics.find(
        (d) => d.code === "required_mapping_missing" && d.field === "date"
      );
      expect(missingDateDiagnostic?.remediation).toBeDefined();
      expect(preview.contract.schemaUri).toContain(
        "contracts/ingestion/import-workbench.schema.json"
      );
      expect(preview.contract.version).toBe("1.0.0");
    });

    it("should surface ambiguous slash date warnings", () => {
      const csv = `Date,Amount\n01/02/2024,125.00`;
      const parsed = parseCSV(csv);

      const preview = buildImportWorkbenchPreview({
        fileName: "ambiguous.csv",
        fileSizeBytes: Buffer.byteLength(csv),
        headers: parsed.headers,
        rows: parsed.rows,
      });

      expect(preview.canProceed).toBe(true);
      expect(preview.normalization.failedRows).toBe(1);
      expect(
        preview.diagnostics.some((d) => d.code === "ambiguous_date" && d.severity === "warning")
      ).toBe(true);
      expect(
        preview.qualityGates.find((g) => g.gate === "normalization_success_ratio")?.passed
      ).toBe(false);
    });
  });
});
