import { chunk } from "../performance/batch-processor";

describe("batch-processor chunk function", () => {
  it("chunks an array perfectly divided by size", () => {
    const result = chunk([1, 2, 3, 4], 2);
    expect(result).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it("chunks an array with a remainder", () => {
    const result = chunk([1, 2, 3, 4, 5], 2);
    expect(result).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("handles an empty array", () => {
    const result = chunk([], 3);
    expect(result).toEqual([]);
  });

  it("handles a chunk size larger than the array", () => {
    const result = chunk([1, 2], 5);
    expect(result).toEqual([[1, 2]]);
  });

  it("handles chunk size of 1", () => {
    const result = chunk([1, 2, 3], 1);
    expect(result).toEqual([[1], [2], [3]]);
  });

  it("rejects invalid size (0)", () => {
    expect(() => chunk([1, 2, 3], 0)).toThrow(/chunk size must be a finite integer >= 1/);
  });

  it("rejects negative size", () => {
    expect(() => chunk([1, 2, 3], -1)).toThrow(/chunk size must be a finite integer >= 1/);
  });

  it("rejects non-integer size", () => {
    expect(() => chunk([1, 2, 3], 1.5)).toThrow(/chunk size must be a finite integer >= 1/);
  });
});
