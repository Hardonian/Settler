"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyWebhookSignature = verifyWebhookSignature;
exports.generateWebhookSignature = generateWebhookSignature;
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../db");
async function verifyWebhookSignature(adapter, payload, signature) {
    // Get webhook config from database
    const configs = await (0, db_1.query)('SELECT secret, signature_algorithm FROM webhook_configs WHERE adapter = $1', [adapter]);
    if (configs.length === 0) {
        throw new Error(`Unknown adapter: ${adapter}`);
    }
    const config = configs[0]; // Safe: we checked length above
    const payloadBuffer = typeof payload === 'string' ? Buffer.from(payload) : payload;
    switch (adapter) {
        case 'stripe': {
            // Stripe uses HMAC-SHA256 with hex encoding
            const expectedSignature = crypto_1.default
                .createHmac('sha256', config.secret)
                .update(payloadBuffer)
                .digest('hex');
            // Use timing-safe comparison
            return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
        }
        case 'shopify': {
            // Shopify uses HMAC-SHA256 with base64 encoding
            const hmac = crypto_1.default
                .createHmac('sha256', config.secret)
                .update(payloadBuffer)
                .digest('base64');
            return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(hmac));
        }
        case 'paypal': {
            // PayPal uses HMAC-SHA256
            const hmac = crypto_1.default
                .createHmac('sha256', config.secret)
                .update(payloadBuffer)
                .digest('hex');
            return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(hmac));
        }
        default: {
            // Default to HMAC-SHA256
            const algorithm = config.signature_algorithm || 'hmac-sha256';
            if (algorithm === 'hmac-sha256') {
                const hmac = crypto_1.default
                    .createHmac('sha256', config.secret)
                    .update(payloadBuffer)
                    .digest('hex');
                return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(hmac));
            }
            throw new Error(`Unsupported signature algorithm: ${algorithm}`);
        }
    }
}
function generateWebhookSignature(payload, secret, algorithm = 'hmac-sha256') {
    const payloadBuffer = typeof payload === 'string' ? Buffer.from(payload) : payload;
    if (algorithm === 'hmac-sha256') {
        return crypto_1.default
            .createHmac('sha256', secret)
            .update(payloadBuffer)
            .digest('hex');
    }
    throw new Error(`Unsupported signature algorithm: ${algorithm}`);
}
//# sourceMappingURL=webhook-signature.js.map