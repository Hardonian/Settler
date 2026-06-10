"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redact = redact;
var SENSITIVE_FIELDS = [
    "apiKey",
    "api_key",
    "apiKeyHash",
    "secret",
    "password",
    "token",
    "card_number",
    "cvv",
    "ssn",
    "email",
    "phone",
    "credit_card",
    "passwordHash",
    "keyHash",
    "secret",
    "webhookSecret",
];
function redact(obj, additionalFields) {
    if (additionalFields === void 0) { additionalFields = []; }
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (typeof obj !== "object") {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(function (item) { return redact(item, additionalFields); });
    }
    var sensitiveFields = __spreadArray(__spreadArray([], SENSITIVE_FIELDS, true), additionalFields, true);
    var redacted = {};
    var _loop_1 = function (key, value) {
        var keyLower = key.toLowerCase();
        var isSensitive = sensitiveFields.some(function (field) { return keyLower.includes(field.toLowerCase()); });
        if (isSensitive) {
            redacted[key] = "[REDACTED]";
        }
        else if (typeof value === "object" && value !== null) {
            redacted[key] = redact(value, additionalFields);
        }
        else {
            redacted[key] = value;
        }
    };
    for (var _i = 0, _a = Object.entries(obj); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], value = _b[1];
        _loop_1(key, value);
    }
    return redacted;
}
