/**
 * Encryption Utilities
 * AES-256-GCM authenticated encryption
 * Supports both SecretsManager and direct config access for backward compatibility
 */

import crypto from 'crypto';
import { SecretsManager } from './SecretsManager';
import { config } from '../../config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key from SecretsManager or config (backward compatibility)
 */
function getEncryptionKey(keyName: string = 'ENCRYPTION_KEY'): Buffer {
  // Try SecretsManager first (preferred)
  let key = SecretsManager.getSecret(keyName);
  
  // Fallback to config for backward compatibility
  if (!key && keyName === 'ENCRYPTION_KEY') {
    key = config.encryption.key;
  }
  
  if (!key) {
    throw new Error(`Encryption key ${keyName} not found`);
  }

  // Handle both hex-encoded and raw string keys
  let keyBuffer: Buffer;
  try {
    // Try hex decoding first
    keyBuffer = Buffer.from(key, 'hex');
    // If result is valid length, use it
    if (keyBuffer.length === 32 || keyBuffer.length === 64) {
      return keyBuffer.slice(0, 32);
    }
  } catch {
    // Not hex, treat as raw string
  }
  
  // Treat as raw string and derive key
  keyBuffer = Buffer.from(key, 'utf8');
  if (keyBuffer.length < 32) {
    // Derive 32-byte key using scrypt
    return crypto.scryptSync(key, 'salt', 32);
  }
  
  return keyBuffer.slice(0, 32);
}

/**
 * Encrypt sensitive data
 * Supports both new JSON format and legacy base64 format for backward compatibility
 */
export function encrypt(data: string, keyName: string = 'ENCRYPTION_KEY'): string {
  const key = getEncryptionKey(keyName);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return JSON format (new standard)
  return JSON.stringify({
    iv: iv.toString('hex'),
    encrypted,
    authTag: authTag.toString('hex'),
  });
}

/**
 * Decrypt sensitive data
 * Supports both new JSON format and legacy base64 format for backward compatibility
 */
export function decrypt(encryptedData: string, keyName: string = 'ENCRYPTION_KEY'): string {
  const key = getEncryptionKey(keyName);
  
  let parsed: any;
  let iv: Buffer;
  let encrypted: string;
  let authTag: Buffer;
  
  try {
    // Try new JSON format first
    parsed = JSON.parse(encryptedData);
    iv = Buffer.from(parsed.iv, 'hex');
    encrypted = parsed.encrypted;
    authTag = Buffer.from(parsed.authTag, 'hex');
  } catch {
    // Fallback to legacy base64 format (backward compatibility)
    const data = Buffer.from(encryptedData, 'base64');
    const SALT_LENGTH = 64;
    const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
    const ENCRYPTED_POSITION = TAG_POSITION + AUTH_TAG_LENGTH;
    
    const salt = data.subarray(0, SALT_LENGTH);
    iv = data.subarray(SALT_LENGTH, TAG_POSITION);
    authTag = data.subarray(TAG_POSITION, ENCRYPTED_POSITION);
    const encryptedBuffer = data.subarray(ENCRYPTED_POSITION);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(salt);
    decipher.setAuthTag(authTag);
    
    return decipher.update(encryptedBuffer, undefined, 'utf8') + decipher.final('utf8');
  }

  // New JSON format
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
