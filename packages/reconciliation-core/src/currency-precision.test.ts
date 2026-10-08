import {
  CURRENCY_EXPONENTS,
  getCurrencyExponent,
  toMinorUnits,
  amountsMatchWithinTolerance,
  parseDecimalToMinorUnits,
} from "./settlement-reconciliation";

describe("Currency-Specific Precision & Shared Engine Parity", () => {
  describe("getCurrencyExponent", () => {
    it("returns correct ISO 4217 exponents for known currencies", () => {
      expect(getCurrencyExponent("USD")).toBe(2);
      expect(getCurrencyExponent("EUR")).toBe(2);
      expect(getCurrencyExponent("GBP")).toBe(2);
      expect(getCurrencyExponent("CAD")).toBe(2);
      expect(getCurrencyExponent("CHF")).toBe(2);
      expect(getCurrencyExponent("JPY")).toBe(0);
      expect(getCurrencyExponent("BHD")).toBe(3);
      expect(getCurrencyExponent("KWD")).toBe(3);
    });

    it("normalizes lowercase and whitespace", () => {
      expect(getCurrencyExponent("  jpy ")).toBe(0);
      expect(getCurrencyExponent("bhd")).toBe(3);
      expect(getCurrencyExponent("usd")).toBe(2);
    });

    it("defaults to 2 decimal places for unlisted standard currencies", () => {
      expect(getCurrencyExponent("AUD")).toBe(2);
      expect(getCurrencyExponent("NZD")).toBe(2);
    });
  });

  describe("toMinorUnits", () => {
    it("converts 2-decimal currencies (USD) to cents", () => {
      expect(toMinorUnits("10.50", "USD")).toBe(1050n);
      expect(toMinorUnits(10.5, "USD")).toBe(1050n);
      expect(toMinorUnits("-5.25", "USD")).toBe(-525n);
      expect(toMinorUnits(-5.25, "USD")).toBe(-525n);
    });

    it("converts 0-decimal currencies (JPY) without fractional inflation", () => {
      expect(toMinorUnits("1500", "JPY")).toBe(1500n);
      expect(toMinorUnits(1500, "JPY")).toBe(1500n);
      expect(toMinorUnits("-250", "JPY")).toBe(-250n);
    });

    it("converts 3-decimal currencies (BHD, KWD) to fils", () => {
      expect(toMinorUnits("1.250", "BHD")).toBe(1250n);
      expect(toMinorUnits(1.25, "BHD")).toBe(1250n);
      expect(toMinorUnits("0.005", "KWD")).toBe(5n);
      expect(toMinorUnits(0.005, "KWD")).toBe(5n);
    });
  });

  describe("amountsMatchWithinTolerance IEEE 754 precision immunity", () => {
    it("resolves classic IEEE 754 0.1 + 0.2 drift cleanly", () => {
      const sum = 0.1 + 0.2; // 0.30000000000000004
      expect(sum === 0.3).toBe(false);
      // Canonical integer minor math handles it identically to exact 0.3:
      expect(amountsMatchWithinTolerance(sum, 0.3, 0, "USD")).toBe(true);
    });

    it("enforces exact currency-specific zero-tolerance matching", () => {
      // USD
      expect(amountsMatchWithinTolerance(100.0, 100.0, 0, "USD")).toBe(true);
      expect(amountsMatchWithinTolerance(100.0, 100.01, 0, "USD")).toBe(false);

      // JPY (0 decimals)
      expect(amountsMatchWithinTolerance(5000, 5000, 0, "JPY")).toBe(true);
      expect(amountsMatchWithinTolerance(5000, 5001, 0, "JPY")).toBe(false);

      // BHD (3 decimals)
      expect(amountsMatchWithinTolerance(12.345, 12.345, 0, "BHD")).toBe(true);
      expect(amountsMatchWithinTolerance(12.345, 12.346, 0, "BHD")).toBe(false);
    });

    it("honors fractional tolerance scaled to currency exponent", () => {
      // USD: tolerance 0.05
      expect(amountsMatchWithinTolerance(100.0, 100.05, 0.05, "USD")).toBe(true);
      expect(amountsMatchWithinTolerance(100.0, 100.06, 0.05, "USD")).toBe(false);

      // JPY: tolerance 5 yen
      expect(amountsMatchWithinTolerance(1000, 1005, 5, "JPY")).toBe(true);
      expect(amountsMatchWithinTolerance(1000, 1006, 5, "JPY")).toBe(false);

      // BHD: tolerance 0.002 BHD (2 fils)
      expect(amountsMatchWithinTolerance(1.0, 1.002, 0.002, "BHD")).toBe(true);
      expect(amountsMatchWithinTolerance(1.0, 1.003, 0.002, "BHD")).toBe(false);
    });
  });
});
