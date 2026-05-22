import { sanitizeTransactionMetadata } from "../src/utils";

describe("sanitizeTransactionMetadata", () => {
  it("should return undefined if metadata is falsy or not an object", () => {
    expect(sanitizeTransactionMetadata()).toBeUndefined();
    expect(sanitizeTransactionMetadata(null as any)).toBeUndefined();
    expect(sanitizeTransactionMetadata("string" as any)).toBeUndefined();
    expect(sanitizeTransactionMetadata(123 as any)).toBeUndefined();
  });

  it("should sanitize keys by removing dangerous characters", () => {
    const input = {
      "<script>alert(1)</script>": "value",
      "javascript:alert(1)": "value",
      "onclick=alert(1)": "value",
      normal_key: "value",
    };

    const result = sanitizeTransactionMetadata(input);

    expect(result).toBeDefined();
    if (result) {
      expect(result).toHaveProperty("scriptalert(1)/script", "value");
      expect(result).toHaveProperty("alert(1)", "value");
      expect(result).toHaveProperty("normal_key", "value");
    }
  });

  it("should skip empty sanitized keys", () => {
    const input = {
      "<>": "value1", // Sanitizes to empty string
      normal: "value2",
    };

    const result = sanitizeTransactionMetadata(input);

    expect(result).toEqual({ normal: "value2" });
  });

  it("should sanitize string values", () => {
    const input = {
      key1: "<script>alert('xss')</script>",
      key2: "javascript:void(0)",
      key3: "onclick=doSomething()",
      key4: "safe value",
    };

    const result = sanitizeTransactionMetadata(input);

    expect(result).toEqual({
      key1: "scriptalert('xss')/script",
      key2: "void(0)",
      key3: "doSomething()",
      key4: "safe value",
    });
  });

  it("should preserve numbers and booleans", () => {
    const input = {
      number: 123,
      float: 123.45,
      zero: 0,
      boolTrue: true,
      boolFalse: false,
    };

    const result = sanitizeTransactionMetadata(input);

    expect(result).toEqual(input);
  });

  it("should preserve null values", () => {
    const input = {
      nullKey: null,
    };

    const result = sanitizeTransactionMetadata(input);

    expect(result).toEqual(input);
  });

  it("should skip objects and arrays for security", () => {
    const input = {
      nestedObject: { a: 1 },
      array: [1, 2, 3],
      normalKey: "value",
    };

    const result = sanitizeTransactionMetadata(input);

    expect(result).toEqual({ normalKey: "value" });
  });
});
