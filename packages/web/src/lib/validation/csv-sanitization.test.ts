import { sanitizeCsvValue } from "./csv-sanitization";

describe("sanitizeCsvValue", () => {
  it("should return empty string for null or undefined", () => {
    expect(sanitizeCsvValue(null)).toBe("");
    expect(sanitizeCsvValue(undefined)).toBe("");
  });

  it("should convert primitives to string", () => {
    expect(sanitizeCsvValue(42)).toBe("42");
    expect(sanitizeCsvValue(true)).toBe("true");
  });

  it("should serialize objects to JSON", () => {
    expect(sanitizeCsvValue({ key: "value" })).toBe('"{""key"":""value""}"');
  });

  it("should escape formula injection characters with a single quote", () => {
    expect(sanitizeCsvValue("=cmd|' /C calc'!A0")).toBe("'=cmd|' /C calc'!A0");
    expect(sanitizeCsvValue("+1+2")).toBe("'+1+2");
    expect(sanitizeCsvValue("-1-2")).toBe("'-1-2");
    expect(sanitizeCsvValue("@SUM(A1:A2)")).toBe("'@SUM(A1:A2)");
  });

  it("should escape double quotes by doubling them", () => {
    expect(sanitizeCsvValue('He said "Hello"')).toBe('"He said ""Hello"""');
  });

  it("should wrap values containing commas in double quotes", () => {
    expect(sanitizeCsvValue("Smith, John")).toBe('"Smith, John"');
  });

  it("should handle formula injection characters inside strings that also need quote escaping", () => {
    expect(sanitizeCsvValue('=SUM("A1","B1")')).toBe('"' + '\'=SUM(""A1"",""B1"")' + '"');
  });
});
