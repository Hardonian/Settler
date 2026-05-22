import { isValidMoney } from "../utils";

describe("isValidMoney", () => {
  describe("valid cases", () => {
    it("should return true for valid money object with positive value", () => {
      expect(isValidMoney({ value: 100, currency: "USD" })).toBe(true);
    });

    it("should return true for valid money object with zero value", () => {
      expect(isValidMoney({ value: 0, currency: "EUR" })).toBe(true);
    });

    it("should return true for valid money object with decimal value", () => {
      expect(isValidMoney({ value: 100.5, currency: "GBP" })).toBe(true);
    });
  });

  describe("invalid money object types", () => {
    it("should return false for null", () => {
      // @ts-expect-error Testing invalid input
      expect(isValidMoney(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      // @ts-expect-error Testing invalid input
      expect(isValidMoney(undefined)).toBe(false);
    });

    it("should return false for primitive types", () => {
      // @ts-expect-error Testing invalid input
      expect(isValidMoney(100)).toBe(false);
      // @ts-expect-error Testing invalid input
      expect(isValidMoney("100")).toBe(false);
      // @ts-expect-error Testing invalid input
      expect(isValidMoney(true)).toBe(false);
    });
  });

  describe("invalid value types and non-finite numbers", () => {
    it("should return false if value is missing", () => {
      // @ts-expect-error Testing invalid input
      expect(isValidMoney({ currency: "USD" })).toBe(false);
    });

    it("should return false if value is not a number", () => {
      // @ts-expect-error Testing invalid input
      expect(isValidMoney({ value: "100", currency: "USD" })).toBe(false);
      // @ts-expect-error Testing invalid input
      expect(isValidMoney({ value: null, currency: "USD" })).toBe(false);
    });

    it("should return false if value is NaN", () => {
      expect(isValidMoney({ value: NaN, currency: "USD" })).toBe(false);
    });

    it("should return false if value is Infinity", () => {
      expect(isValidMoney({ value: Infinity, currency: "USD" })).toBe(false);
    });

    it("should return false if value is -Infinity", () => {
      expect(isValidMoney({ value: -Infinity, currency: "USD" })).toBe(false);
    });
  });

  describe("negative values", () => {
    it("should return false for negative values", () => {
      expect(isValidMoney({ value: -100, currency: "USD" })).toBe(false);
      expect(isValidMoney({ value: -0.01, currency: "USD" })).toBe(false);
    });
  });

  describe("invalid currency", () => {
    it("should return false if currency is missing", () => {
      // @ts-expect-error Testing invalid input
      expect(isValidMoney({ value: 100 })).toBe(false);
    });

    it("should return false if currency is not a string", () => {
      // @ts-expect-error Testing invalid input
      expect(isValidMoney({ value: 100, currency: 123 })).toBe(false);
    });

    it("should return false if currency is empty", () => {
      expect(isValidMoney({ value: 100, currency: "" })).toBe(false);
    });

    it("should return false if currency length is not 3", () => {
      expect(isValidMoney({ value: 100, currency: "US" })).toBe(false);
      expect(isValidMoney({ value: 100, currency: "USDO" })).toBe(false);
    });

    it("should return false if currency contains lowercase characters", () => {
      expect(isValidMoney({ value: 100, currency: "usd" })).toBe(false);
      expect(isValidMoney({ value: 100, currency: "USd" })).toBe(false);
    });

    it("should return false if currency contains non-alphabetic characters", () => {
      expect(isValidMoney({ value: 100, currency: "US1" })).toBe(false);
      expect(isValidMoney({ value: 100, currency: "U-D" })).toBe(false);
    });
  });
});
