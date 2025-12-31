/**
 * Credential Encryption
 * 
 * Encrypts/decrypts credentials at rest using Supabase Vault or application-level encryption
 */

import { createClient } from '@supabase/supabase-js';

const ENCRYPTION_KEY = process.env.CREDENTIAL_ENCRYPTION_KEY || process.env.SUPABASE_VAULT_KEY || '';

/**
 * Encrypt credentials using pgcrypto or application-level encryption
 */
export async function encryptCredentials(
  credentials: Record<string, unknown>,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<string> {
  // Option 1: Use Supabase Vault (if available)
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Store in vault and get reference
    const { data, error } = await supabase.rpc('vault_store_secret', {
      secret: JSON.stringify(credentials),
    });

    if (!error && data) {
      return data as string; // Return vault reference
    }
  } catch (error) {
    console.warn('Supabase Vault not available, using application-level encryption');
  }

  // Option 2: Application-level encryption using AES-256-GCM
  if (ENCRYPTION_KEY) {
    const crypto = await import('crypto');
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(credentials), 'utf8'),
      cipher.final(),
    ]);
    
    const authTag = cipher.getAuthTag();
    
    // Return base64 encoded: iv:authTag:encrypted
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }

  // Fallback: Base64 encoding (not secure, but better than plaintext)
  console.warn('No encryption key configured, using base64 encoding');
  return Buffer.from(JSON.stringify(credentials)).toString('base64');
}

/**
 * Decrypt credentials
 */
export async function decryptCredentials(
  encryptedCredentials: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<Record<string, unknown>> {
  // Option 1: Supabase Vault
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase.rpc('vault_get_secret', {
      secret_ref: encryptedCredentials,
    });

    if (!error && data) {
      return JSON.parse(data as string) as Record<string, unknown>;
    }
  } catch (error) {
    // Not a vault reference, try application-level decryption
  }

  // Option 2: Application-level decryption
  if (ENCRYPTION_KEY) {
    try {
      const crypto = await import('crypto');
      const algorithm = 'aes-256-gcm';
      const key = Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32);
      const buffer = Buffer.from(encryptedCredentials, 'base64');
      
      const iv = buffer.slice(0, 16);
      const authTag = buffer.slice(16, 32);
      const encrypted = buffer.slice(32);
      
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      decipher.setAuthTag(authTag);
      
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);
      
      return JSON.parse(decrypted.toString('utf8')) as Record<string, unknown>;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt credentials');
    }
  }

  // Fallback: Base64 decoding
  try {
    return JSON.parse(Buffer.from(encryptedCredentials, 'base64').toString('utf8')) as Record<string, unknown>;
  } catch (error) {
    throw new Error('Failed to decode credentials');
  }
}

/**
 * Encrypt a single token/secret
 */
export async function encryptToken(
  token: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<string> {
  return encryptCredentials({ token }, supabaseUrl, supabaseServiceKey);
}

/**
 * Decrypt a single token/secret
 */
export async function decryptToken(
  encryptedToken: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<string> {
  const decrypted = await decryptCredentials(encryptedToken, supabaseUrl, supabaseServiceKey);
  return decrypted.token as string;
}
