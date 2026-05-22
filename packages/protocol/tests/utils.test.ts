import { isValidMoney } from "../src/utils";
import { Money } from "../src/index";

describe("isValidMoney", () => {
  it("should return false for null or undefined", () => {
    expect(isValidMoney(null as any)).toBe(false);
    expect(isValidMoney(undefined as any)).toBe(false);
  });

  it("should return false for non-object types", () => {
    expect(isValidMoney("10.00" as any)).toBe(false);
    expect(isValidMoney(10.0 as any)).toBe(false);
    expect(isValidMoney(true as any)).toBe(false);
  });

  it("should return false for missing or invalid value field", () => {
    expect(isValidMoney({ currency: "USD" } as any)).toBe(false);
    expect(isValidMoney({ value: "10", currency: "USD" } as any)).toBe(false);
    expect(isValidMoney({ value: NaN, currency: "USD" } as any)).toBe(false);
    expect(isValidMoney({ value: Infinity, currency: "USD" } as any)).toBe(false);
    expect(isValidMoney({ value: -Infinity, currency: "USD" } as any)).toBe(false);
  });

  it("should return false for negative amounts", () => {
    expect(isValidMoney({ value: -10, currency: "USD" } as Money)).toBe(false);
    expect(isValidMoney({ value: -0.01, currency: "USD" } as Money)).toBe(false);
  });

  it("should return false for invalid currency codes", () => {
    expect(isValidMoney({ value: 10, currency: "" } as Money)).toBe(false);
    expect(isValidMoney({ value: 10, currency: "US" } as Money)).toBe(false);
    expect(isValidMoney({ value: 10, currency: "USDT" } as Money)).toBe(false);
    expect(isValidMoney({ value: 10, currency: "usd" } as Money)).toBe(false);
    expect(isValidMoney({ value: 10, currency: "123" } as Money)).toBe(false);
  });

  it("should return true for valid money amounts", () => {
    expect(isValidMoney({ value: 0, currency: "USD" } as Money)).toBe(true);
    expect(isValidMoney({ value: 10, currency: "USD" } as Money)).toBe(true);
    expect(isValidMoney({ value: 10.5, currency: "EUR" } as Money)).toBe(true);
    expect(isValidMoney({ value: 9999999.99, currency: "JPY" } as Money)).toBe(true);
  });
});
