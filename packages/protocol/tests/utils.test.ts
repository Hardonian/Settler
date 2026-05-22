import { maskPII } from "../src/utils";

describe("maskPII", () => {
  it("masks credit card numbers", () => {
    expect(maskPII("My card is 1234-5678-9012-3456")).toBe("My card is ****-****-****-3456");
    expect(maskPII("My card is 1234 5678 9012 3456")).toBe("My card is ****-****-****-3456");
    expect(maskPII("My card is 1234567890123456")).toBe("My card is ****-****-****-3456");
  });

  it("masks email addresses", () => {
    expect(maskPII("My email is test@example.com")).toBe("My email is t***@example.com");
    expect(maskPII("My email is short@example.com")).toBe("My email is s****@example.com");
    expect(maskPII("My email is a@example.com")).toBe("My email is a@example.com");
    expect(maskPII("My email is ab@example.com")).toBe("My email is a*@example.com");
  });

  it("handles empty or invalid input", () => {
    expect(maskPII("")).toBe("");
    expect(maskPII(null as any)).toBe("");
    expect(maskPII(undefined as any)).toBe("");
  });

  it("allows custom mask characters", () => {
    expect(maskPII("My card is 1234-5678-9012-3456", "#")).toBe("My card is ####-####-####-3456");
    expect(maskPII("My email is test@example.com", "#")).toBe("My email is t###@example.com");
  });
});
