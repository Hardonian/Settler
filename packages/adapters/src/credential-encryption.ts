/**
 * Credential Encryption
 *
 * Encrypts/decrypts credentials at rest using Supabase Vault or application-level encryption
 */

import { createClient } from "@supabase/supabase-js";

class CredentialEncryptionError extends Error {
  constructor(
    message: string,
    readonly code: string
  ) {
    super(message);
    this.name = "CredentialEncryptionError";
  }
}

function getEncryptionKey(): string {
  return process.env.CREDENTIAL_ENCRYPTION_KEY || process.env.SUPABASE_VAULT_KEY || "";
}

function decodeEncryptionKeyOrThrow(encryptionKey: string): Buffer {
  if (!/^[0-9a-fA-F]{64}$/.test(encryptionKey)) {
    throw new CredentialEncryptionError(
      "CREDENTIAL_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)",
      "INVALID_ENCRYPTION_KEY"
    );
  }

  return Buffer.from(encryptionKey, "hex");
}

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
    const { data, error } = await supabase.rpc("vault_store_secret", {
      secret: JSON.stringify(credentials),
    });

    if (!error && data) {
      return data as string; // Return vault reference
    }
  } catch {
    console.warn("Supabase Vault not available, using application-level encryption");
  }

  // Option 2: Application-level encryption using AES-256-GCM
  const encryptionKey = getEncryptionKey();
  if (!encryptionKey) {
    throw new CredentialEncryptionError(
      "Credential encryption unavailable: configure Supabase Vault or CREDENTIAL_ENCRYPTION_KEY",
      "ENCRYPTION_UNAVAILABLE"
    );
  }

  const crypto = await import("crypto");
  const algorithm = "aes-256-gcm";
  const key = decodeEncryptionKeyOrThrow(encryptionKey);
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
    const { data, error } = await supabase.rpc("vault_get_secret", {
      secret_ref: encryptedCredentials,
    });

    if (!error && data) {
      return JSON.parse(data as string) as Record<string, unknown>;
    }
  } catch {
    // Not a vault reference, try application-level decryption
  }

  // Option 2: Application-level decryption
  const encryptionKey = getEncryptionKey();
  if (encryptionKey) {
    try {
      const crypto = await import("crypto");
      const algorithm = "aes-256-gcm";
      const key = decodeEncryptionKeyOrThrow(encryptionKey);
      const buffer = Buffer.from(encryptedCredentials, "base64");

      const iv = buffer.slice(0, 16);
      const authTag = buffer.slice(16, 32);
      const encrypted = buffer.slice(32);

      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

      return JSON.parse(decrypted.toString("utf8")) as Record<string, unknown>;
    } catch {
      throw new CredentialEncryptionError("Failed to decrypt credentials", "DECRYPTION_FAILED");
    }
  }

  const nodeEnv = process.env.NODE_ENV || "development";
  const insecureAllowed =
    process.env.ALLOW_INSECURE_CREDENTIAL_FALLBACK === "true" &&
    process.env.ALLOW_INSECURE_CREDENTIAL_FALLBACK_IN_DEV === "true" &&
    (nodeEnv === "development" || nodeEnv === "test");

  if (process.env.ALLOW_INSECURE_CREDENTIAL_FALLBACK === "true" && !insecureAllowed) {
    console.error(
      "[credential-encryption] ALLOW_INSECURE_CREDENTIAL_FALLBACK is set but rejected: requires NODE_ENV=development|test and ALLOW_INSECURE_CREDENTIAL_FALLBACK_IN_DEV=true (production must never use plaintext credential fallback)"
    );
  }

  if (insecureAllowed) {
    console.warn(
      "[credential-encryption] INSECURE legacy base64 credential fallback is active (dev/test only)"
    );
    try {
      return JSON.parse(Buffer.from(encryptedCredentials, "base64").toString("utf8")) as Record<
        string,
        unknown
      >;
    } catch {
      throw new CredentialEncryptionError(
        "Failed to decode credentials via insecure fallback",
        "INSECURE_FALLBACK_DECODE_FAILED"
      );
    }
  }

  throw new CredentialEncryptionError(
    "Credential decryption unavailable: configure Supabase Vault or CREDENTIAL_ENCRYPTION_KEY",
    "DECRYPTION_UNAVAILABLE"
  );
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
