import { maskPII } from "../src/utils";

describe("maskPII", () => {
  it("should return empty string if input is falsy or not a string", () => {
    expect(maskPII(undefined as any)).toBe("");
    expect(maskPII(null as any)).toBe("");
    expect(maskPII("")).toBe("");
    expect(maskPII(123 as any)).toBe("");
  });

  describe("email masking", () => {
    it("masks typical email addresses", () => {
      expect(maskPII("user@example.com")).toBe("u***@example.com");
      expect(maskPII("john.doe@gmail.com")).toBe("j*******@gmail.com");
    });

    it("handles short local parts", () => {
      expect(maskPII("a@example.com")).toBe("a@example.com"); // Length 1
      expect(maskPII("ab@example.com")).toBe("a@example.com"); // Length 2
    });

    it("masks multiple email addresses in a string", () => {
      expect(maskPII("Contact us at test@example.com or support@company.org")).toBe(
        "Contact us at t***@example.com or s******@company.org"
      );
    });

    it("allows custom mask character", () => {
      expect(maskPII("user@example.com", "X")).toBe("uXXX@example.com");
    });
  });

  describe("credit card masking", () => {
    it("masks credit card numbers with spaces", () => {
      expect(maskPII("My card is 1234 5678 1234 5678.")).toBe("My card is ****-****-****-5678.");
    });

    it("masks credit card numbers with dashes", () => {
      expect(maskPII("My card is 1234-5678-1234-5678.")).toBe("My card is ****-****-****-5678.");
    });

    it("masks credit card numbers without separators", () => {
      expect(maskPII("My card is 1234567812345678.")).toBe("My card is ****-****-****-5678.");
    });

    it("masks multiple credit cards in a string", () => {
      expect(maskPII("Cards: 1234 5678 1234 5678 and 9876-5432-1098-7654")).toBe(
        "Cards: ****-****-****-5678 and ****-****-****-7654"
      );
    });
  });

  it("masks both emails and credit cards in the same string", () => {
    expect(maskPII("User john@doe.com paid with 1234 5678 1234 5678")).toBe(
      "User j***@doe.com paid with ****-****-****-5678"
    );
  });
});
