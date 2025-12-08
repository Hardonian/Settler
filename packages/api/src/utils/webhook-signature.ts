import crypto from 'crypto';
import { query } from '../db';

export async function verifyWebhookSignature(
  adapter: string,
  payload: string | Buffer,
  signature: string
): Promise<boolean> {
  // Get webhook config from database
  const configs = await query<{ secret: string; signature_algorithm: string }>(
    'SELECT secret, signature_algorithm FROM webhook_configs WHERE adapter = $1',
    [adapter]
  );

  if (configs.length === 0) {
    throw new Error(`Unknown adapter: ${adapter}`);
  }

  const config = configs[0]!; // Safe: we checked length above
  const payloadBuffer = typeof payload === 'string' ? Buffer.from(payload) : payload;

  switch (adapter) {
    case 'stripe': {
      // Stripe uses HMAC-SHA256 with hex encoding
      const expectedSignature = crypto
        .createHmac('sha256', config.secret)
        .update(payloadBuffer)
        .digest('hex');
      
      // Use timing-safe comparison
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    }

    case 'shopify': {
      // Shopify uses HMAC-SHA256 with base64 encoding
      const hmac = crypto
        .createHmac('sha256', config.secret)
        .update(payloadBuffer)
        .digest('base64');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(hmac)
      );
    }

    case 'paypal': {
      // PayPal uses HMAC-SHA256
      const hmac = crypto
        .createHmac('sha256', config.secret)
        .update(payloadBuffer)
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(hmac)
      );
    }

    default: {
      // Default to HMAC-SHA256
      const algorithm = config.signature_algorithm || 'hmac-sha256';
      if (algorithm === 'hmac-sha256') {
        const hmac = crypto
          .createHmac('sha256', config.secret)
          .update(payloadBuffer)
          .digest('hex');
        
        return crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(hmac)
        );
      }
      throw new Error(`Unsupported signature algorithm: ${algorithm}`);
    }
  }
}

export function generateWebhookSignature(
  payload: string | Buffer,
  secret: string,
  algorithm: string = 'hmac-sha256'
): string {
  const payloadBuffer = typeof payload === 'string' ? Buffer.from(payload) : payload;

  if (algorithm === 'hmac-sha256') {
    return crypto
      .createHmac('sha256', secret)
      .update(payloadBuffer)
      .digest('hex');
  }

  throw new Error(`Unsupported signature algorithm: ${algorithm}`);
}
