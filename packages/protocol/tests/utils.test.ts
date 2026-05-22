import { deepClone } from "../src/utils";

describe("deepClone Date edge cases", () => {
  it("should deep clone a valid Date object", () => {
    const originalDate = new Date("2023-01-01T00:00:00Z");
    const clonedDate = deepClone(originalDate);

    // Should not be the exact same instance
    expect(clonedDate).not.toBe(originalDate);
    // Should have the same time value
    expect(clonedDate.getTime()).toBe(originalDate.getTime());
    // Should still be a Date instance
    expect(clonedDate instanceof Date).toBe(true);
  });

  it("should handle invalid dates correctly", () => {
    const originalInvalidDate = new Date("invalid date string");
    const clonedInvalidDate = deepClone(originalInvalidDate);

    // Should not be the exact same instance
    expect(clonedInvalidDate).not.toBe(originalInvalidDate);
    // Should have the same time value (NaN)
    expect(Number.isNaN(clonedInvalidDate.getTime())).toBe(true);
    // Should still be a Date instance
    expect(clonedInvalidDate instanceof Date).toBe(true);
  });

  it("should handle Date inside an object", () => {
    const original = { date: new Date("2023-01-01T00:00:00Z") };
    const cloned = deepClone(original);

    expect(cloned.date).not.toBe(original.date);
    expect(cloned.date.getTime()).toBe(original.date.getTime());
  });

  it("should handle Date inside an array", () => {
    const original = [new Date("2023-01-01T00:00:00Z")];
    const cloned = deepClone(original);

    expect(cloned[0]).not.toBeUndefined();
    expect(original[0]).not.toBeUndefined();
    expect(cloned[0]).not.toBe(original[0]);
    // We assert it's a date to fix TS issues
    expect((cloned[0] as Date).getTime()).toBe((original[0] as Date).getTime());
  });
});
