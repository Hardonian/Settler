"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redact = redact;
const SENSITIVE_FIELDS = [
    'apiKey', 'api_key', 'apiKeyHash', 'secret', 'password', 'token',
    'card_number', 'cvv', 'ssn', 'email', 'phone', 'credit_card',
    'passwordHash', 'keyHash', 'secret', 'webhookSecret',
];
function redact(obj, additionalFields = []) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => redact(item, additionalFields));
    }
    const sensitiveFields = [...SENSITIVE_FIELDS, ...additionalFields];
    const redacted = {};
    for (const [key, value] of Object.entries(obj)) {
        const keyLower = key.toLowerCase();
        const isSensitive = sensitiveFields.some(field => keyLower.includes(field.toLowerCase()));
        if (isSensitive) {
            redacted[key] = '[REDACTED]';
        }
        else if (typeof value === 'object' && value !== null) {
            redacted[key] = redact(value, additionalFields);
        }
        else {
            redacted[key] = value;
        }
    }
    return redacted;
}
//# sourceMappingURL=redaction.js.map