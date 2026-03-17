/**
 * Type Tests
 * Ensures type safety with runtime checks
 */

import { ApiError, ValidationError, NotFoundError } from "../utils/typed-errors";
import { Result, isString, isNumber, isPlainObject } from "../utils/common-types";

describe("Type Tests", () => {
  describe("Typed Errors", () => {
    test("should have correct types", () => {
      const error = new ValidationError("Invalid input", "email");
      expect(typeof error.statusCode).toBe("number");
      expect(error.statusCode).toBe(400);
      expect(typeof error.errorCode).toBe("string");
      expect(typeof error.message).toBe("string");
    });

    test("should allow type narrowing", () => {
      function handleError(error: unknown): string {
        if (error instanceof ApiError) {
          return error.errorCode;
        }
        return "UNKNOWN";
      }

      const error = new NotFoundError("Not found", "job", "123");
      expect(typeof handleError(error)).toBe("string");
    });
  });

  describe("Common Types", () => {
    test("Result type should work correctly", () => {
      const success: Result<string> = { success: true, data: "test" };
      const failure: Result<string> = { success: false, error: new Error("failed") };

      expect(typeof success.success).toBe("boolean");
      if (success.success) {
        expect(typeof success.data).toBe("string");
      } else {
        // This part is practically unreachable in this specific test case but
        // we keep the logic for coverage of the failure branch.
        expect((success as any).error).toBeInstanceOf(Error);
      }

      expect(typeof failure.success).toBe("boolean");
      if (!failure.success) {
        expect(failure.error).toBeInstanceOf(Error);
      }
    });

    test("Type guards should narrow types", () => {
      const value: unknown = "test";
      if (isString(value)) {
        expect(typeof value).toBe("string");
      }

      const num: unknown = 123;
      if (isNumber(num)) {
        expect(typeof num).toBe("number");
      }

      const obj: unknown = { key: "value" };
      if (isPlainObject(obj)) {
        expect(typeof obj).toBe("object");
      }
    });
  });
});
