import { stableHash } from "./utils";

describe("stableHash", () => {
  it("should produce the same hash for objects with same properties in different order", () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { b: 2, a: 1 };
    expect(stableHash(obj1)).toBe(stableHash(obj2));
  });

  it("should hash primitive values correctly", () => {
    expect(stableHash("test")).toBe(stableHash("test"));
    expect(stableHash(123)).toBe(stableHash(123));
    expect(stableHash(true)).toBe(stableHash(true));
    expect(stableHash(null)).toBe(stableHash(null));
    expect(stableHash(undefined)).toBe(stableHash(undefined));
  });

  it("should hash arrays deterministically", () => {
    const arr1 = [1, 2, { a: 1, b: 2 }];
    const arr2 = [1, 2, { b: 2, a: 1 }];
    expect(stableHash(arr1)).toBe(stableHash(arr2));

    const arr3 = [1, 2, 3];
    const arr4 = [3, 2, 1];
    expect(stableHash(arr1)).not.toBe(stableHash(arr3)); // Different content
    expect(stableHash(arr3)).not.toBe(stableHash(arr4)); // Arrays are ordered
  });

  it("should handle nested objects", () => {
    const obj1 = { a: { c: 3, d: 4 }, b: 2 };
    const obj2 = { b: 2, a: { d: 4, c: 3 } };
    expect(stableHash(obj1)).toBe(stableHash(obj2));
  });

  it("should handle Date objects deterministically", () => {
    const date = new Date("2023-01-01T00:00:00Z");
    const obj1 = { d: date, a: 1 };
    const obj2 = { a: 1, d: new Date("2023-01-01T00:00:00Z") };
    expect(stableHash(obj1)).toBe(stableHash(obj2));
  });
});
