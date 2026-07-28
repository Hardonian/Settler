import { Request, Response, NextFunction } from "express";
import { logWarn, logError } from "../utils/logger";

const PII_REGEXES = {
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // We might not want to redact all emails, but for enterprise DLP it's common for specific contexts. We'll stick to sensitive ones.
};

const redactPII = (text: string): string => {
  let redacted = text;
  redacted = redacted.replace(PII_REGEXES.ssn, "[REDACTED_SSN]");
  redacted = redacted.replace(PII_REGEXES.creditCard, "[REDACTED_CC]");
  // Note: Skipping email redaction universally to avoid breaking normal API responses
  return redacted;
};

const redactObject = (obj: any): any => {
  if (typeof obj === "string") {
    return redactPII(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(redactObject);
  }

  if (typeof obj === "object" && obj !== null) {
    const redactedObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Redact known sensitive keys completely
      if (/password|secret|token|ssn|credit_card/i.test(key) && typeof value === "string") {
        redactedObj[key] = "[REDACTED_KEY]";
      } else {
        redactedObj[key] = redactObject(value);
      }
    }
    return redactedObj;
  }

  return obj;
};

export const dlpMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  const originalSend = res.send;

  // Intercept res.json
  res.json = function (body) {
    try {
      const redactedBody = redactObject(body);
      return originalJson.call(this, redactedBody);
    } catch (_e) {
      logError("DLP redactor failed on JSON body", e);
      return originalJson.call(this, body);
    }
  };

  // Intercept res.send
  res.send = function (body) {
    if (typeof body === "string") {
      try {
        const parsed = JSON.parse(body);
        const redacted = redactObject(parsed);
        return originalSend.call(this, JSON.stringify(redacted));
      } catch (_e) {
        // Not JSON, just run string replacement
        return originalSend.call(this, redactPII(body));
      }
    } else if (typeof body === "object" && body !== null) {
      try {
        const redactedBody = redactObject(body);
        return originalSend.call(this, redactedBody);
      } catch (_e) {
        logError("DLP redactor failed on Object body", e);
        return originalSend.call(this, body);
      }
    }
    return originalSend.call(this, body);
  };

  next();
};
