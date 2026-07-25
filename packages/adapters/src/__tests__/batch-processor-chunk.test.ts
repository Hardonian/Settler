import { chunk } from "../performance/batch-processor";

describe("chunk function", () => {
  it("returns an empty array when given an empty array", () => {
    expect(chunk([], 2)).toEqual([]);
  });

  it("chunks an array evenly when length is divisible by size", () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it("includes the remainder when length is not divisible by size", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns a single chunk when size equals array length", () => {
    expect(chunk([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
  });

  it("returns a single chunk when size is greater than array length", () => {
    expect(chunk([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
  });

  it("handles arrays with complex objects", () => {
    const obj1 = { id: 1 };
    const obj2 = { id: 2 };
    expect(chunk([obj1, obj2], 1)).toEqual([[obj1], [obj2]]);
  });

  it("rejects invalid chunk size", () => {
    expect(() => chunk([1, 2, 3], 0)).toThrow(/chunk size/);
    expect(() => chunk([1, 2, 3], -1)).toThrow(/chunk size/);
    expect(() => chunk([1, 2, 3], 1.5)).toThrow(/chunk size/);
    expect(() => chunk([1, 2, 3], Infinity)).toThrow(/chunk size/);
    expect(() => chunk([1, 2, 3], NaN)).toThrow(/chunk size/);
  });
});
