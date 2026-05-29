import { sanitizeString } from "./utils";

describe("sanitizeString", () => {
  it("returns empty string when input is not a string", () => {
    // @ts-expect-error testing invalid input
    expect(sanitizeString(123)).toBe("");
    // @ts-expect-error testing invalid input
    expect(sanitizeString(null)).toBe("");
    // @ts-expect-error testing invalid input
    expect(sanitizeString(undefined)).toBe("");
    // @ts-expect-error testing invalid input
    expect(sanitizeString({})).toBe("");
  });

  it("returns trimmed string", () => {
    expect(sanitizeString("  hello world  ")).toBe("hello world");
  });

  it("removes < and > characters", () => {
    expect(sanitizeString("hello <world>")).toBe("hello world");
    expect(sanitizeString("<script>alert(1)</script>")).toBe("scriptalert(1)/script");
  });

  it("removes javascript: protocol", () => {
    expect(sanitizeString("javascript:alert(1)")).toBe("alert(1)");
    expect(sanitizeString("JaVaScRiPt:alert(1)")).toBe("alert(1)");
    expect(sanitizeString("javascript:javascript:alert(1)")).toBe("alert(1)");
  });

  it("removes event handlers", () => {
    expect(sanitizeString("onclick=alert(1)")).toBe("alert(1)");
    expect(sanitizeString("ONCLICK=alert(1)")).toBe("alert(1)");
    expect(sanitizeString("onerror=alert(1)")).toBe("alert(1)");
    expect(sanitizeString("onmouseover=alert(1)")).toBe("alert(1)");
  });

  it("handles complex XSS payloads", () => {
    expect(sanitizeString("<img src=x onerror=alert(1)>")).toBe("img src=x alert(1)");
    expect(sanitizeString("<a href='javascript:alert(1)'>click me</a>")).toBe(
      "a href='alert(1)'click me/a"
    );
  });
});
