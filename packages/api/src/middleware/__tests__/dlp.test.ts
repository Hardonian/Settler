import { Request, Response, NextFunction } from "express";
import { dlpMiddleware, redactPII, redactObject } from "../dlp";

describe("DLP Middleware & Redaction", () => {
  describe("redactPII", () => {
    it("redacts SSN from text", () => {
      const text = "User SSN is 123-45-6789 in the system";
      expect(redactPII(text)).toBe("User SSN is [REDACTED_SSN] in the system");
    });

    it("redacts credit card numbers from text", () => {
      const text = "Card number 4111 2222 3333 4444 used for checkout";
      expect(redactPII(text)).toBe("Card number [REDACTED_CC] used for checkout");
    });

    it("redacts AWS access key IDs", () => {
      const text = "Found key AKIAIOSFODNN7EXAMPLE in log";
      expect(redactPII(text)).toBe("Found key [REDACTED_AWS_KEY] in log");
    });

    it("leaves regular text untouched", () => {
      const text = "Transaction TX-100234 processed successfully for $150.00";
      expect(redactPII(text)).toBe(text);
    });
  });

  describe("redactObject", () => {
    it("redacts sensitive keys completely", () => {
      const payload = {
        id: "tx_123",
        password: "super_secret_password",
        api_key: "sk_live_123456789",
        metadata: {
          customer_notes: "Customer SSN is 987-65-4321",
        },
      };

      const redacted = redactObject(payload);
      expect(redacted.password).toBe("[REDACTED_KEY]");
      expect(redacted.api_key).toBe("[REDACTED_KEY]");
      expect(redacted.metadata.customer_notes).toBe("Customer SSN is [REDACTED_SSN]");
      expect(redacted.id).toBe("tx_123");
    });

    it("handles arrays of objects", () => {
      const list = [
        { id: 1, ssn: "111-22-3333" },
        { id: 2, secret: "classified" },
      ];

      const redacted = redactObject(list);
      expect(redacted[0].ssn).toBe("[REDACTED_KEY]");
      expect(redacted[1].secret).toBe("[REDACTED_KEY]");
      expect(redacted[0].id).toBe(1);
    });
  });

  describe("dlpMiddleware Express Interceptor", () => {
    it("intercepts and redacts res.json", () => {
      const req = {} as Request;
      const jsonMock = jest.fn();
      const res = {
        json: jsonMock,
        locals: {},
      } as unknown as Response;
      const next: NextFunction = jest.fn();

      dlpMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();

      res.json({ secret: "hidden_token", public_field: "visible" });
      expect(jsonMock).toHaveBeenCalledWith({
        secret: "[REDACTED_KEY]",
        public_field: "visible",
      });
    });

    it("bypasses redaction when skipDlp is set in res.locals", () => {
      const req = {} as Request;
      const jsonMock = jest.fn();
      const res = {
        json: jsonMock,
        locals: { skipDlp: true },
      } as unknown as Response;
      const next: NextFunction = jest.fn();

      dlpMiddleware(req, res, next);
      res.json({ secret: "raw_secret" });

      expect(jsonMock).toHaveBeenCalledWith({ secret: "raw_secret" });
    });
  });
});
