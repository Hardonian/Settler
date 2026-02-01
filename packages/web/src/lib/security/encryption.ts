/**
 * Encryption Utilities for Next.js Web Package
 * AES-256-GCM authenticated encryption
 *
 * SECURITY: Only use in Node.js runtime (API routes, Server Actions, Server Components)
 * NEVER use in client components or Edge runtime
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

/**
 * Get encryption key from environment
 * Throws if key is not configured
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable not configured");
  }

  // Handle both hex-encoded and raw string keys
  let keyBuffer: Buffer;
  try {
    // Try hex decoding first
    keyBuffer = Buffer.from(key, "hex");
    // If result is valid length (32 bytes for AES-256), use it
    if (keyBuffer.length === 32 || keyBuffer.length === 64) {
      return keyBuffer.slice(0, 32);
    }
  } catch {
    // Not hex, treat as raw string
  }

  // Treat as raw string and derive key
  keyBuffer = Buffer.from(key, "utf8");
  if (keyBuffer.length < 32) {
    // Derive 32-byte key using scrypt
    return crypto.scryptSync(key, "settler-encryption-salt", 32);
  }

  return keyBuffer.slice(0, 32);
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * Returns JSON-encoded ciphertext with IV and auth tag
 *
 * @param data - Plaintext data to encrypt
 * @returns Encrypted data as JSON string
 */
export function encrypt(data: string): string {
  if (!data) {
    throw new Error("Cannot encrypt empty data");
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Return JSON format for clarity and forward compatibility
  return JSON.stringify({
    iv: iv.toString("hex"),
    encrypted,
    authTag: authTag.toString("hex"),
    version: 1, // Version for future migration support
  });
}

/**
 * Decrypt data encrypted with encrypt()
 * Supports JSON format with version field
 *
 * @param encryptedData - JSON-encoded ciphertext
 * @returns Decrypted plaintext
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    throw new Error("Cannot decrypt empty data");
  }

  const key = getEncryptionKey();

  let parsed: {
    iv: string;
    encrypted: string;
    authTag: string;
    version?: number;
  };

  try {
    parsed = JSON.parse(encryptedData);
  } catch (_error) {
    throw new Error("Invalid encrypted data format: must be JSON");
  }

  if (!parsed.iv || !parsed.encrypted || !parsed.authTag) {
    throw new Error("Invalid encrypted data: missing required fields");
  }

  const iv = Buffer.from(parsed.iv, "hex");
  const authTag = Buffer.from(parsed.authTag, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(parsed.encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Check if encryption key is configured
 * Useful for graceful degradation
 */
export function isEncryptionAvailable(): boolean {
  return !!process.env.ENCRYPTION_KEY;
}
