import { sanitizeTransactionMetadata } from "../utils";

describe("sanitizeTransactionMetadata", () => {
  it("should return undefined for falsy or non-object inputs", () => {
    expect(sanitizeTransactionMetadata(undefined)).toBeUndefined();
    expect(sanitizeTransactionMetadata(null as any)).toBeUndefined();
    expect(sanitizeTransactionMetadata("string" as any)).toBeUndefined();
    expect(sanitizeTransactionMetadata(123 as any)).toBeUndefined();
    expect(sanitizeTransactionMetadata(true as any)).toBeUndefined();
  });

  it("should sanitize keys properly", () => {
    const input = {
      "safeKey": "value",
      "<script>alert(1)</script>": "value",
      "javascript:alert(1)": "value",
      "onclick=alert(1)": "value"
    };

    const result = sanitizeTransactionMetadata(input);

    expect(result).toBeDefined();
    expect(result).toHaveProperty("safeKey");
    expect(result).not.toHaveProperty("<script>alert(1)</script>");
    expect(result).toHaveProperty("scriptalert(1)/script");
    expect(result).not.toHaveProperty("javascript:alert(1)");
    expect(result).toHaveProperty("alert(1)");
    expect(result).not.toHaveProperty("onclick=alert(1)");
    expect(result).toHaveProperty("alert(1)");
  });

  it("should sanitize string values properly", () => {
    const input = {
      key1: "safe value",
      key2: "<script>alert(1)</script>",
      key3: "javascript:alert(1)",
      key4: "onclick=alert(1)"
    };

    const result = sanitizeTransactionMetadata(input);

    expect(result).toBeDefined();
    expect(result?.key1).toBe("safe value");
    expect(result?.key2).toBe("scriptalert(1)/script");
    expect(result?.key3).toBe("alert(1)");
    expect(result?.key4).toBe("alert(1)");
  });

  it("should allow number, boolean, and null values", () => {
    const input = {
      num: 123,
      boolTrue: true,
      boolFalse: false,
      nullVal: null
    };

    const result = sanitizeTransactionMetadata(input);

    expect(result).toBeDefined();
    expect(result?.num).toBe(123);
    expect(result?.boolTrue).toBe(true);
    expect(result?.boolFalse).toBe(false);
    expect(result?.nullVal).toBeNull();
  });

  it("should ignore object, array, and undefined values", () => {
    const input = {
      obj: { nested: "value" },
      arr: [1, 2, 3],
      undef: undefined,
      func: () => {}
    };

    const result = sanitizeTransactionMetadata(input);

    expect(result).toBeDefined();
    expect(result).not.toHaveProperty("obj");
    expect(result).not.toHaveProperty("arr");
    expect(result).not.toHaveProperty("undef");
    expect(result).not.toHaveProperty("func");
  });

  it("should skip empty sanitized keys", () => {
    const input = {
      "<>": "value",
      "javascript:": "value"
    };

    const result = sanitizeTransactionMetadata(input);

    expect(result).toBeDefined();
    expect(Object.keys(result || {})).toHaveLength(0);
  });
});
