/**
 * Integration Security Module
 * 
 * Provides credential encryption, webhook signature validation,
 * quota enforcement, and health monitoring for integrations
 * 
 * Priority: P0 (CRITICAL - Integration security)
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export interface IntegrationCredential {
  id: string;
  tenantId: string;
  integrationId: string;
  credentialType: 'oauth_token' | 'api_key' | 'webhook_secret' | 'api_secret';
  encryptedCredential: string;
  scopes?: string[];
  expiresAt?: Date;
  status: 'active' | 'expired' | 'revoked' | 'error';
}

/**
 * Encrypt credential using AES-256-GCM
 * In production, use AWS KMS, HashiCorp Vault, or similar
 */
export function encryptCredential(
  credential: string,
  encryptionKey: string
): { encrypted: string; iv: string; tag: string } {
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(encryptionKey, 'hex'), iv);

  let encrypted = cipher.update(credential, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
}

/**
 * Decrypt credential using AES-256-GCM
 */
export function decryptCredential(
  encrypted: string,
  iv: string,
  tag: string,
  encryptionKey: string
): string {
  const algorithm = 'aes-256-gcm';
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(encryptionKey, 'hex'),
    Buffer.from(iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(tag, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Validate webhook signature (HMAC)
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha512' = 'sha256'
): boolean {
  const hmac = crypto.createHmac(algorithm, secret);
  hmac.update(payload);
  const computedSignature = hmac.digest('hex');

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
export function validateWebhookTimestamp(
  timestamp: number,
  maxAgeSeconds: number = 300
): boolean {
  const now = Math.floor(Date.now() / 1000);
  const age = now - timestamp;

  return age >= 0 && age <= maxAgeSeconds;
}

/**
 * Get integration credential from database
 */
export async function getIntegrationCredential(
  supabaseUrl: string,
  supabaseServiceKey: string,
  tenantId: string,
  integrationId: string,
  credentialType: 'oauth_token' | 'api_key' | 'webhook_secret' | 'api_secret'
): Promise<IntegrationCredential | null> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from('integration_credentials')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('integration_id', integrationId)
    .eq('credential_type', credentialType)
    .eq('status', 'active')
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
    expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
    status: data.status,
  };
}

/**
 * Check integration quota
 */
export async function checkIntegrationQuota(
  supabaseUrl: string,
  supabaseServiceKey: string,
  tenantId: string,
  integrationId: string,
  quotaType: 'api_calls' | 'webhook_events' | 'data_synced_mb',
  limit: number
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('integration_quota_usage')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('integration_id', integrationId)
    .eq('date', today)
    .single();

  if (error && error.code !== 'PGRST116') {
    // Error other than "not found"
    console.error('Error checking quota:', error);
    return { allowed: false, current: 0, limit };
  }

  const current =
    data?.[
      quotaType === 'api_calls'
        ? 'api_calls'
        : quotaType === 'webhook_events'
        ? 'webhook_events'
        : 'data_synced_mb'
    ] || 0;

  return {
    allowed: current < limit,
    current,
    limit,
  };
}

/**
 * Record integration quota usage
 */
export async function recordIntegrationQuotaUsage(
  supabaseUrl: string,
  supabaseServiceKey: string,
  tenantId: string,
  integrationId: string,
  quotaType: 'api_calls' | 'webhook_events' | 'data_synced_mb',
  amount: number
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const today = new Date().toISOString().split('T')[0];

  const updateField =
    quotaType === 'api_calls'
      ? 'api_calls'
      : quotaType === 'webhook_events'
      ? 'webhook_events'
      : 'data_synced_mb';

  const { error } = await supabase.rpc('upsert_integration_quota_usage', {
    p_tenant_id: tenantId,
    p_integration_id: integrationId,
    p_date: today,
    p_field: updateField,
    p_amount: amount,
  });

  if (error) {
    console.error('Error recording quota usage:', error);
  }
}

/**
 * Update integration health
 */
export async function updateIntegrationHealth(
  supabaseUrl: string,
  supabaseServiceKey: string,
  tenantId: string,
  integrationId: string,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: existing } = await supabase
    .from('integration_health')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('integration_id', integrationId)
    .single();

  const consecutiveFailures = success
    ? 0
    : (existing?.consecutive_failures || 0) + 1;

  const healthScore = Math.max(
    0,
    100 - consecutiveFailures * 10 - (existing?.error_count || 0) * 5
  );

  const status =
    consecutiveFailures >= 5
      ? 'error'
      : consecutiveFailures >= 3
      ? 'degraded'
      : 'healthy';

  const updateData: any = {
    health_score: healthScore,
    status,
    consecutive_failures: consecutiveFailures,
    updated_at: new Date().toISOString(),
  };

  if (success) {
    updateData.last_successful_sync = new Date().toISOString();
    updateData.error_message = null;
  } else {
    updateData.last_failed_sync = new Date().toISOString();
    updateData.error_message = errorMessage;
    updateData.error_count = (existing?.error_count || 0) + 1;
  }

  if (consecutiveFailures >= 5) {
    updateData.auto_disabled = true;
  }

  const { error } = await supabase
    .from('integration_health')
    .upsert(
      {
        tenant_id: tenantId,
        integration_id: integrationId,
        ...updateData,
      },
      {
        onConflict: 'tenant_id,integration_id',
      }
    );

  if (error) {
    console.error('Error updating integration health:', error);
  }
}

/**
 * Integration-specific webhook validators
 */
export const webhookValidators = {
  stripe: (payload: string, signature: string, secret: string): boolean => {
    // Stripe uses timestamp + payload format
    const elements = signature.split(',');
    const timestamp = elements.find((e) => e.startsWith('t='))?.substring(2);
    const signatureHash = elements.find((e) => e.startsWith('v1='))?.substring(3);

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

  shopify: (payload: string, signature: string, secret: string): boolean => {
    return validateWebhookSignature(payload, signature, secret, 'sha256');
  },

  paypal: (payload: string, signature: string, secret: string): boolean => {
    // PayPal uses different signature format
    return validateWebhookSignature(payload, signature, secret, 'sha256');
  },
};
