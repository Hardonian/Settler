import { isValidCurrency } from "../src/utils";

describe("Protocol Utilities - isValidCurrency", () => {
  it("should return true for valid 3-letter uppercase currency codes", () => {
    expect(isValidCurrency("USD")).toBe(true);
    expect(isValidCurrency("EUR")).toBe(true);
    expect(isValidCurrency("GBP")).toBe(true);
    expect(isValidCurrency("JPY")).toBe(true);
  });

  it("should return false for currency codes that are not 3 letters", () => {
    expect(isValidCurrency("US")).toBe(false);
    expect(isValidCurrency("USDD")).toBe(false);
    expect(isValidCurrency("U")).toBe(false);
  });

  it("should return false for lowercase or mixed case currency codes", () => {
    expect(isValidCurrency("usd")).toBe(false);
    expect(isValidCurrency("Usd")).toBe(false);
    expect(isValidCurrency("USd")).toBe(false);
  });

  it("should return false for strings containing invalid characters", () => {
    expect(isValidCurrency("US1")).toBe(false);
    expect(isValidCurrency("US!")).toBe(false);
    expect(isValidCurrency(" U ")).toBe(false);
    expect(isValidCurrency(" USD ")).toBe(false); // leading/trailing spaces
  });

  it("should return false for empty string", () => {
    expect(isValidCurrency("")).toBe(false);
  });

  it("should return false for null, undefined, or non-string inputs", () => {
    // We cast to any to test the runtime safety checks
    expect(isValidCurrency(null as any)).toBe(false);
    expect(isValidCurrency(undefined as any)).toBe(false);
    expect(isValidCurrency(123 as any)).toBe(false);
    expect(isValidCurrency({} as any)).toBe(false);
    expect(isValidCurrency([] as any)).toBe(false);
    expect(isValidCurrency(true as any)).toBe(false);
  });
});
