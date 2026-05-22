import { stableStringify, stableHash } from "../utils";
import crypto from "node:crypto";

describe("stableStringify", () => {
  it("stringifies primitive values", () => {
    expect(stableStringify(null)).toBe("null");
    expect(stableStringify(undefined)).toBe("null");
    expect(stableStringify(42)).toBe("42");
    expect(stableStringify("test")).toBe('"test"');
    expect(stableStringify(true)).toBe("true");
    expect(stableStringify(false)).toBe("false");
  });

  it("stringifies Date objects to ISO strings", () => {
    const date = new Date("2023-01-01T00:00:00.000Z");
    expect(stableStringify(date)).toBe('"2023-01-01T00:00:00.000Z"');
  });

  it("stringifies arrays containing mixed types", () => {
    const date = new Date("2023-01-01T00:00:00.000Z");
    const arr = [1, "test", null, undefined, date, { a: 1 }];
    expect(stableStringify(arr)).toBe('[1,"test",null,null,"2023-01-01T00:00:00.000Z",{"a":1}]');
  });

  it("sorts object keys alphabetically", () => {
    const obj1 = { b: 2, a: 1, c: 3 };
    const obj2 = { a: 1, c: 3, b: 2 };

    const expectedStr = '{"a":1,"b":2,"c":3}';
    expect(stableStringify(obj1)).toBe(expectedStr);
    expect(stableStringify(obj2)).toBe(expectedStr);
  });

  it("handles nested objects and sorts all keys at all levels", () => {
    const obj1 = {
      z: 1,
      x: { c: 3, a: 1, b: 2 },
      y: [ { b: 2, a: 1 } ]
    };
    const obj2 = {
      y: [ { a: 1, b: 2 } ],
      z: 1,
      x: { a: 1, b: 2, c: 3 }
    };

    const expectedStr = '{"x":{"a":1,"b":2,"c":3},"y":[{"a":1,"b":2}],"z":1}';
    expect(stableStringify(obj1)).toBe(expectedStr);
    expect(stableStringify(obj2)).toBe(expectedStr);
  });
});

describe("stableHash", () => {
  it("produces consistent SHA-256 hashes for the same object regardless of key order", () => {
    const obj1 = { foo: "bar", baz: "qux" };
    const obj2 = { baz: "qux", foo: "bar" };

    const hash1 = stableHash(obj1);
    const hash2 = stableHash(obj2);

    expect(hash1).toBe(hash2);

    // verify exact hash using node crypto to ensure correctness
    const expectedStringified = '{"baz":"qux","foo":"bar"}';
    const expectedHash = crypto.createHash("sha256").update(expectedStringified).digest("hex");
    expect(hash1).toBe(expectedHash);
  });

  it("produces consistent hashes for complex nested objects regardless of key order", () => {
    const date = new Date("2023-01-01T00:00:00.000Z");
    const obj1 = {
      user: { last: "Doe", first: "John" },
      roles: ["admin", "user"],
      active: true,
      createdAt: date
    };

    const obj2 = {
      createdAt: date,
      active: true,
      roles: ["admin", "user"],
      user: { first: "John", last: "Doe" }
    };

    expect(stableHash(obj1)).toBe(stableHash(obj2));
  });

  it("produces different hashes for different values", () => {
    expect(stableHash({ a: 1 })).not.toBe(stableHash({ a: 2 }));
    expect(stableHash({ a: 1 })).not.toBe(stableHash({ b: 1 }));
    expect(stableHash([1, 2])).not.toBe(stableHash([2, 1]));
  });
});
