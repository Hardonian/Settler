"use strict";
/**
 * Webhook Verification
 *
 * Verifies webhook signatures from various providers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyStripeWebhook = verifyStripeWebhook;
exports.verifyPlaidWebhook = verifyPlaidWebhook;
exports.verifyChargebeeWebhook = verifyChargebeeWebhook;
exports.verifyRecurlyWebhook = verifyRecurlyWebhook;
exports.verifyWebhook = verifyWebhook;
const crypto_1 = require("crypto");
/**
 * Verify Stripe webhook signature
 */
function verifyStripeWebhook(payload, signature, secret) {
    try {
        const elements = signature.split(",");
        const timestamp = elements.find((e) => e.startsWith("t="))?.split("=")[1];
        const signatures = elements.filter((e) => e.startsWith("v1=")).map((e) => e.split("=")[1]);
        if (!timestamp || signatures.length === 0) {
            return { valid: false, error: "Invalid signature format" };
        }
        const signedPayload = `${timestamp}.${payload}`;
        const expectedSignature = (0, crypto_1.createHmac)("sha256", secret).update(signedPayload).digest("hex");
        const isValid = signatures.some((sig) => {
            if (!sig)
                return false;
            const expected = Buffer.from(expectedSignature, "hex");
            const received = Buffer.from(sig, "hex");
            return (expected.length === received.length &&
                (0, crypto_1.createHmac)("sha256", secret).update(signedPayload).digest("hex") === sig);
        });
        const result = { valid: isValid };
        if (!isValid) {
            result.error = "Invalid signature";
        }
        return result;
    }
    catch (error) {
        return { valid: false, error: error instanceof Error ? error.message : "Verification failed" };
    }
}
/**
 * Verify Plaid webhook signature
 */
function verifyPlaidWebhook(payload, signature, secret) {
    try {
        const expectedSignature = (0, crypto_1.createHmac)("sha256", secret).update(payload).digest("hex");
        const isValid = signature === expectedSignature;
        const result = { valid: isValid };
        if (!isValid) {
            result.error = "Invalid signature";
        }
        return result;
    }
    catch (error) {
        return { valid: false, error: error instanceof Error ? error.message : "Verification failed" };
    }
}
/**
 * Verify Chargebee webhook signature
 */
function verifyChargebeeWebhook(payload, signature, secret) {
    try {
        const expectedSignature = (0, crypto_1.createHmac)("sha256", secret).update(payload).digest("hex");
        const isValid = signature === expectedSignature;
        const result = { valid: isValid };
        if (!isValid) {
            result.error = "Invalid signature";
        }
        return result;
    }
    catch (error) {
        return { valid: false, error: error instanceof Error ? error.message : "Verification failed" };
    }
}
/**
 * Verify Recurly webhook signature
 */
function verifyRecurlyWebhook(payload, signature, secret) {
    try {
        const expectedSignature = (0, crypto_1.createHmac)("sha1", secret).update(payload).digest("hex");
        const isValid = signature === expectedSignature;
        const result = { valid: isValid };
        if (!isValid) {
            result.error = "Invalid signature";
        }
        return result;
    }
    catch (error) {
        return { valid: false, error: error instanceof Error ? error.message : "Verification failed" };
    }
}
/**
 * Verify webhook signature based on provider
 */
function verifyWebhook(providerId, payload, signature, secret) {
    switch (providerId.toLowerCase()) {
        case "stripe":
        case "stripe-connect":
            return verifyStripeWebhook(payload, signature, secret);
        case "plaid":
            return verifyPlaidWebhook(payload, signature, secret);
        case "chargebee":
            return verifyChargebeeWebhook(payload, signature, secret);
        case "recurly":
            return verifyRecurlyWebhook(payload, signature, secret);
        default:
            // For providers without signature verification, return valid
            return { valid: true };
    }
}
//# sourceMappingURL=webhook-verification.js.map