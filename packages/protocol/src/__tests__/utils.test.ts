import { isValidISODate } from "../utils";

describe("isValidISODate", () => {
  it("should return true for a valid ISO 8601 date string", () => {
    expect(isValidISODate("2023-01-01T12:00:00.000Z")).toBe(true);
  });

  it("should return false for an invalid ISO 8601 date string", () => {
    expect(isValidISODate("2023-01-01 12:00:00")).toBe(false);
  });

  it("should return false for a non-existent date", () => {
    expect(isValidISODate("2023-02-29T12:00:00.000Z")).toBe(false); // Not a leap year
  });

  it("should return false for an empty string", () => {
    expect(isValidISODate("")).toBe(false);
  });

  it("should return false for non-string inputs", () => {
    expect(isValidISODate(null as any)).toBe(false);
    expect(isValidISODate(undefined as any)).toBe(false);
    expect(isValidISODate(123 as any)).toBe(false);
    expect(isValidISODate({} as any)).toBe(false);
  });

  it("should return false for strings with invalid formats", () => {
    expect(isValidISODate("invalid")).toBe(false);
    expect(isValidISODate("2023-13-01T12:00:00.000Z")).toBe(false);
  });
});
