"use strict";
/**
 * Credential Encryption
 *
 * Encrypts/decrypts credentials at rest using Supabase Vault or application-level encryption
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
exports.encryptCredentials = encryptCredentials;
exports.decryptCredentials = decryptCredentials;
exports.encryptToken = encryptToken;
exports.decryptToken = decryptToken;
const supabase_js_1 = require("@supabase/supabase-js");
const ENCRYPTION_KEY = process.env.CREDENTIAL_ENCRYPTION_KEY || process.env.SUPABASE_VAULT_KEY || "";
/**
 * Encrypt credentials using pgcrypto or application-level encryption
 */
async function encryptCredentials(credentials, supabaseUrl, supabaseServiceKey) {
    // Option 1: Use Supabase Vault (if available)
    try {
        const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
        // Store in vault and get reference
        const { data, error } = await supabase.rpc("vault_store_secret", {
            secret: JSON.stringify(credentials),
        });
        if (!error && data) {
            return data; // Return vault reference
        }
    }
    catch {
        console.warn("Supabase Vault not available, using application-level encryption");
    }
    // Option 2: Application-level encryption using AES-256-GCM
    if (ENCRYPTION_KEY) {
        const crypto = await Promise.resolve().then(() => __importStar(require("crypto")));
        const algorithm = "aes-256-gcm";
        const key = Buffer.from(ENCRYPTION_KEY, "hex").slice(0, 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        const encrypted = Buffer.concat([
            cipher.update(JSON.stringify(credentials), "utf8"),
            cipher.final(),
        ]);
        const authTag = cipher.getAuthTag();
        // Return base64 encoded: iv:authTag:encrypted
        return Buffer.concat([iv, authTag, encrypted]).toString("base64");
    }
    throw new Error("Credential encryption unavailable: configure Supabase Vault or CREDENTIAL_ENCRYPTION_KEY");
}
/**
 * Decrypt credentials
 */
async function decryptCredentials(encryptedCredentials, supabaseUrl, supabaseServiceKey) {
    // Option 1: Supabase Vault
    try {
        const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
        const { data, error } = await supabase.rpc("vault_get_secret", {
            secret_ref: encryptedCredentials,
        });
        if (!error && data) {
            return JSON.parse(data);
        }
    }
    catch {
        // Not a vault reference, try application-level decryption
    }
    // Option 2: Application-level decryption
    if (ENCRYPTION_KEY) {
        try {
            const crypto = await Promise.resolve().then(() => __importStar(require("crypto")));
            const algorithm = "aes-256-gcm";
            const key = Buffer.from(ENCRYPTION_KEY, "hex").slice(0, 32);
            const buffer = Buffer.from(encryptedCredentials, "base64");
            const iv = buffer.slice(0, 16);
            const authTag = buffer.slice(16, 32);
            const encrypted = buffer.slice(32);
            const decipher = crypto.createDecipheriv(algorithm, key, iv);
            decipher.setAuthTag(authTag);
            const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
            return JSON.parse(decrypted.toString("utf8"));
        }
        catch (error) {
            console.error("Decryption failed:", error);
            throw new Error("Failed to decrypt credentials");
        }
    }
    if (process.env.ALLOW_INSECURE_CREDENTIAL_FALLBACK === "true") {
        try {
            return JSON.parse(Buffer.from(encryptedCredentials, "base64").toString("utf8"));
        }
        catch {
            throw new Error("Failed to decode credentials via insecure fallback");
        }
    }
    throw new Error("Credential decryption unavailable: configure Supabase Vault or CREDENTIAL_ENCRYPTION_KEY");
}
/**
 * Encrypt a single token/secret
 */
async function encryptToken(token, supabaseUrl, supabaseServiceKey) {
    return encryptCredentials({ token }, supabaseUrl, supabaseServiceKey);
}
/**
 * Decrypt a single token/secret
 */
async function decryptToken(encryptedToken, supabaseUrl, supabaseServiceKey) {
    const decrypted = await decryptCredentials(encryptedToken, supabaseUrl, supabaseServiceKey);
    return decrypted.token;
}
//# sourceMappingURL=credential-encryption.js.map