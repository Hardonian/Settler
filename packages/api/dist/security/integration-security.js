"use strict";
/**
 * Integration Security Module
 *
 * Provides credential encryption, webhook signature validation,
 * quota enforcement, and health monitoring for integrations
 *
 * Priority: P0 (CRITICAL - Integration security)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookValidators = void 0;
exports.encryptCredential = encryptCredential;
exports.decryptCredential = decryptCredential;
exports.validateWebhookSignature = validateWebhookSignature;
exports.validateWebhookTimestamp = validateWebhookTimestamp;
exports.getIntegrationCredential = getIntegrationCredential;
exports.checkIntegrationQuota = checkIntegrationQuota;
exports.recordIntegrationQuotaUsage = recordIntegrationQuotaUsage;
exports.updateIntegrationHealth = updateIntegrationHealth;
const supabase_js_1 = require("@supabase/supabase-js");
const crypto = __importStar(require("crypto"));
/**
 * Encrypt credential using AES-256-GCM
 * In production, use AWS KMS, HashiCorp Vault, or similar
 */
function encryptCredential(credential, encryptionKey) {
    const algorithm = "aes-256-gcm";
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(encryptionKey, "hex"), iv);
    let encrypted = cipher.update(credential, "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag();
    return {
        encrypted,
        iv: iv.toString("hex"),
        tag: tag.toString("hex"),
    };
}
/**
 * Decrypt credential using AES-256-GCM
 */
function decryptCredential(encrypted, iv, tag, encryptionKey) {
    const algorithm = "aes-256-gcm";
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(encryptionKey, "hex"), Buffer.from(iv, "hex"));
    decipher.setAuthTag(Buffer.from(tag, "hex"));
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}
/**
 * Validate webhook signature (HMAC)
 */
function validateWebhookSignature(payload, signature, secret, algorithm = "sha256") {
    const hmac = crypto.createHmac(algorithm, secret);
    hmac.update(payload);
    const computedSignature = hmac.digest("hex");
    // Constant-time comparison
    if (computedSignature.length !== signature.length) {
        return false;
    }
    let result = 0;
    for (let i = 0; i < computedSignature.length; i++) {
        result |= computedSignature.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return result === 0;
}
/**
 * Validate webhook timestamp (prevent replay attacks)
 */
function validateWebhookTimestamp(timestamp, maxAgeSeconds = 300) {
    const now = Math.floor(Date.now() / 1000);
    const age = now - timestamp;
    return age >= 0 && age <= maxAgeSeconds;
}
/**
 * Get integration credential from database
 */
async function getIntegrationCredential(supabaseUrl, supabaseServiceKey, tenantId, integrationId, credentialType) {
    const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase
        .from("integration_credentials")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("integration_id", integrationId)
        .eq("credential_type", credentialType)
        .eq("status", "active")
        .single();
    if (error || !data) {
        return null;
    }
    return {
        id: data.id,
        tenantId: data.tenant_id,
        integrationId: data.integration_id,
        credentialType: data.credential_type,
        encryptedCredential: data.encrypted_credential,
        scopes: data.scopes,
        ...(data.expires_at && { expiresAt: new Date(data.expires_at) }),
        status: data.status,
    };
}
/**
 * Check integration quota
 */
async function checkIntegrationQuota(supabaseUrl, supabaseServiceKey, tenantId, integrationId, quotaType, limit) {
    const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
        .from("integration_quota_usage")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("integration_id", integrationId)
        .eq("date", today)
        .single();
    if (error && error.code !== "PGRST116") {
        // Error other than "not found"
        console.error("Error checking quota:", error);
        return { allowed: false, current: 0, limit };
    }
    const current = data?.[quotaType === "api_calls"
        ? "api_calls"
        : quotaType === "webhook_events"
            ? "webhook_events"
            : "data_synced_mb"] || 0;
    return {
        allowed: current < limit,
        current,
        limit,
    };
}
/**
 * Record integration quota usage
 */
async function recordIntegrationQuotaUsage(supabaseUrl, supabaseServiceKey, tenantId, integrationId, quotaType, amount) {
    const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
    const today = new Date().toISOString().split("T")[0];
    const updateField = quotaType === "api_calls"
        ? "api_calls"
        : quotaType === "webhook_events"
            ? "webhook_events"
            : "data_synced_mb";
    // Get existing record to increment, or create new
    const { data: existing } = await supabase
        .from("integration_quota_usage")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("integration_id", integrationId)
        .eq("date", today)
        .single();
    const currentValue = existing?.[updateField] || 0;
    const newValue = currentValue + amount;
    // Use upsert to create or update quota usage
    const updateData = {
        tenant_id: tenantId,
        integration_id: integrationId,
        date: today,
        updated_at: new Date().toISOString(),
    };
    updateData[updateField] = newValue;
    const { error } = await supabase.from("integration_quota_usage").upsert(updateData, {
        onConflict: "tenant_id,integration_id,date",
    });
    if (error) {
        console.error("Error recording quota usage:", error);
    }
}
/**
 * Update integration health
 */
async function updateIntegrationHealth(supabaseUrl, supabaseServiceKey, tenantId, integrationId, success, errorMessage) {
    const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
    const { data: existing } = await supabase
        .from("integration_health")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("integration_id", integrationId)
        .single();
    const consecutiveFailures = success ? 0 : (existing?.consecutive_failures || 0) + 1;
    const healthScore = Math.max(0, 100 - consecutiveFailures * 10 - (existing?.error_count || 0) * 5);
    const status = consecutiveFailures >= 5 ? "error" : consecutiveFailures >= 3 ? "degraded" : "healthy";
    const updateData = {
        health_score: healthScore,
        status,
        consecutive_failures: consecutiveFailures,
        updated_at: new Date().toISOString(),
    };
    if (success) {
        updateData.last_successful_sync = new Date().toISOString();
        updateData.error_message = null;
    }
    else {
        updateData.last_failed_sync = new Date().toISOString();
        updateData.error_message = errorMessage || null;
        updateData.error_count = (existing?.error_count || 0) + 1;
    }
    if (consecutiveFailures >= 5) {
        updateData.auto_disabled = true;
    }
    const { error } = await supabase.from("integration_health").upsert({
        tenant_id: tenantId,
        integration_id: integrationId,
        ...updateData,
    }, {
        onConflict: "tenant_id,integration_id",
    });
    if (error) {
        console.error("Error updating integration health:", error);
    }
}
/**
 * Integration-specific webhook validators
 */
exports.webhookValidators = {
    stripe: (payload, signature, secret) => {
        // Stripe uses timestamp + payload format
        const elements = signature.split(",");
        const timestamp = elements.find((e) => e.startsWith("t="))?.substring(2);
        const signatureHash = elements.find((e) => e.startsWith("v1="))?.substring(3);
        if (!timestamp || !signatureHash) {
            return false;
        }
        // Validate timestamp (prevent replay)
        if (!validateWebhookTimestamp(parseInt(timestamp, 10))) {
            return false;
        }
        // Validate signature
        const signedPayload = `${timestamp}.${payload}`;
        return validateWebhookSignature(signedPayload, signatureHash, secret);
    },
    shopify: (payload, signature, secret) => {
        return validateWebhookSignature(payload, signature, secret, "sha256");
    },
    paypal: (payload, signature, secret) => {
        // PayPal uses different signature format
        return validateWebhookSignature(payload, signature, secret, "sha256");
    },
};
//# sourceMappingURL=integration-security.js.map