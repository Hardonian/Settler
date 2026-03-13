"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllowedWebhookAdapters = getAllowedWebhookAdapters;
exports.isAllowedWebhookAdapter = isAllowedWebhookAdapter;
exports.validateWebhookTimestamp = validateWebhookTimestamp;
exports.buildWebhookReplayKey = buildWebhookReplayKey;
const crypto_1 = __importDefault(require("crypto"));
const DEFAULT_ALLOWED_ADAPTERS = ["stripe", "shopify", "paypal", "quickbooks", "xero"];
const DEFAULT_TOLERANCE_SECONDS = 300;
function getAllowedWebhookAdapters() {
    const raw = process.env.WEBHOOK_ALLOWED_ADAPTERS;
    if (!raw) {
        return DEFAULT_ALLOWED_ADAPTERS;
    }
    return raw
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter((value) => value.length > 0);
}
function isAllowedWebhookAdapter(adapter, allowedAdapters = getAllowedWebhookAdapters()) {
    return allowedAdapters.includes(adapter.toLowerCase());
}
function validateWebhookTimestamp(timestampHeader, nowEpochSeconds = Math.floor(Date.now() / 1000), toleranceSeconds = DEFAULT_TOLERANCE_SECONDS) {
    if (!timestampHeader) {
        return { valid: false, reason: "missing" };
    }
    const timestamp = Number.parseInt(timestampHeader, 10);
    if (!Number.isFinite(timestamp)) {
        return { valid: false, reason: "invalid" };
    }
    const timeDiff = Math.abs(nowEpochSeconds - timestamp);
    if (timeDiff > toleranceSeconds) {
        return { valid: false, reason: "stale" };
    }
    return { valid: true, timestamp };
}
function buildWebhookReplayKey(adapter, signature, timestamp) {
    const digest = crypto_1.default
        .createHash("sha256")
        .update(`${adapter}:${signature}:${timestamp}`)
        .digest("hex");
    return `settler:webhook:replay:v1:${adapter}:${digest}`;
}
//# sourceMappingURL=security.js.map