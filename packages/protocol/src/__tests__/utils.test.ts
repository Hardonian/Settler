import { validateTransactionId } from "../utils";

describe("validateTransactionId", () => {
  it("should return true for valid transaction IDs", () => {
    expect(validateTransactionId("valid-id")).toBe(true);
    expect(validateTransactionId("Valid_ID_123")).toBe(true);
    expect(validateTransactionId("1234567890")).toBe(true);
    expect(validateTransactionId("a")).toBe(true); // min length
    expect(validateTransactionId("a".repeat(255))).toBe(true); // max length
  });

  it("should return false for invalid characters", () => {
    expect(validateTransactionId("invalid id")).toBe(false); // contains space
    expect(validateTransactionId("invalid!id")).toBe(false); // contains exclamation mark
    expect(validateTransactionId("invalid@id")).toBe(false); // contains at symbol
    expect(validateTransactionId("invalid/id")).toBe(false); // contains slash
  });

  it("should return false for empty strings", () => {
    expect(validateTransactionId("")).toBe(false);
  });

  it("should return false for strings exceeding max length", () => {
    expect(validateTransactionId("a".repeat(256))).toBe(false);
  });

  it("should return false for non-string inputs", () => {
    // @ts-expect-error Testing invalid type input
    expect(validateTransactionId(null)).toBe(false);
    // @ts-expect-error Testing invalid type input
    expect(validateTransactionId(undefined)).toBe(false);
    // @ts-expect-error Testing invalid type input
    expect(validateTransactionId(123)).toBe(false);
    // @ts-expect-error Testing invalid type input
    expect(validateTransactionId({})).toBe(false);
    // @ts-expect-error Testing invalid type input
    expect(validateTransactionId([])).toBe(false);
    // @ts-expect-error Testing invalid type input
    expect(validateTransactionId(true)).toBe(false);
  });
});
