/**
 * PII Redaction Service
 * Redacts or tokenizes PII data before sending to cloud
 */

import crypto from "node:crypto";
import { logger } from "../utils/logger";

export class PIIRedactionService {
  private tokenMap: Map<string, string> = new Map();

  redact(value: string, piiType: string): string {
    // Generate deterministic token based on value and type
    const hash = crypto
      .createHash("sha256")
      .update(`${piiType}:${value}`)
      .digest("hex")
      .substring(0, 16);

    const token = `[REDACTED_${piiType.toUpperCase()}_${hash}]`;
    this.tokenMap.set(token, value);

    logger.debug("PII redacted", { piiType, token });
    return token;
  }

  restore(token: string): string | null {
    return this.tokenMap.get(token) || null;
  }

  clear(): void {
    this.tokenMap.clear();
  }
}
