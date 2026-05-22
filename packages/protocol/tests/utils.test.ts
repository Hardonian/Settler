import { maskPII } from "../src/utils";

describe("maskPII", () => {
  it("should return empty string for falsy input", () => {
    expect(maskPII("")).toBe("");
    expect(maskPII(null as any)).toBe("");
    expect(maskPII(undefined as any)).toBe("");
  });

  describe("credit card masking", () => {
    it("should mask 16-digit credit cards with dashes", () => {
      expect(maskPII("My card is 1234-5678-9012-3456")).toBe("My card is ****-****-****-3456");
    });

    it("should mask 16-digit credit cards with spaces", () => {
      expect(maskPII("My card is 1234 5678 9012 3456")).toBe("My card is ****-****-****-3456");
    });

    it("should mask 16-digit credit cards without separators", () => {
      expect(maskPII("My card is 1234567890123456")).toBe("My card is ****-****-****-3456");
    });

    it("should handle multiple credit cards in the same string", () => {
      expect(maskPII("Cards: 1234-5678-9012-3456 and 9876 5432 1098 7654")).toBe(
        "Cards: ****-****-****-3456 and ****-****-****-7654"
      );
    });

    it("should not mask shorter numbers", () => {
      expect(maskPII("Account number 1234-5678")).toBe("Account number 1234-5678");
    });
  });

  describe("email masking", () => {
    it("should mask email addresses", () => {
      expect(maskPII("Contact me at john.doe@example.com")).toBe(
        "Contact me at j******@example.com"
      );
    });

    it("should mask short email addresses correctly", () => {
      expect(maskPII("a@example.com")).toBe("a@example.com");
      expect(maskPII("ab@example.com")).toBe("a@example.com");
      expect(maskPII("abc@example.com")).toBe("a*@example.com");
    });
  });
});
