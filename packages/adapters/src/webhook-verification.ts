/**
 * Webhook Verification
 * 
 * Verifies webhook signatures from various providers
 */

import { createHmac } from 'crypto';

export interface WebhookVerificationResult {
  valid: boolean;
  error?: string;
}

/**
 * Verify Stripe webhook signature
 */
export function verifyStripeWebhook(
  payload: string,
  signature: string,
  secret: string
): WebhookVerificationResult {
  try {
    const elements = signature.split(',');
    const timestamp = elements.find((e) => e.startsWith('t='))?.split('=')[1];
    const signatures = elements.filter((e) => e.startsWith('v1=')).map((e) => e.split('=')[1]);

    if (!timestamp || signatures.length === 0) {
      return { valid: false, error: 'Invalid signature format' };
    }

    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    const isValid = signatures.some((sig) => {
      const expected = Buffer.from(expectedSignature, 'hex');
      const received = Buffer.from(sig, 'hex');
      return expected.length === received.length && 
             createHmac('sha256', secret).update(signedPayload).digest('hex') === sig;
    });

    return { valid: isValid, error: isValid ? undefined : 'Invalid signature' };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Verification failed' };
  }
}

/**
 * Verify Plaid webhook signature
 */
export function verifyPlaidWebhook(
  payload: string,
  signature: string,
  secret: string
): WebhookVerificationResult {
  try {
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const isValid = signature === expectedSignature;
    return { valid: isValid, error: isValid ? undefined : 'Invalid signature' };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Verification failed' };
  }
}

/**
 * Verify Chargebee webhook signature
 */
export function verifyChargebeeWebhook(
  payload: string,
  signature: string,
  secret: string
): WebhookVerificationResult {
  try {
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const isValid = signature === expectedSignature;
    return { valid: isValid, error: isValid ? undefined : 'Invalid signature' };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Verification failed' };
  }
}

/**
 * Verify Recurly webhook signature
 */
export function verifyRecurlyWebhook(
  payload: string,
  signature: string,
  secret: string
): WebhookVerificationResult {
  try {
    const expectedSignature = createHmac('sha1', secret)
      .update(payload)
      .digest('hex');

    const isValid = signature === expectedSignature;
    return { valid: isValid, error: isValid ? undefined : 'Invalid signature' };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Verification failed' };
  }
}

/**
 * Verify webhook signature based on provider
 */
export function verifyWebhook(
  providerId: string,
  payload: string,
  signature: string,
  secret: string
): WebhookVerificationResult {
  switch (providerId.toLowerCase()) {
    case 'stripe':
    case 'stripe-connect':
      return verifyStripeWebhook(payload, signature, secret);
    case 'plaid':
      return verifyPlaidWebhook(payload, signature, secret);
    case 'chargebee':
      return verifyChargebeeWebhook(payload, signature, secret);
    case 'recurly':
      return verifyRecurlyWebhook(payload, signature, secret);
    default:
      // For providers without signature verification, return valid
      return { valid: true };
  }
}
