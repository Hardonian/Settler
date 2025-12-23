/**
 * Credential Encryption
 *
 * Encrypts/decrypts credentials at rest using Supabase Vault or application-level encryption
 */
/**
 * Encrypt credentials using pgcrypto or application-level encryption
 */
export declare function encryptCredentials(credentials: Record<string, unknown>, supabaseUrl: string, supabaseServiceKey: string): Promise<string>;
/**
 * Decrypt credentials
 */
export declare function decryptCredentials(encryptedCredentials: string, supabaseUrl: string, supabaseServiceKey: string): Promise<Record<string, unknown>>;
/**
 * Encrypt a single token/secret
 */
export declare function encryptToken(token: string, supabaseUrl: string, supabaseServiceKey: string): Promise<string>;
/**
 * Decrypt a single token/secret
 */
export declare function decryptToken(encryptedToken: string, supabaseUrl: string, supabaseServiceKey: string): Promise<string>;
//# sourceMappingURL=credential-encryption.d.ts.map