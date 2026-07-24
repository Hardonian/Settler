import { deduplicate } from "../performance/batch-processor";

describe("deduplicate", () => {
  it("should return an empty array when given an empty array", () => {
    expect(deduplicate([], (x) => x)).toEqual([]);
  });

  it("should return the same array when there are no duplicates", () => {
    const input = [1, 2, 3];
    expect(deduplicate(input, (x) => String(x))).toEqual([1, 2, 3]);
  });

  it("should remove consecutive duplicates", () => {
    const input = [1, 1, 2, 2, 3];
    expect(deduplicate(input, (x) => String(x))).toEqual([1, 2, 3]);
  });

  it("should remove non-consecutive duplicates", () => {
    const input = [1, 2, 1, 3, 2];
    expect(deduplicate(input, (x) => String(x))).toEqual([1, 2, 3]);
  });

  it("should preserve the order of the first occurrences", () => {
    const input = [3, 1, 2, 1, 3];
    expect(deduplicate(input, (x) => String(x))).toEqual([3, 1, 2]);
  });

  it("should correctly deduplicate complex objects based on the key function", () => {
    const input = [
      { id: "a", value: 1 },
      { id: "b", value: 2 },
      { id: "a", value: 3 },
    ];
    const result = deduplicate(input, (item) => item.id);
    expect(result).toEqual([
      { id: "a", value: 1 },
      { id: "b", value: 2 },
    ]);
  });

  it("should not mutate the original array", () => {
    const input = [1, 1, 2];
    const originalInput = [...input];
    deduplicate(input, (x) => String(x));
    expect(input).toEqual(originalInput);
  });
});
