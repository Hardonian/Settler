import { stableStringify, stableHash } from "../src/utils";

describe("stableStringify", () => {
  it("should stringify simple objects deterministically", () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { b: 2, a: 1 };
    expect(stableStringify(obj1)).toBe(stableStringify(obj2));
    expect(stableStringify(obj1)).toBe('{"a":1,"b":2}');
  });

  it("should handle nested objects deterministically", () => {
    const obj1 = { a: { c: 3, b: 2 }, d: 4 };
    const obj2 = { d: 4, a: { b: 2, c: 3 } };
    expect(stableStringify(obj1)).toBe(stableStringify(obj2));
    expect(stableStringify(obj1)).toBe('{"a":{"b":2,"c":3},"d":4}');
  });

  it("should handle arrays deterministically", () => {
    const arr1 = [1, { c: 3, b: 2 }, 3];
    const arr2 = [1, { b: 2, c: 3 }, 3];

    // Arrays themselves should keep their element order
    expect(stableStringify(arr1)).toBe(stableStringify(arr2));
    expect(stableStringify(arr1)).toBe('[1,{"b":2,"c":3},3]');

    // Arrays with different element order should not match
    const arr3 = [{ b: 2, c: 3 }, 1, 3];
    expect(stableStringify(arr1)).not.toBe(stableStringify(arr3));
  });

  it("should handle null and undefined", () => {
    expect(stableStringify(null)).toBe("null");
    expect(stableStringify(undefined)).toBe("null");
    expect(stableStringify({ a: undefined, b: null })).toBe('{"a":null,"b":null}');
  });

  it("should handle Date objects", () => {
    const date = new Date("2023-01-01T00:00:00.000Z");
    expect(stableStringify(date)).toBe('"2023-01-01T00:00:00.000Z"');
    expect(stableStringify({ date })).toBe('{"date":"2023-01-01T00:00:00.000Z"}');
  });

  it("should handle primitive types", () => {
    expect(stableStringify("string")).toBe('"string"');
    expect(stableStringify(42)).toBe("42");
    expect(stableStringify(true)).toBe("true");
    expect(stableStringify(false)).toBe("false");
  });

  it("should handle edge cases like NaN and Infinity", () => {
    expect(stableStringify(NaN)).toBe("null");
    expect(stableStringify(Infinity)).toBe("null");
    expect(stableStringify(-Infinity)).toBe("null");
  });

  it("should handle unsupported types like Maps and Sets gracefully", () => {
    expect(stableStringify(new Map([["a", 1]]))).toBe("{}");
    expect(stableStringify(new Set([1, 2]))).toBe("{}");
  });

  it("should ignore symbols and functions", () => {
    expect(stableStringify(Symbol("test"))).toBeUndefined();
    expect(stableStringify(function () {})).toBeUndefined();
    expect(stableStringify({ a: Symbol("test"), b: () => {}, c: 1 })).toBe('{"c":1}');
  });

  it("should handle complex deeply nested edge cases", () => {
    const complexObj1 = {
      z: 1,
      a: [{ c: 3, b: 2 }, null, undefined, new Date("2023-01-01T00:00:00.000Z")],
      m: {
        y: NaN,
        x: Infinity,
      },
    };

    const complexObj2 = {
      a: [{ b: 2, c: 3 }, null, undefined, new Date("2023-01-01T00:00:00.000Z")],
      m: {
        x: Infinity,
        y: NaN,
      },
      z: 1,
    };

    expect(stableStringify(complexObj1)).toBe(stableStringify(complexObj2));
    expect(stableStringify(complexObj1)).toBe(
      '{"a":[{"b":2,"c":3},null,null,"2023-01-01T00:00:00.000Z"],"m":{"x":null,"y":null},"z":1}'
    );
  });
});

describe("stableHash", () => {
  it("should generate same hash for same content", () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { b: 2, a: 1 };
    expect(stableHash(obj1)).toBe(stableHash(obj2));
  });

  it("should generate different hash for different content", () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, b: 3 };
    expect(stableHash(obj1)).not.toBe(stableHash(obj2));
  });

  it("should consistently hash edge cases", () => {
    expect(stableHash(null)).toBe(stableHash(undefined));
    expect(stableHash({ a: undefined })).toBe(stableHash({ a: null }));
  });
});
