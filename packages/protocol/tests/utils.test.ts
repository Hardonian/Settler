import { describe, it, expect } from '@jest/globals';
import { maskPII } from "../src/utils";

describe("maskPII", () => {
  describe("email masking", () => {
    it("masks a simple email address", () => {
      // "john.doe" length is 8.
      // local[0] is 'j'
      // maskChar.repeat(Math.max(0, 8 - 2)) = 6 '*'
      // So 'j******@example.com' (total 7 chars before @)
      expect(maskPII("john.doe@example.com")).toBe("j******@example.com");
    });

    it("masks an email with a short username (length 1)", () => {
      // "a" length is 1
      // local[0] is 'a'
      // max(0, -1) = 0
      // 'a@example.com'
      expect(maskPII("a@example.com")).toBe("a@example.com");
    });

    it("masks an email with a short username (length 2)", () => {
      // "ab" length is 2
      // local[0] is 'a'
      // max(0, 0) = 0
      // 'a@example.com'
      expect(maskPII("ab@example.com")).toBe("a@example.com");
    });

    it("masks an email with a short username (length 3)", () => {
      // "abc" length is 3
      // local[0] is 'a'
      // max(0, 1) = 1 '*'
      // 'a*@example.com'
      expect(maskPII("abc@example.com")).toBe("a*@example.com");
    });

    it("uses a custom mask character", () => {
      expect(maskPII("john.doe@example.com", "#")).toBe("j######@example.com");
    });

    it("masks multiple email addresses in a string", () => {
      const input = "Contact john@example.com or jane@example.com for help.";
      // "john" length 4 -> 'j**@example.com'
      // "jane" length 4 -> 'j**@example.com'
      const expected = "Contact j**@example.com or j**@example.com for help.";
      expect(maskPII(input)).toBe(expected);
    });

    it("does not mask strings without valid email formats", () => {
      const input = "This is not an email: john.doe-at-example.com";
      expect(maskPII(input)).toBe(input);
    });

    it("leaves non-email parts of the string untouched", () => {
      const input = "Email: alice.smith@test.co.uk - Please reply!";
      // "alice.smith" length 11 -> 'a*********@test.co.uk'
      const expected = "Email: a*********@test.co.uk - Please reply!";
      expect(maskPII(input)).toBe(expected);
    });
  });

  describe("credit card masking", () => {
    it("masks a standard 16-digit credit card number with spaces", () => {
      expect(maskPII("My card is 1234 5678 9012 3456")).toBe("My card is ****-****-****-3456");
    });

    it("masks a standard 16-digit credit card number with dashes", () => {
      expect(maskPII("My card is 1234-5678-9012-3456")).toBe("My card is ****-****-****-3456");
    });

    it("masks a continuous 16-digit credit card number", () => {
      expect(maskPII("My card is 1234567890123456")).toBe("My card is ****-****-****-3456");
    });
  });

  describe("edge cases", () => {
    it("returns empty string for null", () => {
      // @ts-expect-error Testing invalid input
      expect(maskPII(null)).toBe("");
    });

    it("returns empty string for undefined", () => {
      // @ts-expect-error Testing invalid input
      expect(maskPII(undefined)).toBe("");
    });

    it("returns empty string for non-string input", () => {
      // @ts-expect-error Testing invalid input
      expect(maskPII(12345)).toBe("");
    });

    it("returns empty string for empty string", () => {
      expect(maskPII("")).toBe("");
    });
  });
});
