"use strict";
/**
 * PII Redaction Service
 * Redacts or tokenizes PII data before sending to cloud
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PIIRedactionService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../utils/logger");
class PIIRedactionService {
    tokenMap = new Map();
    redact(value, piiType) {
        // Generate deterministic token based on value and type
        const hash = crypto_1.default
            .createHash("sha256")
            .update(`${piiType}:${value}`)
            .digest("hex")
            .substring(0, 16);
        const token = `[REDACTED_${piiType.toUpperCase()}_${hash}]`;
        this.tokenMap.set(token, value);
        logger_1.logger.debug("PII redacted", { piiType, token });
        return token;
    }
    restore(token) {
        return this.tokenMap.get(token) || null;
    }
    clear() {
        this.tokenMap.clear();
    }
}
exports.PIIRedactionService = PIIRedactionService;
//# sourceMappingURL=PIIRedactionService.js.map