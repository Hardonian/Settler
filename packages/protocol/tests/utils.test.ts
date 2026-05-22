import { deepClone } from "../src/utils";

describe("deepClone", () => {
  it("should deep clone a simple object", () => {
    const obj = { a: 1, b: "two", c: true };
    const cloned = deepClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj);
  });

  it("should deep clone nested objects", () => {
    const obj = { a: { b: { c: 1 } } };
    const cloned = deepClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned.a).not.toBe(obj.a);
    expect(cloned.a.b).not.toBe(obj.a.b);
  });

  it("should deep clone arrays", () => {
    const arr = [1, [2, 3], { a: 4 }];
    const cloned = deepClone(arr);
    expect(cloned).toEqual(arr);
    expect(cloned).not.toBe(arr);
    expect(cloned[1]).not.toBe(arr[1]);
    expect(cloned[2]).not.toBe(arr[2]);
  });

  it("should deep clone dates", () => {
    const date = new Date();
    const cloned = deepClone(date);
    expect(cloned).toEqual(date);
    expect(cloned).not.toBe(date);
  });

  it("should return primitive values as is", () => {
    expect(deepClone(1)).toBe(1);
    expect(deepClone("string")).toBe("string");
    expect(deepClone(true)).toBe(true);
    expect(deepClone(null)).toBe(null);
    expect(deepClone(undefined)).toBe(undefined);
  });

  it("should properly deep clone a DAG (Directed Acyclic Graph) without throwing", () => {
    const child = { value: 42 };
    const obj = { a: child, b: child };

    const cloned = deepClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned.a).toEqual(child);
    expect(cloned.b).toEqual(child);
    expect(cloned.a).not.toBe(child);
    // In a WeakSet delete-based approach, it will create two different copies of child
    expect(cloned.a).not.toBe(cloned.b);
  });

  it("should properly deep clone an array with repeating references", () => {
    const child = { value: 42 };
    const arr = [child, child, child];

    const cloned = deepClone(arr);
    expect(cloned).toEqual(arr);
    expect(cloned[0]).not.toBe(child);
  });

  it("should throw a RangeError when encountering circular references", () => {
    const obj: any = { a: 1 };
    obj.b = obj; // Create circular reference

    expect(() => deepClone(obj)).toThrow(RangeError);
  });
});
