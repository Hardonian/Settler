import {
  autoDetectColumnMapping,
  normalizeCSVRow,
  parseCSV,
} from "../../services/ingestion/csv-importer";

describe("csv importer hardening", () => {
  it("fails on empty input", () => {
    expect(() => parseCSV("   \n\n")).toThrow(/CSV file is empty/i);
  });

  it("fails on duplicate headers", () => {
    const csv = "Amount,amount,Date\n10.00,10.00,2026-01-01\n";
    expect(() => parseCSV(csv)).toThrow(/duplicate headers/i);
  });

  it("fails on malformed/truncated rows", () => {
    const csv = 'Amount,Date,Description\n"11.10,2026-01-01,broken\n';
    expect(() => parseCSV(csv)).toThrow(/CSV parsing failed/i);
  });

  it("trims headers and rows for valid CSV", () => {
    const csv = " Amount , Date , Description \n 12.00 , 2026-01-01 , Settled \n";
    const parsed = parseCSV(csv);
    expect(parsed.headers).toEqual(["Amount", "Date", "Description"]);
    expect(parsed.rows[0]).toMatchObject({
      Amount: 12,
      Date: "2026-01-01",
      Description: "Settled",
    });
  });

  it("rejects ambiguous slash dates during normalization", () => {
    const mapping = autoDetectColumnMapping(["amount", "date", "description"]);
    expect(() =>
      normalizeCSVRow(
        {
          amount: "10.00",
          date: "01/02/2026",
          description: "ambiguous",
        },
        mapping
      )
    ).toThrow(/Invalid date format/i);
  });

  it("accepts unambiguous slash dates during normalization", () => {
    const mapping = autoDetectColumnMapping(["amount", "date", "description"]);
    const normalized = normalizeCSVRow(
      {
        amount: "10.00",
        date: "13/02/2026",
        description: "unambiguous",
      },
      mapping
    );

    expect(normalized.amount).toBe(10);
    expect(normalized.date).toBeInstanceOf(Date);
  });
});
